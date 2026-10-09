import { Router } from "express";
import * as tallyController from "../controllers/tallyController.js";

const router = Router();

router.get("/status", tallyController.getStatus);
router.post("/post-voucher", tallyController.postVoucher);

export default router;
