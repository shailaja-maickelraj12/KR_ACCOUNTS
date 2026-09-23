import { Router } from "express";
import * as voucherController from "../controllers/voucherController.js";

const router = Router();

router.post("/vouchers", voucherController.saveVoucher);
router.delete("/vouchers/:id", voucherController.deleteVoucher);

export default router;
