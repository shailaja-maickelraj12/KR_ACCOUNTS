import { Router } from "express";
import { getDatabaseState } from "../controllers/reportController.js";

const router = Router();

router.get("/db", getDatabaseState);

export default router;
