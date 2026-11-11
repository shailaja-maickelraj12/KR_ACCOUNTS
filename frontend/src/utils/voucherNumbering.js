/**
 * Reusable Voucher Numbering and Classification Utility
 * Implements Standard Option 1 (Prefix + 5-digit sequence: JV-00001, CP-00001, etc.)
 */

export const VOUCHER_PREFIXES = {
  JV: "JV",
  JOURNAL: "JV",
  CP: "CP",
  CR: "CR",
  BP: "BP",
  BR: "BR",
  CE: "CE",
  CONTRA: "CE",
  DN: "DN",
  CN: "CN"
};

/**
 * Generates the next sequential voucher number based on Option 1 (Prefix-00001, Prefix-00002, ...)
 * @param {string} typeOrPrefix - Voucher type or prefix (e.g., 'JV', 'CP', 'CR', 'BP', 'BR', 'CONTRA', 'DN', 'CN')
 * @param {Array} vouchersList - List of existing vouchers in state/database
 * @returns {string} - e.g. 'JV-00001'
 */
export const generateNextVoucherNo = (typeOrPrefix, vouchersList = []) => {
  const cleanKey = (typeOrPrefix || "JV").toUpperCase().trim();
  const prefix = VOUCHER_PREFIXES[cleanKey] || cleanKey;
  let maxNo = 0;

  for (const v of vouchersList) {
    if (!v) continue;
    const vNo = String(v.voucherNo || "").trim();

    // 1. Match standard format: PREFIX-00001 or PREFIX-123
    const prefixRegex = new RegExp(`^${prefix}-(\\d+)$`, "i");
    const match = vNo.match(prefixRegex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNo) {
        maxNo = num;
      }
    } else if (v.type && (v.type.toUpperCase() === cleanKey || v.type.toUpperCase() === prefix)) {
      // 2. Fallback for legacy plain numbers (e.g. "1", "176") if matching the voucher type
      if (/^\d+$/.test(vNo)) {
        const num = parseInt(vNo, 10);
        if (!isNaN(num) && num > maxNo) {
          maxNo = num;
        }
      }
    }
  }

  const nextSeq = maxNo + 1;
  return `${prefix}-${String(nextSeq).padStart(5, "0")}`;
};

/**
 * Derives a dynamic short description for Journal Vouchers and other vouchers
 * @param {Object} voucher - The voucher object
 * @returns {string} - Short description e.g. "WASTE SALE", "TDS ADJ", "TAX ADJ", "GENERAL JV"
 */
export const getVoucherShortDesc = (voucher) => {
  if (!voucher) return "GENERAL JV";

  // Explicit short description if set
  if (voucher.shortDesc && typeof voucher.shortDesc === "string" && voucher.shortDesc.trim()) {
    return voucher.shortDesc.toUpperCase().trim();
  }

  const payload = voucher.payload || {};
  if (payload.shortDesc && typeof payload.shortDesc === "string" && payload.shortDesc.trim()) {
    return payload.shortDesc.toUpperCase().trim();
  }

  // Synced External Sales Invoices
  if (
    payload.externalInvoiceNo ||
    payload.externalInvoiceId ||
    payload.invoiceType ||
    (voucher.voucherNo && voucher.voucherNo.startsWith("JV-INV-")) ||
    (voucher.narration && voucher.narration.toUpperCase().includes("WASTE SALE"))
  ) {
    return "WASTE SALE";
  }

  // TDS adjustments
  if (voucher.tdsEnabled || Number(voucher.tdsAmount) > 0) {
    return "TDS ADJ";
  }

  // Tax adjustments
  if (voucher.stEnabled || voucher.serviceTaxEnabled || Number(voucher.sTaxAmount) > 0) {
    return "TAX ADJ";
  }

  // Custom Category
  if (voucher.category && voucher.category !== "GENERAL LEDGER" && voucher.category.trim()) {
    return voucher.category.toUpperCase().trim();
  }

  // Custom SubGroup or MainGroup
  if (voucher.subGroup && voucher.subGroup.trim()) {
    return voucher.subGroup.toUpperCase().trim();
  }

  return "GENERAL JV";
};
