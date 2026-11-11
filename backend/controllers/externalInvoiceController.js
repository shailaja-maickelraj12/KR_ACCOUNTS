import {
  fetchSingleExternalInvoice,
  getInvoicesWithSyncStatus,
  syncInvoiceToJournalVoucher,
  syncAllPendingInvoices
} from "../services/externalInvoiceService.js";

export const getInvoices = async (req, res, next) => {
  try {
    const { page, limit, startDate, endDate, invoiceNo, supplierId } = req.query;
    const result = await getInvoicesWithSyncStatus({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      startDate,
      endDate,
      invoiceNo,
      supplierId: supplierId ? Number(supplierId) : undefined
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getSingleInvoice = async (req, res, next) => {
  try {
    const invoice = await fetchSingleExternalInvoice(req.params.id);
    res.json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

export const syncInvoice = async (req, res, next) => {
  try {
    const invoiceData = req.body.invoice || req.params.id;
    const currentUser = req.body.user || req.user?.username || "Admin";
    const result = await syncInvoiceToJournalVoucher(invoiceData, currentUser);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const syncAllPending = async (req, res, next) => {
  try {
    const currentUser = req.body.user || req.user?.username || "Admin";
    const result = await syncAllPendingInvoices(currentUser);
    res.json({ success: true, message: `Batch sync completed: ${result.successCount} synced, ${result.failedCount} failed`, ...result });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req, res, next) => {
  try {
    const payload = req.body.invoice || req.body;
    const result = await syncInvoiceToJournalVoucher(payload, "Webhook Auto-Sync");
    res.json({ success: true, message: "Webhook processed successfully", result });
  } catch (error) {
    next(error);
  }
};
