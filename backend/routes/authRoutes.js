import { Router } from "express";
import { updateCurrentUser } from "../controllers/authController.js";
import { addAuditLog } from "../middleware/auditMiddleware.js";

const router = Router();

router.post("/user", updateCurrentUser);
router.post("/audit", addAuditLog);

export default router;
