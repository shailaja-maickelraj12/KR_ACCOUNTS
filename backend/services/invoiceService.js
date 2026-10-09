import { Account } from "../models/index.js";
import { saveAccount } from "./accountService.js";
import { saveVoucher } from "./voucherService.js";

/**
 * Ensures an Account exists in KR Accounts database, or creates it automatically.
 */
async function ensureAccount(name, preferredCode = "", groupName = "Sundry Debtors", subGroupName = "Sundry Debtors") {
  if (!name || !name.trim()) return { code: preferredCode || "ACC_UNKNOWN", name: name || "Unknown Account" };

  const trimmedName = name.trim();
  const allAccounts = await Account.findAll();

  // 1. Match by code or exact name (case-insensitive)
  let existing = allAccounts.find(a => 
    (preferredCode && String(a.code).trim() === String(preferredCode).trim()) ||
    (a.name && a.name.trim().toLowerCase() === trimmedName.toLowerCase())
  );

  if (existing) {
    const plain = existing.toJSON();
    return { ...plain.payload, ...plain };
  }

  // 2. Auto-create missing account in database
  const newAccountData = {
    code: preferredCode ? String(preferredCode).trim() : undefined,
    name: trimmedName,
    groupName,
    subGroupName,
    openingDebit: 0,
    openingCredit: 0
  };

  const created = await saveAccount(newAccountData);
  return created;
}

/**
 * Processes an incoming Invoice JSON payload from Sales Module and converts it into a Journal Voucher.
 */
export const processInvoiceToJV = async (invoiceData) => {
  const invoice = invoiceData.invoice || invoiceData;

  if (!invoice || !invoice.invoiceNo) {
    throw new Error("Invalid invoice payload: missing invoiceNo");
  }

  const invoiceNo = String(invoice.invoiceNo).trim();
  const invoiceDate = invoice.invoiceDate || new Date().toISOString().split("T")[0];
  const buyer = invoice.buyer || {};
  const financials = invoice.financials || {};
  const salesOrder = invoice.salesOrder || {};
  const dispatch = invoice.dispatchDetails || {};

  const buyerName = buyer.accountName || `Buyer ID #${buyer.supplierId || "Unknown"}`;
  const buyerCode = buyer.code || (buyer.supplierId ? `SUP-${buyer.supplierId}` : "");

  // 1. Ensure Ledgers exist in Accounts Master
  const buyerAccount = await ensureAccount(buyerName, buyerCode, "Sundry Debtors", "Sundry Debtors");
  const salesAccount = await ensureAccount("Waste Sales Account", "ACC_WASTE_SALES", "Sales Accounts", "Sales Accounts");
  
  let cgstAccount = null;
  let sgstAccount = null;
  let igstAccount = null;

  const totalGst = (Number(financials.gstAmount) || 0) + (Number(financials.igstAmount) || 0);
  const cgstVal = Number(financials.cgstAmount) || (Number(financials.gstAmount) ? Math.round((Number(financials.gstAmount) / 2) * 100) / 100 : 0);
  const sgstVal = Number(financials.sgstAmount) || (Number(financials.gstAmount) ? Math.round((Number(financials.gstAmount) / 2) * 100) / 100 : 0);
  const igstVal = Number(financials.igstAmount) || 0;

  if (cgstVal > 0) {
    cgstAccount = await ensureAccount("Output CGST", "ACC_OUTPUT_CGST", "Duties & Taxes", "GST Output");
  }
  if (sgstVal > 0) {
    sgstAccount = await ensureAccount("Output SGST", "ACC_OUTPUT_SGST", "Duties & Taxes", "GST Output");
  }
  if (igstVal > 0) {
    igstAccount = await ensureAccount("Output IGST", "ACC_OUTPUT_IGST", "Duties & Taxes", "GST Output");
  }

  let tcsAccount = null;
  const tcsRs = Number(financials.tcsRs) || 0;
  if (tcsRs > 0) {
    tcsAccount = await ensureAccount("TCS Payable", "ACC_TCS_PAYABLE", "Duties & Taxes", "TCS Payable");
  }

  let roundOffAccount = null;
  const roundOff = Number(financials.roundOff) || 0;
  if (roundOff !== 0) {
    roundOffAccount = await ensureAccount("Round Off Account", "ACC_ROUND_OFF", "Indirect Expenses", "Round Off");
  }

  // 2. Build Voucher Line Items (Double-Entry Balance)
  const items = [];
  const salesValue = Number(financials.subTotal) || Number(financials.assessableValue) || 0;
  
  // Buyer Debit MUST equal the exact sum of all credit lines so Debits === Credits
  const calculatedTotal = salesValue + cgstVal + sgstVal + igstVal + tcsRs + roundOff;
  const buyerDebit = Math.round(calculatedTotal * 100) / 100;

  // Line 1: DEBIT Buyer (Total Invoice Value)
  items.push({
    id: `L1_${Date.now()}`,
    accountCode: buyerAccount.code,
    accountName: buyerAccount.name,
    debit: buyerDebit,
    credit: 0,
    narration: `Invoice #${invoiceNo} for ${buyerName}`
  });

  // Line 2: CREDIT Waste Sales Account
  items.push({
    id: `L2_${Date.now()}`,
    accountCode: salesAccount.code,
    accountName: salesAccount.name,
    debit: 0,
    credit: salesValue,
    narration: `Waste sales revenue for Inv #${invoiceNo}`
  });

  // Line 3: CREDIT Output CGST (if tax exists)
  if (cgstAccount && cgstVal > 0) {
    items.push({
      id: `L3_CGST_${Date.now()}`,
      accountCode: cgstAccount.code,
      accountName: cgstAccount.name,
      debit: 0,
      credit: cgstVal,
      narration: `Output CGST on Inv #${invoiceNo}`
    });
  }

  // Line 4: CREDIT Output SGST (if tax exists)
  if (sgstAccount && sgstVal > 0) {
    items.push({
      id: `L3_SGST_${Date.now()}`,
      accountCode: sgstAccount.code,
      accountName: sgstAccount.name,
      debit: 0,
      credit: sgstVal,
      narration: `Output SGST on Inv #${invoiceNo}`
    });
  }

  // Line 5: CREDIT Output IGST (if inter-state tax exists)
  if (igstAccount && igstVal > 0) {
    items.push({
      id: `L3_IGST_${Date.now()}`,
      accountCode: igstAccount.code,
      accountName: igstAccount.name,
      debit: 0,
      credit: igstVal,
      narration: `Output IGST on Inv #${invoiceNo}`
    });
  }

  // Line 6: CREDIT TCS Payable (if applicable)
  if (tcsAccount && tcsRs > 0) {
    items.push({
      id: `L4_${Date.now()}`,
      accountCode: tcsAccount.code,
      accountName: tcsAccount.name,
      debit: 0,
      credit: tcsRs,
      narration: `TCS @ ${financials.tcsPercent || 0}% on Inv #${invoiceNo}`
    });
  }

  // Line 7: Round Off adjustment (Debit if negative roundoff, Credit if positive)
  if (roundOffAccount && roundOff !== 0) {
    items.push({
      id: `L5_${Date.now()}`,
      accountCode: roundOffAccount.code,
      accountName: roundOffAccount.name,
      debit: roundOff < 0 ? Math.abs(roundOff) : 0,
      credit: roundOff > 0 ? roundOff : 0,
      narration: `Round off adjustment on Inv #${invoiceNo}`
    });
  }

  // 3. Construct Complete Journal Voucher Payload
  const narrationStr = `[Sales Module Invoice #${invoiceNo}] Buyer: ${buyerName}` +
    (salesOrder.orderNo ? `, Sales Order #${salesOrder.orderNo}` : "") +
    (dispatch.ewayBillNo ? `, E-Way Bill: ${dispatch.ewayBillNo}` : "");

  const voucherData = {
    id: `INV_JV_${invoiceNo}_${Date.now()}`,
    voucherNo: `INV-${invoiceNo}`,
    voucherDate: invoiceDate,
    type: "JV",
    billNo: invoiceNo,
    billDate: invoiceDate,
    narration: narrationStr,
    totalAmount: buyerDebit,
    items,
    sourceInvoiceId: invoice.id || invoiceNo,
    sourceSystem: "Sales Module"
  };

  // 4. Save to Database using existing voucherService
  const savedVoucher = await saveVoucher(voucherData);

  return {
    success: true,
    message: `Invoice #${invoiceNo} processed successfully into Journal Voucher (${savedVoucher.voucherNo})`,
    voucher: savedVoucher
  };
};

export const fetchAndSyncInvoicesFromSalesModule = async (
  salesApiUrl = process.env.SALES_API_URL || "http://127.0.0.1:5000/api/v1/external/invoices",
  apiKey = process.env.SALES_MODULE_API_KEY || "sales_module_secret_key_2026"
) => {
  const targetUrls = [
    salesApiUrl,
    "http://127.0.0.1:5000/api/v1/external/invoices",
    "http://localhost:5000/api/v1/external/invoices"
  ];
  const uniqueUrls = [...new Set(targetUrls)];

  let lastError = null;

  for (const baseUrl of uniqueUrls) {
    try {
      let page = 1;
      let totalPages = 1;
      let allInvoices = [];

      do {
        const separator = baseUrl.includes("?") ? "&" : "?";
        const fetchUrl = `${baseUrl}${separator}limit=500&page=${page}`;

        const response = await fetch(fetchUrl, {
          headers: {
            "X-API-KEY": apiKey,
            "ngrok-skip-browser-warning": "true"
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const invoicesList = data.data?.invoices || data.invoices || (Array.isArray(data) ? data : []);
        totalPages = data.data?.totalPages || data.totalPages || 1;

        allInvoices.push(...invoicesList);
        page++;
      } while (page <= totalPages);

      const syncedResults = [];
      for (const inv of allInvoices) {
        try {
          const res = await processInvoiceToJV(inv);
          syncedResults.push(res);
        } catch (err) {
          syncedResults.push({ success: false, invoiceNo: inv.invoiceNo, error: err.message });
        }
      }

      return { success: true, count: syncedResults.length, results: syncedResults };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    success: false,
    error: `Sales Module server is unreachable (${lastError?.message || "Connection refused"}). Please verify the Sales Module API URL.`
  };
};
