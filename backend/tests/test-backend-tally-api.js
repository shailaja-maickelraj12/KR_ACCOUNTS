/**
 * test-backend-tally-api.js
 * 
 * Verifies that the Express Backend's Tally endpoints are properly working:
 * 1. GET /ams/tally/status -> checks if Tally is reachable and returns company info
 * 2. POST /ams/tally/post-voucher -> tests auto-creating ledgers and posting a Journal Voucher
 * 
 * Usage:
 *   Ensure the backend server is running (npm run dev inside backend/).
 *   Then run:
 *   node backend/tests/test-backend-tally-api.js
 */

const API_BASE = "http://localhost:6400/ams/tally";

async function runTests() {
  console.log("\n=======================================================");
  console.log("   KR ACCOUNTS ERP -> TALLY INTEGRATION HEALTH CHECK   ");
  console.log("=======================================================\n");

  // TEST 1: Check Tally Reachability / Status
  console.log("[1/2] Testing GET /ams/tally/status...");
  try {
    const statusRes = await fetch(`${API_BASE}/status`);
    const statusData = await statusRes.json();
    console.log("Status Response:", statusData);
    if (statusData.reachable) {
      console.log(`  PASS: Tally is reachable! Active Company: "${statusData.company}"`);
    } else {
      console.log(`  WARNING: Tally is not reachable (${statusData.error}).`);
      console.log("   (Make sure Tally Prime is open with ODBC/HTTP port 9000 enabled, or mock server is running)");
    }
  } catch (err) {
    console.error(`  FAIL: Backend server is not running on http://localhost:6400 (${err.message})`);
    return;
  }

  // TEST 2: Post a sample Journal Voucher
  console.log("\n[2/2] Testing POST /ams/tally/post-voucher...");
  const sampleJV = {
    voucher: {
      voucherNo: "JV-TEST-" + Math.floor(1000 + Math.random() * 9000),
      voucherDate: new Date().toISOString().split("T")[0],
      narration: "Verification of Tally Integration and Ledger Auto-Creation",
      items: [
        {
          accountCode: "ACC-TEST-EXP",
          accountName: "Printing & Stationery Expenses",
          debit: 2500,
          credit: 0
        },
        {
          accountCode: "ACC-TEST-CASH",
          accountName: "Cash",
          debit: 0,
          credit: 2500
        }
      ]
    },
    department: "Administration"
  };

  try {
    const postRes = await fetch(`${API_BASE}/post-voucher`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sampleJV)
    });
    const postData = await postRes.json();
    console.log("Post Voucher Response:", JSON.stringify(postData, null, 2));

    if (postData.success) {
      console.log("\n=======================================================");
      console.log("  PASS: Journal Voucher posted successfully to Tally!");
      console.log("  Auto-created / verified ledgers:");
      postData.createdLedgers?.forEach(l => console.log("   - " + l));
      console.log("=======================================================\n");
    } else {
      console.log("\n  FAILED: Tally rejected voucher:", postData.error);
    }
  } catch (err) {
    console.error("  FAIL: Request to /post-voucher failed:", err.message);
  }
}

runTests();
