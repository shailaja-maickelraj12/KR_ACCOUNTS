import { Router } from "express";
import {
  getInvoices,
  getSingleInvoice,
  syncInvoice,
  syncAllPending,
  handleWebhook
} from "../controllers/externalInvoiceController.js";

const router = Router();

router.get("/invoices", getInvoices);
router.get("/invoices/:id", getSingleInvoice);
router.post("/invoices/sync", syncInvoice);
router.post("/invoices/sync-all", syncAllPending);
router.post("/invoices/webhook", handleWebhook);

export default router;
