import { Router } from "express";
import { validateApiKey, processInvoiceWebhook, syncFromSalesModule } from "../controllers/invoiceController.js";

const router = Router();

// Webhook endpoint to receive external invoices from Sales Module
router.post("/webhook", validateApiKey, processInvoiceWebhook);
router.post("/sync", validateApiKey, processInvoiceWebhook);

// Active sync endpoints to pull invoices directly from external Sales Module API
router.get("/fetch-sync", syncFromSalesModule);
router.post("/fetch-sync", syncFromSalesModule);

export default router;
