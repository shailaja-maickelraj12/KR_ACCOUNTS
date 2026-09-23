import express from "express";
import { getAllTds, saveTdsRecord, deleteTdsRecord } from "../controllers/tds.controller.js";
import { bulkSaveTds } from "../controllers/masterController.js";

const router = express.Router();

router.get("/", getAllTds);
router.post("/bulk", bulkSaveTds);
router.post("/", saveTdsRecord);
router.delete("/:code", deleteTdsRecord);

export default router;