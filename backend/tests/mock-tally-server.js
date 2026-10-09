/**
 * mock-tally-server.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight mock of the Tally HTTP XML Gateway.
 *
 * Covers all paths needed by tallyService.js:
 *   1. Status check  — "Export Data / Day Book"  (any Export Data request)
 *   2. Master import — "Import Data / All Masters" (LEDGER Create)
 *      • Returns <CREATED>1</CREATED> for a NEW ledger
 *      • Returns LINEERROR "Already Exists" for a ledger name containing "existing"
 *   3. Voucher import — "Import Data / Vouchers"
 *      • Returns <CREATED>1</CREATED> + <LASTVOUCHERID> on success
 *      • Returns <LINEERROR> when the body contains the word "FORCE_ERROR"
 *
 * Usage (unit / CI testing — when real Tally is NOT running):
 *   MOCK_TALLY_PORT=19000 node backend/tests/mock-tally-server.js
 *   MOCK_TALLY_PORT=19000 node backend/tests/test-mock-tally.js
 *
 * NOTE: If real Tally Prime is already running on port 9000, use a different
 * port for the mock (e.g. 19000) so they don't conflict.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import http from "http";

const PORT = Number(process.env.MOCK_TALLY_PORT || 19000);

// ── XML Response builders ─────────────────────────────────────────────────────

const statusResponse = () => `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <BODY>
    <DATA>
      <COLLECTION>
        <COMPANY>
          <COMPANYNAME>Demo Company (Mock)</COMPANYNAME>
        </COMPANY>
      </COLLECTION>
    </DATA>
  </BODY>
</ENVELOPE>`;

const ledgerCreatedResponse = () => `<?xml version="1.0" encoding="utf-8"?>
<RESPONSE>
 <CREATED>1</CREATED>
 <ALTERED>0</ALTERED>
 <DELETED>0</DELETED>
 <COMBINED>0</COMBINED>
 <IGNORED>0</IGNORED>
 <ERRORS>0</ERRORS>
</RESPONSE>`;

// Mirrors the actual Tally Prime response for an already-existing ledger
const ledgerAlreadyExistsResponse = (name) => `<?xml version="1.0" encoding="utf-8"?>
<RESPONSE>
 <LINEERROR>Ledger Already Exists : ${name}</LINEERROR>
 <CREATED>0</CREATED>
 <ALTERED>0</ALTERED>
 <DELETED>0</DELETED>
 <COMBINED>0</COMBINED>
 <IGNORED>0</IGNORED>
 <ERRORS>0</ERRORS>
</RESPONSE>`;

const voucherCreatedResponse = () => `<?xml version="1.0" encoding="utf-8"?>
<RESPONSE>
 <CREATED>1</CREATED>
 <ALTERED>0</ALTERED>
 <DELETED>0</DELETED>
 <LASTVCHID>VCH-MOCK-001</LASTVCHID>
 <LASTVOUCHERID>VCH-MOCK-001</LASTVOUCHERID>
 <COMBINED>0</COMBINED>
 <IGNORED>0</IGNORED>
 <ERRORS>0</ERRORS>
</RESPONSE>`;

const voucherErrorResponse = (msg) => `<?xml version="1.0" encoding="utf-8"?>
<RESPONSE>
 <LINEERROR>${msg}</LINEERROR>
 <CREATED>0</CREATED>
 <ALTERED>0</ALTERED>
 <DELETED>0</DELETED>
 <COMBINED>0</COMBINED>
 <IGNORED>0</IGNORED>
 <ERRORS>1</ERRORS>
</RESPONSE>`;

// ── Request classifier ────────────────────────────────────────────────────────

const classify = (body) => {
  const upper = body.toUpperCase();
  if (upper.includes("EXPORT DATA") || upper.includes("DAY BOOK") || upper.includes("LIST OF COMPANIES")) return "STATUS";
  if (upper.includes("ALL MASTERS") || upper.includes("<LEDGER")) return "LEDGER_IMPORT";
  if (upper.includes("<VOUCHER") || upper.includes("REPORTNAME>VOUCHERS")) return "VOUCHER_IMPORT";
  return "UNKNOWN";
};

const extractLedgerName = (body) => {
  const m = body.match(/<LEDGER\s+NAME="([^"]+)"/i);
  return m ? m[1] : "Unknown";
};

let reqCount = 0;

// ── HTTP Server ───────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    reqCount++;
    const type = classify(body);
    console.log(`[Mock Tally #${reqCount}] ${req.method} ${req.url} -> ${type}`);

    res.setHeader("Content-Type", "text/xml; charset=utf-8");
    res.statusCode = 200;

    if (type === "STATUS") {
      res.end(statusResponse());
      return;
    }

    if (type === "LEDGER_IMPORT") {
      const ledgerName = extractLedgerName(body);
      console.log(`  → Ledger: "${ledgerName}"`);
      if (/existing/i.test(ledgerName)) {
        console.log(`  ← Already Exists`);
        res.end(ledgerAlreadyExistsResponse(ledgerName));
      } else {
        console.log(`  ← Created`);
        res.end(ledgerCreatedResponse());
      }
      return;
    }

    if (type === "VOUCHER_IMPORT") {
      if (/FORCE_ERROR/i.test(body)) {
        console.log(`  ← Error (FORCE_ERROR trigger)`);
        res.end(voucherErrorResponse("Voucher type mismatch — forced error for testing"));
        return;
      }
      console.log(`  ← Voucher Created`);
      res.end(voucherCreatedResponse());
      return;
    }

    console.log(`  ← 400 Unknown XML`);
    res.statusCode = 400;
    res.end(`<ERROR>Unknown Tally request</ERROR>`);
  });
});

server.listen(PORT, () => {
  console.log(`\n[Mock Tally Server] Listening on http://localhost:${PORT}`);
  console.log(`Paths covered:`);
  console.log(`  Export Data (status)  → 200 with COMPANYNAME`);
  console.log(`  Ledger import (new)   → CREATED:1`);
  console.log(`  Ledger import (name contains "existing") → LINEERROR Already Exists`);
  console.log(`  Voucher import        → CREATED:1 + LASTVOUCHERID`);
  console.log(`  Voucher import (body contains FORCE_ERROR) → LINEERROR\n`);
});
