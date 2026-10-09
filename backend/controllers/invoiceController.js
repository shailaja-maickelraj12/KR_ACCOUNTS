import * as invoiceService from "../services/invoiceService.js";

const DEFAULT_API_KEY = process.env.SALES_MODULE_API_KEY || "sales_module_secret_key_2026";

/**
 * Middleware to validate API Key header or query parameter
 */
export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;

  if (!apiKey || apiKey !== DEFAULT_API_KEY) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access. Provide a valid X-API-KEY header or apiKey parameter."
    });
  }
  next();
};

/**
 * Webhook handler to receive invoice payload and create Journal Voucher
 */
export const processInvoiceWebhook = async (req, res, next) => {
  try {
    const result = await invoiceService.processInvoiceToJV(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to process invoice webhook"
    });
  }
};

/**
 * Trigger to pull/fetch invoices from Sales Module API and convert to Journal Vouchers
 */
export const syncFromSalesModule = async (req, res, next) => {
  try {
    const targetUrl = req.body?.salesApiUrl || req.query?.salesApiUrl;
    const result = await invoiceService.fetchAndSyncInvoicesFromSalesModule(targetUrl);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
