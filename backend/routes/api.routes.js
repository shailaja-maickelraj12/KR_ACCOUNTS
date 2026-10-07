import { Router } from "express";
import authRoutes from "./authRoutes.js";
import newAuthRoutes from "./auth.routes.js";
import masterRoutes from "./masterRoutes.js";
import voucherRoutes from "./voucherRoutes.js";
import reportRoutes from "./reportRoutes.js";
import tdsRoutes from "./tds.routes.js";
import contraEntryRoutes from "./contraEntry.routes.js";
import externalInvoiceRoutes from "./externalInvoice.routes.js";

const router = Router();

router.use("/auth", newAuthRoutes);
router.use(authRoutes);
router.use(masterRoutes);
router.use(voucherRoutes);
router.use(reportRoutes);
router.use("/tds", tdsRoutes);
router.use("/contra-entries", contraEntryRoutes);
router.use("/external", externalInvoiceRoutes);

export default router;
