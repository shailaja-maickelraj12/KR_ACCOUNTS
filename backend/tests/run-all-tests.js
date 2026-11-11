/**
 * KR Accounts ERP — Comprehensive Test Suite
 * Tests all core subsystems:
 * 1. Database & Models Connectivity
 * 2. Multi-Profile Authentication (Normal, Jegathesh Sir, Suresh Sir)
 * 3. Double-Entry Accounting Engine & Balance Verification
 * 4. External Sales Invoice to Balanced Journal Voucher Processing
 * 5. Tally XML Envelope Generation & Mock Tally Integration
 */

import { spawn } from "child_process";
import { sequelize, User, Account, Group, SubGroup, Voucher, VoucherItem } from "../models/index.js";
import { loginUser } from "../services/accountService.js";
import { processInvoiceToJV } from "../services/invoiceService.js";
import { buildVoucherXml } from "../services/tallyService.js";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${message}`);
  }
}

async function runAll() {
  console.log("\n=======================================================");
  console.log("      KR ACCOUNTS ERP — AUTOMATED TEST SUITE          ");
  console.log("=======================================================\n");

  // 1. DATABASE & MODELS TEST
  console.log("[1/5] Testing Database Connection & Sequelize Models...");
  try {
    await sequelize.authenticate();
    assert(true, "Database connection authenticated (MySQL)");

    const userCount = await User.count();
    assert(userCount >= 3, `Users table populated with ${userCount} user accounts`);

    const groupCount = await Group.count();
    assert(groupCount >= 0, "Group master model accessible");
  } catch (err) {
    assert(false, `Database connection failed: ${err.message}`);
  }

  // 2. AUTHENTICATION & LOGIN TEST
  console.log("\n[2/5] Testing User Authentication & Executive Profiles...");
  try {
    // Normal Admin
    const adminRes = await loginUser("admin", "123456");
    assert(adminRes.success === true && adminRes.user === "admin", "Normal Login (admin) successful");

    // Jegathesh Sir
    const jegRes = await loginUser("Jegathesh Sir", "123456");
    assert(jegRes.success === true && jegRes.user.includes("Jegathesh"), "Executive Login (Jegathesh Sir) successful");

    // Suresh Sir
    const surRes = await loginUser("Suresh Sir", "123456");
    assert(surRes.success === true && surRes.user.includes("Suresh"), "Executive Login (Suresh Sir) successful");

    // Case-insensitivity check
    const caseRes = await loginUser("jegathesh", "password123");
    assert(caseRes.success === true, "Case-insensitive username matching functional");

    // Invalid password check
    const badRes = await loginUser("admin", "wrongpassword");
    assert(badRes.success === false, "Unauthorized password correctly rejected");
  } catch (err) {
    assert(false, `Auth test error: ${err.message}`);
  }

  // 3. SALES INVOICE TO JOURNAL VOUCHER DOUBLE-ENTRY TEST
  console.log("\n[3/5] Testing Sales Invoice to Double-Entry JV Conversion...");
  try {
    const sampleInvoice = {
      id: 999,
      invoiceNo: "TEST-INV-999",
      invoiceDate: "2026-10-11",
      invoiceType: "GST WASTE SALE INVOICE",
      buyer: {
        supplierId: 999,
        accountName: "TEST COTTON MILLS LTD",
        code: "60000999",
        gstin: "33TEST1234F1Z5"
      },
      salesOrder: { salesOrderId: 999, orderNo: "SO-999", wasteLot: "1" },
      financials: {
        subTotal: 100000.00,
        gstAmount: 18000.00,
        tcsPercent: 0.10,
        tcsRs: 100.00,
        roundOff: -0.10,
        invoiceValue: 118099.90
      },
      dispatchDetails: { vehicleNo: "TN 38 AA 1234" }
    };

    const jvResult = await processInvoiceToJV(sampleInvoice);
    assert(jvResult.success === true, "Invoice processed into Journal Voucher");

    if (jvResult.voucher) {
      const items = jvResult.voucher.items || [];
      const totalDebit = items.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
      const totalCredit = items.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
      const diff = Math.abs(totalDebit - totalCredit);

      assert(diff < 0.05, `Strict Double-Entry Balance satisfied: Debit (₹${totalDebit}) == Credit (₹${totalCredit})`);
      assert(items.some(it => it.accountName.includes("TEST COTTON MILLS")), "Customer Ledger row generated");
      assert(items.some(it => it.accountName.includes("Waste Sales")), "Revenue Ledger row generated");
    }
  } catch (err) {
    assert(false, `Invoice conversion error: ${err.message}`);
  }

  // 4. TALLY XML ENVELOPE GENERATOR TEST
  console.log("\n[4/5] Testing Tally XML Envelope Generator...");
  try {
    const sampleVoucher = {
      voucherNo: "JV-00001",
      voucherDate: "2026-10-11",
      narration: "Test Tally Export Voucher",
      totalAmount: 5000,
      items: [
        { accountName: "Printing Expenses", debit: 5000, credit: 0 },
        { accountName: "Cash", debit: 0, credit: 5000 }
      ]
    };

    const xml = buildVoucherXml(sampleVoucher);
    assert(xml.includes("<ENVELOPE>"), "Tally <ENVELOPE> root tag generated");
    assert(xml.includes("<VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>"), "Voucher Type mapped to Journal");
    assert(xml.includes("Printing Expenses"), "Ledger entries mapped correctly");
    assert(xml.includes("<ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>"), "Debit line flagged positive for Tally");
  } catch (err) {
    assert(false, `Tally generator error: ${err.message}`);
  }

  // 5. MOCK TALLY SERVER END-TO-END SUITE
  console.log("\n[5/5] Testing Mock Tally Prime Server Endpoints...");
  try {
    const server = spawn("node", ["backend/tests/mock-tally-server.js"], {
      env: { ...process.env, MOCK_TALLY_PORT: "19001" }
    });

    await new Promise(r => setTimeout(r, 600));

    const statusRes = await fetch("http://localhost:19001", {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body: "<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>Day Book</REPORTNAME></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>"
    });
    const statusText = await statusRes.text();
    assert(statusText.includes("<COMPANYNAME>"), "Mock Tally Prime server responds with active Company info");

    server.kill();
  } catch (err) {
    assert(false, `Mock Tally test error: ${err.message}`);
  }

  console.log("\n=======================================================");
  console.log(`  FINAL RESULT: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${totalTests})`);
  console.log("=======================================================\n");

  await sequelize.close();
  process.exit(failedTests === 0 ? 0 : 1);
}

runAll().catch(err => {
  console.error("Fatal Test Suite Error:", err);
  process.exit(1);
});
