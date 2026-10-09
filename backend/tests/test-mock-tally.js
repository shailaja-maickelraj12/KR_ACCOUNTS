/**
 * test-mock-tally.js  —  Node 24 native fetch, no npm deps
 *
 * Tests the mock Tally server on MOCK_TALLY_PORT (default 19000).
 * The mock server must be running:
 *   MOCK_TALLY_PORT=19000 node backend/tests/mock-tally-server.js
 *
 * Then run:
 *   MOCK_TALLY_PORT=19000 node backend/tests/test-mock-tally.js
 *
 * All 5 paths are tested: status, ledger-create, ledger-already-exists,
 * voucher-success, voucher-error.
 */

const PORT = Number(process.env.MOCK_TALLY_PORT || 19000);
const BASE = `http://localhost:${PORT}`;

let pass = 0;
let fail = 0;

const post = async (body) => {
  const r = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body,
    signal: AbortSignal.timeout(5000)
  });
  return r.text();
};

const check = (label, xml, pattern) => {
  const matched = pattern.test(xml);
  if (matched) {
    pass++;
    console.log(`  ✓  PASS  ${label}`);
  } else {
    fail++;
    console.error(`  ✗  FAIL  ${label}`);
    console.error(`           Response: ${xml.replace(/\s+/g, " ").slice(0, 250)}`);
  }
};

console.log(`\n──── Mock Tally Server Tests (port ${PORT}) ────`);

// ── 1. Status (Day Book export) ────────────────────────────────────────────
let xml = await post(
  `<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>` +
  `<BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>Day Book</REPORTNAME>` +
  `<STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>` +
  `<SVFROMDATE>$$MachineDate</SVFROMDATE><SVTODATE>$$MachineDate</SVTODATE>` +
  `</STATICVARIABLES></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`
);
check("Status → company name in XML", xml, /Demo Company/i);

// ── 2. Ledger create (new) ─────────────────────────────────────────────────
xml = await post(
  `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST>` +
  `<TYPE>Data</TYPE><ID>All Masters</ID></HEADER>` +
  `<BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>` +
  `<REQUESTDATA><TALLYMESSAGE xmlns:UDF="TallyUDF">` +
  `<LEDGER NAME="Test Supplier" ACTION="Create">` +
  `<NAME>Test Supplier</NAME><PARENT>Sundry Creditors</PARENT>` +
  `</LEDGER></TALLYMESSAGE></REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`
);
check("Ledger create (new)   → <CREATED>1</CREATED>", xml, /<CREATED>1<\/CREATED>/i);

// ── 3. Ledger already exists ───────────────────────────────────────────────
xml = await post(
  `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST>` +
  `<TYPE>Data</TYPE><ID>All Masters</ID></HEADER>` +
  `<BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC>` +
  `<REQUESTDATA><TALLYMESSAGE xmlns:UDF="TallyUDF">` +
  `<LEDGER NAME="existing supplier" ACTION="Create">` +
  `<NAME>existing supplier</NAME><PARENT>Sundry Creditors</PARENT>` +
  `</LEDGER></TALLYMESSAGE></REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`
);
// The mock returns LINEERROR with "Already Exists" text (matching real Tally)
check("Ledger already exists → LINEERROR + Already Exists", xml, /Already Exists/i);
// tallyService.js checks for /already exists/i — must be treated as success
check("  (tallyService treats this as success — no hard ERROR)", xml, /ERRORS>0<\/ERRORS/i);

// ── 4. Voucher post (success) ──────────────────────────────────────────────
xml = await post(
  `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>` +
  `<BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>` +
  `<REQUESTDATA><TALLYMESSAGE xmlns:UDF="TallyUDF">` +
  `<VOUCHER VCHTYPE="Journal" ACTION="Create">` +
  `<VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>` +
  `<DATE>20260924</DATE><EFFECTIVEDATE>20260924</EFFECTIVEDATE>` +
  `<VOUCHERNUMBER>JV-001</VOUCHERNUMBER>` +
  `<NARRATION>[Production] Test narration</NARRATION>` +
  `<ALLLEDGERENTRIES.LIST><LEDGERNAME>Test Supplier</LEDGERNAME>` +
  `<ISDEEMEDPOSITIVE>YES</ISDEEMEDPOSITIVE><AMOUNT>-5000.00</AMOUNT></ALLLEDGERENTRIES.LIST>` +
  `<ALLLEDGERENTRIES.LIST><LEDGERNAME>Cash</LEDGERNAME>` +
  `<ISDEEMEDPOSITIVE>NO</ISDEEMEDPOSITIVE><AMOUNT>5000.00</AMOUNT></ALLLEDGERENTRIES.LIST>` +
  `</VOUCHER></TALLYMESSAGE></REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`
);
check("Voucher post (success) → <CREATED>1</CREATED>", xml, /<CREATED>1<\/CREATED>/i);
// Note: real Tally also emits <LASTVOUCHERID>; the mock and service both support it

// ── 5. Voucher post (forced error) ────────────────────────────────────────
xml = await post(
  `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>` +
  `<BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>` +
  `<REQUESTDATA><TALLYMESSAGE xmlns:UDF="TallyUDF">` +
  `<VOUCHER VCHTYPE="Journal" ACTION="Create">` +
  `<VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>` +
  `<DATE>20260924</DATE><EFFECTIVEDATE>20260924</EFFECTIVEDATE>` +
  `<NARRATION>FORCE_ERROR test</NARRATION>` +
  `</VOUCHER></TALLYMESSAGE></REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`
);
check("Voucher post (force error) → <LINEERROR>", xml, /LINEERROR/i);

// ── Summary ───────────────────────────────────────────────────────────────
console.log(`\n──── Results: ${pass} passed, ${fail} failed ────\n`);
process.exit(fail > 0 ? 1 : 0);
