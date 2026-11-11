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
    console.log(`[Webhook] ${new Date().toISOString()} - Received incoming invoice payload from Sales Module:`);
    console.log(JSON.stringify(req.body, null, 2));

    // Support multiple common payload wrapping patterns
    let payload = req.body;
    if (req.body?.invoice) {
      payload = req.body.invoice;
    } else if (req.body?.data?.invoice) {
      payload = req.body.data.invoice;
    } else if (req.body?.data && typeof req.body.data === "object" && !Array.isArray(req.body.data)) {
      payload = req.body.data;
    } else if (req.body?.payload) {
      payload = req.body.payload;
    }

    const result = await syncInvoiceToJournalVoucher(payload, "Webhook Auto-Sync");
    console.log(`[Webhook] Success: ${result.message || 'Invoice processed'}`);
    res.json({ success: true, message: "Webhook processed successfully", result });
  } catch (error) {
    console.error(`[Webhook Error]:`, error.message);
    next(error);
  }
};
