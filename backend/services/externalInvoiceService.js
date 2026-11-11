import dotenv from "dotenv";
import { Account, Voucher, VoucherItem, Group, SubGroup, AuditLog } from "../models/index.js";
import { saveVoucher } from "./voucherService.js";

dotenv.config({ quiet: true });

const EXTERNAL_API_URL = process.env.EXTERNAL_INVOICE_API_URL || "https://krexports.org/api/v1/external/invoices";
const EXTERNAL_API_KEY = process.env.EXTERNAL_INVOICE_API_KEY || "sales_module_secret_key_2026";

// Sample fallback invoices for local development / offline demo matching the exact API schema
const SAMPLE_INVOICES = [
  {
    id: 122,
    invoiceNo: "122",
    invoiceDate: "2026-08-24",
    invoiceType: "GST WASTE SALE INVOICE",
    buyer: {
      supplierId: 125,
      accountName: "BALAJI TRADERS",
      code: "00000125",
      address1: "123 Main St",
      address2: "Coimbatore",
      gstin: "33BBBBB1111B1Z2",
      mobileNo: "9876543210"
    },
    salesOrder: {
      salesOrderId: 122,
      orderNo: "122",
      orderDate: "2026-08-20",
      wasteLot: "3",
      rate: 150.00
    },
    financials: {
      assessableValue: 1600800.00,
      charity: 0.00,
      vatTax: 0.00,
      cenvat: 0.00,
      duty: 0.00,
      cess: 0.00,
      hsCess: 0.00,
      subTotal: 1600800.00,
      gstAmount: 288144.00,
      igstAmount: 0.00,
      tcsPercent: 0.10,
      tcsRs: 1600.80,
      pfCharges: 0.00,
      roundOff: 0.20,
      invoiceValue: 1888944.00,
      creditDays: 30,
      interestPercent: 18.00
    },
    dispatchDetails: {
      transport: "VETRI TRANSPORT",
      lrNo: "LR-9988",
      lrDate: "2026-08-24",
      vehicleNo: "TN 34 Q 3688",
      removalTime: "12:00 PM",
      ewayBillNo: "5720 6024 4707",
      exportTo: "Local Sale",
      approve: true
    },
    summary: {
      totalBales: 1,
      totalNetWeight: 1.00
    },
    items: [
      {
        id: 4417,
        baleNo: "WC-122-109-001",
        lotNo: "109",
        wasteName: "USED R/F MACHINE LR6 S 1104",
        grossWt: 1.00,
        tareWt: 0.00,
        netWt: 1.00
      }
    ]
  },
  {
    id: 123,
    invoiceNo: "123",
    invoiceDate: "2026-08-26",
    invoiceType: "GST WASTE SALE INVOICE",
    buyer: {
      supplierId: 126,
      accountName: "SRI MURUGAN TEXTILES",
      code: "00000126",
      address1: "45 Palladam Road",
      address2: "Tirupur",
      gstin: "33AAAAA2222A1Z5",
      mobileNo: "9843210987"
    },
    salesOrder: {
      salesOrderId: 123,
      orderNo: "123",
      orderDate: "2026-08-22",
      wasteLot: "4",
      rate: 180.00
    },
    financials: {
      assessableValue: 950000.00,
      charity: 0.00,
      vatTax: 0.00,
      cenvat: 0.00,
      duty: 0.00,
      cess: 0.00,
      hsCess: 0.00,
      subTotal: 950000.00,
      gstAmount: 171000.00,
      igstAmount: 0.00,
      tcsPercent: 0.10,
      tcsRs: 950.00,
      pfCharges: 0.00,
      roundOff: 0.00,
      invoiceValue: 1121950.00,
      creditDays: 30,
      interestPercent: 18.00
    },
    dispatchDetails: {
      transport: "SRI RAM TRANSPORT",
      lrNo: "LR-10023",
      lrDate: "2026-08-26",
      vehicleNo: "TN 38 B 5544",
      removalTime: "03:30 PM",
      ewayBillNo: "5811 7733 9922",
      exportTo: "Local Sale",
      approve: true
    },
    summary: {
      totalBales: 2,
      totalNetWeight: 2.00
    },
    items: [
      {
        id: 4418,
        baleNo: "WC-123-110-001",
        lotNo: "110",
        wasteName: "COMB NOIL COTTON WASTE",
        grossWt: 2.00,
        tareWt: 0.00,
        netWt: 2.00
      }
    ]
  }
];

/**
 * Fetch list of invoices from the external Sales Module API (with fallback if offline)
 */
export const fetchExternalInvoices = async ({ page = 1, limit = 50, startDate, endDate, invoiceNo, supplierId } = {}) => {
  try {
    const url = new URL(EXTERNAL_API_URL);
    url.searchParams.append("page", String(page));
    url.searchParams.append("limit", String(limit));
    if (startDate) url.searchParams.append("startDate", startDate);
    if (endDate) url.searchParams.append("endDate", endDate);
    if (invoiceNo) url.searchParams.append("invoiceNo", invoiceNo);
    if (supplierId) url.searchParams.append("supplierId", String(supplierId));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-API-KEY": EXTERNAL_API_KEY,
        "Content-Type": "application/json"
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`External Invoice API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`[External Invoice API] Network call to ${EXTERNAL_API_URL} failed (${error.message}). Using local fallback/cached dataset.`);
    let filtered = [...SAMPLE_INVOICES];
    if (invoiceNo) {
      filtered = filtered.filter(i => String(i.invoiceNo).includes(String(invoiceNo)));
    }
    if (supplierId) {
      filtered = filtered.filter(i => i.buyer?.supplierId === Number(supplierId));
    }
    return {
      success: true,
      message: "Fallback invoice dataset retrieved",
      data: {
        totalCount: filtered.length,
        totalPages: 1,
        currentPage: page,
        limit,
        invoices: filtered
      }
    };
  }
};

/**
 * Fetch a single invoice by ID from the external Sales Module API (with fallback if offline)
 */
export const fetchSingleExternalInvoice = async (id) => {
  try {
    const url = `${EXTERNAL_API_URL.replace(/\/$/, "")}/${id}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-KEY": EXTERNAL_API_KEY,
        "Content-Type": "application/json"
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`External Invoice API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.invoice || data.data;
  } catch (error) {
    console.warn(`[External Invoice API] Network call to ${EXTERNAL_API_URL}/${id} failed (${error.message}). Checking sample dataset.`);
    const found = SAMPLE_INVOICES.find(i => String(i.id) === String(id) || String(i.invoiceNo) === String(id));
    if (found) return found;
    throw new Error(`Invoice '${id}' not found in external sales system.`);
  }
};

/**
 * Helper: Find or create standard ledger account
 */
const findOrCreateLedgerAccount = async ({ name, subGroupName, groupName, mainGroupName }) => {
  let acc = await Account.findOne({ where: { name } });
  if (acc) return acc.toJSON();

  // Find next sequential 60000001 series code
  const accounts = await Account.findAll();
  const existingCodes = new Set(accounts.map(a => String(a.code || "").trim()).filter(Boolean));
  let maxCode = 60000000;
  for (const a of accounts) {
    const raw = String(a.code || "").trim();
    if (/^\d{8}$/.test(raw)) {
      const n = parseInt(raw, 10);
      if (n >= 60000001 && n > maxCode) maxCode = n;
    }
  }
  let candidate = maxCode + 1;
  while (existingCodes.has(String(candidate))) {
    candidate++;
  }
  const newCode = String(candidate);

  const newAcc = {
    code: newCode,
    name,
    groupName: groupName || "General",
    subGroupName: subGroupName || "Sundry Debtors",
    mainGroupName: mainGroupName || "Assets",
    openingDebit: 0,
    openingCredit: 0
  };

  await Account.create({ ...newAcc, payload: newAcc });
  return newAcc;
};

/**
 * Helper: Find or auto-create Buyer account under Sundry Debtors
 */
const findOrCreateBuyerAccount = async (buyer = {}) => {
  const buyerName = (buyer.accountName || `BUYER-${buyer.supplierId || "UNKNOWN"}`).trim();

  // Check by name or buyer code
  let acc = await Account.findOne({ where: { name: buyerName } });
  if (acc) return acc.toJSON();

  // Find next sequential 60000001 code
  const accounts = await Account.findAll();
  const existingCodes = new Set(accounts.map(a => String(a.code || "").trim()).filter(Boolean));
  let maxCode = 60000000;
  for (const a of accounts) {
    const raw = String(a.code || "").trim();
    if (/^\d{8}$/.test(raw)) {
      const n = parseInt(raw, 10);
      if (n >= 60000001 && n > maxCode) maxCode = n;
    }
  }
  let candidate = maxCode + 1;
  while (existingCodes.has(String(candidate))) {
    candidate++;
  }
  const newCode = String(candidate);

  const newBuyerAccount = {
    code: newCode,
    name: buyerName,
    groupName: "Current Assets",
    subGroupName: "Sundry Debtors",
    mainGroupName: "Assets",
    place: buyer.address2 || buyer.address1 || "",
    address1: buyer.address1 || "",
    address2: buyer.address2 || "",
    gstNo: buyer.gstin || "",
    cellNo: buyer.mobileNo || "",
    phoneNo: buyer.mobileNo || "",
    openingDebit: 0,
    openingCredit: 0,
    externalSupplierId: buyer.supplierId
  };

  await Account.create({ ...newBuyerAccount, payload: newBuyerAccount });
  return newBuyerAccount;
};

/**
 * Check sync status for a list of external invoices
 */
export const getInvoicesWithSyncStatus = async (filters = {}) => {
  // 1. Fetch from external API
  const apiResult = await fetchExternalInvoices(filters);
  const invoicesList = apiResult.data?.invoices || apiResult.invoices || [];

  // 2. Query all local vouchers with external invoice references
  const allVouchers = await Voucher.findAll({
    include: [{ model: VoucherItem, as: "items" }]
  });

  const postedMap = new Map();
  for (const v of allVouchers) {
    const payload = v.payload || {};
    if (payload.externalInvoiceNo) {
      postedMap.set(String(payload.externalInvoiceNo), v);
    }
    if (payload.externalInvoiceId) {
      postedMap.set(String(payload.externalInvoiceId), v);
    }
    if (v.voucherNo && v.voucherNo.startsWith("JV-INV-")) {
      const invNum = v.voucherNo.replace("JV-INV-", "");
      postedMap.set(String(invNum), v);
    }
  }

  // 3. Mark each invoice with POSTED / PENDING status
  let totalPosted = 0;
  let totalPending = 0;

  const enrichedInvoices = invoicesList.map((inv) => {
    const matchedVoucher = postedMap.get(String(inv.invoiceNo)) || postedMap.get(String(inv.id));
    const isPosted = !!matchedVoucher;

    if (isPosted) totalPosted++;
    else totalPending++;

    return {
      ...inv,
      syncStatus: isPosted ? "POSTED" : "PENDING",
      localVoucherId: matchedVoucher ? matchedVoucher.id : null,
      localVoucherNo: matchedVoucher ? matchedVoucher.voucherNo : null,
      syncedAt: matchedVoucher ? matchedVoucher.payload?.syncedAt || matchedVoucher.updatedAt : null
    };
  });

  return {
    success: true,
    totalCount: apiResult.data?.totalCount || enrichedInvoices.length,
    totalPages: apiResult.data?.totalPages || 1,
    currentPage: apiResult.data?.currentPage || 1,
    limit: apiResult.data?.limit || filters.limit || 50,
    summary: {
      total: enrichedInvoices.length,
      posted: totalPosted,
      pending: totalPending
    },
    invoices: enrichedInvoices
  };
};

/**
 * Sync a single invoice to a Double-Entry Journal Voucher
 */
export const syncInvoiceToJournalVoucher = async (invoiceInput, currentUser = "System Auto-Sync") => {
  let invoice = invoiceInput;

  // If passed just an ID or string, fetch full details from API
  if (typeof invoiceInput === "number" || typeof invoiceInput === "string" || !invoiceInput.financials) {
    const idToFetch = typeof invoiceInput === "object" ? invoiceInput.id || invoiceInput.invoiceNo : invoiceInput;
    invoice = await fetchSingleExternalInvoice(idToFetch);
  }

  if (!invoice || !invoice.invoiceNo) {
    throw new Error("Invalid invoice data received from Sales Module");
  }

  // 1. Check if already posted to prevent duplicate entries
  const existingVouchers = await Voucher.findAll();
  for (const v of existingVouchers) {
    const payload = v.payload || {};
    if (
      String(payload.externalInvoiceNo) === String(invoice.invoiceNo) ||
      String(payload.externalInvoiceId) === String(invoice.id) ||
      v.voucherNo === `JV-INV-${invoice.invoiceNo}`
    ) {
      return {
        success: true,
        alreadyExists: true,
        message: `Invoice #${invoice.invoiceNo} is already posted as Voucher ${v.voucherNo}`,
        voucher: v
      };
    }
  }

  // 2. Ensure Buyer Account exists
  const buyerAccount = await findOrCreateBuyerAccount(invoice.buyer);

  // 3. Ensure Standard Sales & Tax Accounts exist
  const salesAccount = await findOrCreateLedgerAccount({
    name: "Waste Sales Account",
    subGroupName: "Sales Account",
    groupName: "Direct Incomes",
    mainGroupName: "Incomes"
  });

  const gstAccount = await findOrCreateLedgerAccount({
    name: "Output GST Account",
    subGroupName: "Duties & Taxes",
    groupName: "Current Liabilities",
    mainGroupName: "Liabilities"
  });

  const tcsAccount = await findOrCreateLedgerAccount({
    name: "TCS on Sales Account",
    subGroupName: "Duties & Taxes",
    groupName: "Current Liabilities",
    mainGroupName: "Liabilities"
  });

  const roundOffAccount = await findOrCreateLedgerAccount({
    name: "Round Off Account",
    subGroupName: "Indirect Expenses",
    groupName: "Expenses",
    mainGroupName: "Expenses"
  });

  // 4. Extract Financial Values
  const fin = invoice.financials || {};
  const invoiceValue = parseFloat(fin.invoiceValue) || 0;
  const assessableValue = parseFloat(fin.assessableValue) || (parseFloat(fin.subTotal) || 0);
  const gstAmount = parseFloat(fin.gstAmount || fin.igstAmount) || 0;
  const tcsAmount = parseFloat(fin.tcsRs) || 0;
  const roundOff = parseFloat(fin.roundOff) || 0;

  // 5. Construct Double-Entry Voucher Items
  const voucherItems = [];

  // Row 1: DEBIT Buyer (Total Receivable)
  voucherItems.push({
    accountCode: buyerAccount.code,
    accountName: buyerAccount.name,
    debit: invoiceValue,
    credit: 0,
    narration: `Inv #${invoice.invoiceNo} - Total receivable from ${buyerAccount.name}`
  });

  // Row 2: CREDIT Waste Sales (Assessable Value)
  if (assessableValue > 0) {
    voucherItems.push({
      accountCode: salesAccount.code,
      accountName: salesAccount.name,
      debit: 0,
      credit: assessableValue,
      narration: `Inv #${invoice.invoiceNo} - Waste Sales assessable value`
    });
  }

  // Row 3: CREDIT Output GST (Tax Amount)
  if (gstAmount > 0) {
    voucherItems.push({
      accountCode: gstAccount.code,
      accountName: gstAccount.name,
      debit: 0,
      credit: gstAmount,
      narration: `Inv #${invoice.invoiceNo} - Output GST liability`
    });
  }

  // Row 4: CREDIT TCS (Tax Collected at Source)
  if (tcsAmount > 0) {
    voucherItems.push({
      accountCode: tcsAccount.code,
      accountName: tcsAccount.name,
      debit: 0,
      credit: tcsAmount,
      narration: `Inv #${invoice.invoiceNo} - TCS collected on sales`
    });
  }

  // Row 5: Round Off Adjustment (Debit or Credit)
  if (roundOff !== 0) {
    if (roundOff < 0) {
      voucherItems.push({
        accountCode: roundOffAccount.code,
        accountName: roundOffAccount.name,
        debit: Math.abs(roundOff),
        credit: 0,
        narration: `Inv #${invoice.invoiceNo} - Round Off adjustment`
      });
    } else {
      voucherItems.push({
        accountCode: roundOffAccount.code,
        accountName: roundOffAccount.name,
        debit: 0,
        credit: roundOff,
        narration: `Inv #${invoice.invoiceNo} - Round Off adjustment`
      });
    }
  }

  // 6. Build Voucher Header using Standard Option 1 pattern (JV-00001, JV-00002, ...)
  let maxJvNo = 0;
  for (const v of existingVouchers) {
    if (v.type === "JV" || v.type === "JOURNAL" || v.type === "Journal") {
      const match = String(v.voucherNo || "").match(/^JV-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxJvNo) maxJvNo = num;
      } else if (/^\d+$/.test(String(v.voucherNo || ""))) {
        const num = parseInt(v.voucherNo, 10);
        if (num > maxJvNo) maxJvNo = num;
      }
    }
  }
  const nextSeq = maxJvNo + 1;
  const voucherNo = `JV-${String(nextSeq).padStart(5, "0")}`;
  const voucherId = `V_EXT_${invoice.id || invoice.invoiceNo}_${Date.now()}`;
  const dispatch = invoice.dispatchDetails || {};
  const narration = `GST Waste Sale Inv #${invoice.invoiceNo} to ${buyerAccount.name} | Vehicle: ${dispatch.vehicleNo || "N/A"} | LR: ${dispatch.lrNo || "N/A"} | E-Way: ${dispatch.ewayBillNo || "N/A"}`;

  const voucherData = {
    id: voucherId,
    voucherNo,
    voucherDate: invoice.invoiceDate || new Date().toISOString().split("T")[0],
    type: "JV",
    shortDesc: "WASTE SALE",
    narration,
    totalAmount: invoiceValue,
    userName: currentUser,
    items: voucherItems,
    payload: {
      externalInvoiceId: invoice.id,
      externalInvoiceNo: invoice.invoiceNo,
      shortDesc: "WASTE SALE",
      invoiceType: invoice.invoiceType,
      buyer: invoice.buyer,
      dispatchDetails: dispatch,
      financials: fin,
      salesOrder: invoice.salesOrder,
      items: invoice.items,
      summary: invoice.summary,
      syncedAt: new Date().toISOString()
    }
  };

  // 7. Save to Database
  const savedVoucher = await saveVoucher(voucherData);

  // 8. Add Audit Log
  try {
    await AuditLog.create({
      id: `LOG${Date.now()}`,
      userName: currentUser,
      action: "EXTERNAL INVOICE SYNC",
      details: `Created Journal Voucher ${voucherNo} from External Invoice #${invoice.invoiceNo} (₹${invoiceValue.toLocaleString("en-IN")})`
    });
  } catch (err) {
    // Non-critical audit log catch
  }

  return {
    success: true,
    message: `Invoice #${invoice.invoiceNo} successfully posted as Journal Voucher ${voucherNo}`,
    voucher: savedVoucher,
    buyerAccount
  };
};

/**
 * Sync multiple pending invoices in batch
 */
export const syncAllPendingInvoices = async (currentUser = "System Batch Sync") => {
  const { invoices } = await getInvoicesWithSyncStatus({ limit: 100 });
  const pendingInvoices = invoices.filter(inv => inv.syncStatus === "PENDING");

  const results = {
    totalPending: pendingInvoices.length,
    successCount: 0,
    failedCount: 0,
    synced: [],
    errors: []
  };

  for (const inv of pendingInvoices) {
    try {
      const res = await syncInvoiceToJournalVoucher(inv, currentUser);
      results.successCount++;
      results.synced.push({ invoiceNo: inv.invoiceNo, voucherNo: res.voucher?.voucherNo });
    } catch (err) {
      results.failedCount++;
      results.errors.push({ invoiceNo: inv.invoiceNo, error: err.message });
    }
  }

  return results;
};
