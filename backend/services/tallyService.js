import { Account } from "../models/index.js";

const escapeXml = (str = "") => {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const decodeXmlEntities = (str = "") => {
  return String(str)
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
};

const extractTallyError = (xmlText = "", voucherDate = "") => {
  const lineErr = xmlText.match(/<LINEERROR>(.*?)<\/LINEERROR>/i);
  let rawErr = lineErr ? lineErr[1].trim() : "";
  if (!rawErr) {
    const errDesc = xmlText.match(/<ERROR>(.*?)<\/ERROR>/i);
    rawErr = errDesc ? errDesc[1].trim() : (xmlText.trim() || "Unknown error response from Tally");
  }
  rawErr = decodeXmlEntities(rawErr);

  if (/voucher date is missing/i.test(rawErr)) {
    return `${rawErr} (Note: If Tally is running in Educational/Demo mode, vouchers can only be saved on the 1st, 2nd, or 31st of any month. Please set voucher date to 1st or 2nd, e.g., ${voucherDate ? voucherDate.substring(0, 8) + '01' : 'YYYY-MM-01'})`;
  }
  return rawErr;
};


export const getTallyStatus = async () => {
  const tallyUrl = process.env.TALLY_URL || "http://localhost:9000";
  // Tally Prime: request company info via Collection export — works across TallyPrime versions
  const statusXml = `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Day Book</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <SVFROMDATE>$$MachineDate</SVFROMDATE>
          <SVTODATE>$$MachineDate</SVTODATE>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(tallyUrl, {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body: statusXml,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Any HTTP 200 from Tally = it is running and a company is open
    if (!response.ok) {
      return { reachable: false, company: null, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const xmlText = await response.text();
    // Try multiple known Tally XML company-name tags
    const companyMatch =
      xmlText.match(/<COMPANYNAME>(.*?)<\/COMPANYNAME>/i) ||
      xmlText.match(/<CURRENTCOMPANY>(.*?)<\/CURRENTCOMPANY>/i) ||
      xmlText.match(/<COMPANY>(.*?)<\/COMPANY>/i);

    const companyName = companyMatch ? companyMatch[1].trim() : "Tally Company";

    return { reachable: true, company: companyName };

  } catch (error) {
    return {
      reachable: false,
      company: null,
      error: error.name === "AbortError" ? "Tally server request timed out" : (error.message || "Tally is unreachable")
    };
  }
};

export const mapAccountToTallyParent = (account) => {
  const defaultParent = process.env.TALLY_DEFAULT_PARENT || "Sundry Creditors";
  if (!account) return defaultParent;

  const combined = `${account.groupName || ""} ${account.subGroupName || ""} ${account.name || ""} ${account.accountName || ""}`.toLowerCase();

  if (combined.includes("debtor") || combined.includes("customer")) return "Sundry Debtors";
  if (combined.includes("creditor") || combined.includes("supplier") || combined.includes("liabilit")) return "Sundry Creditors";
  if (combined.includes("bank")) return "Bank Accounts";
  if (combined.includes("cash")) return "Cash-in-Hand";
  if (combined.includes("sales") || combined.includes("income")) return "Sales Accounts";
  if (combined.includes("purchase")) return "Purchase Accounts";
  if (combined.includes("expense") || combined.includes("round off")) return "Indirect Expenses";
  if (combined.includes("asset") || combined.includes("machinery") || combined.includes("plant")) return "Fixed Assets";
  if (combined.includes("duty") || combined.includes("tax") || combined.includes("gst") || combined.includes("tds") || combined.includes("tcs")) return "Duties & Taxes";

  return defaultParent;
};

export const autoCreateLedger = async (ledgerName, parentGroup) => {
  const tallyUrl = process.env.TALLY_URL || "http://localhost:9000";

  const masterImportXml = `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>All Masters</ID>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="${escapeXml(ledgerName)}" ACTION="Create">
            <NAME>${escapeXml(ledgerName)}</NAME>
            <PARENT>${escapeXml(parentGroup)}</PARENT>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

  try {
    const response = await fetch(tallyUrl, {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body: masterImportXml
    });

    const resText = await response.text();
    const isAlreadyExisted = /already exists/i.test(resText);
    // Require an explicit positive signal — do not assume success from silence alone
    const isCreated = /<CREATED>1<\/CREATED>/i.test(resText) || /<ERRORS>0<\/ERRORS>/i.test(resText);
    const hasLineError = /LINEERROR/i.test(resText);

    if (isAlreadyExisted) {
      return { success: true, created: false, status: "Already Existed", ledgerName, parentGroup };
    }

    if (isCreated && !hasLineError) {
      return { success: true, created: true, status: "Created", ledgerName, parentGroup };
    }

    return {
      success: false,
      error: extractTallyError(resText),
      ledgerName,
      parentGroup
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to communicate with Tally server for ledger creation",
      ledgerName,
      parentGroup
    };
  }
};

export const postVoucherToTally = async ({ voucher, department }) => {
  const tallyUrl = process.env.TALLY_URL || "http://localhost:9000";
  const voucherType = process.env.TALLY_VOUCHER_TYPE || "Journal";
  const autoCreate = String(process.env.TALLY_AUTO_CREATE_LEDGERS || "true").toLowerCase() === "true";

  if (!voucher || !Array.isArray(voucher.items) || voucher.items.length === 0) {
    return { success: false, error: "Invalid voucher data or empty line items" };
  }

  const validItems = voucher.items.filter(it => it.accountName || it.accountCode);
  if (validItems.length === 0) {
    return { success: false, error: "No valid account items in voucher" };
  }

  const createdLedgers = [];

  // 1. Auto-create missing ledgers if enabled
  if (autoCreate) {
    const dbAccounts = await Account.findAll();
    const accountMap = new Map();
    dbAccounts.forEach(acc => {
      const plain = acc.toJSON();
      accountMap.set(plain.code, { ...plain.payload, ...plain });
      if (plain.name) accountMap.set(plain.name.toLowerCase(), { ...plain.payload, ...plain });
    });

    for (const item of validItems) {
      const ledgerName = item.accountName || item.accountCode;
      const accInfo = accountMap.get(item.accountCode) || accountMap.get(String(ledgerName).toLowerCase()) || null;
      const parentGroup = mapAccountToTallyParent(accInfo);

      const result = await autoCreateLedger(ledgerName, parentGroup);
      if (result.success) {
        createdLedgers.push(`${ledgerName} (${result.status} -> ${parentGroup})`);
      } else {
        // Log error but proceed if needed or warn
        createdLedgers.push(`${ledgerName} (Failed: ${result.error})`);
      }
    }
  }

  // 2. Format Narration
  let narrationText = voucher.narration || validItems[0]?.narration || "";
  if (department && department.trim()) {
    narrationText = `[${department.trim()}] ${narrationText}`.trim();
  }

  // 3. Format Date to YYYYMMDD
  const rawDate = voucher.voucherDate || new Date().toISOString().split("T")[0];
  const formattedDate = rawDate.replace(/-/g, "");

  // 4. Construct Voucher XML
  let ledgerEntriesXml = "";
  for (const item of validItems) {
    const lName = escapeXml(item.accountName || item.accountCode);
    const debit = parseFloat(item.debit) || 0;
    const credit = parseFloat(item.credit) || 0;

    if (debit > 0) {
      ledgerEntriesXml += `
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${lName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>YES</ISDEEMEDPOSITIVE>
              <AMOUNT>-${debit.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
    } else if (credit > 0) {
      ledgerEntriesXml += `
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${lName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>NO</ISDEEMEDPOSITIVE>
              <AMOUNT>${credit.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
    }
  }

  // Tally Prime requires VOUCHERTYPENAME before DATE; EFFECTIVEDATE is also required.
  const voucherXml = `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="${voucherType}" ACTION="Create">
            <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
            <DATE>${formattedDate}</DATE>
            <EFFECTIVEDATE>${formattedDate}</EFFECTIVEDATE>
            <VOUCHERNUMBER>${escapeXml(voucher.voucherNo)}</VOUCHERNUMBER>
            <NARRATION>${escapeXml(narrationText)}</NARRATION>${ledgerEntriesXml}
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;


  try {
    const response = await fetch(tallyUrl, {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body: voucherXml
    });

    const resText = await response.text();
    // <CREATED>1 is the canonical Tally success signal; <LASTVOUCHERID> is also emitted on create
    const isCreated = /<CREATED>1<\/CREATED>/i.test(resText) || /<LASTVOUCHERID>/i.test(resText);

    if (isCreated) {
      return {
        success: true,
        message: `Voucher ${voucher.voucherNo} posted successfully to Tally!`,
        createdLedgers,
        tallyResponse: resText
      };
    } else {
      return {
        success: false,
        error: extractTallyError(resText, voucher.voucherDate),
        createdLedgers,
        tallyResponse: resText
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || "Network error while connecting to Tally",
      createdLedgers
    };
  }
};
