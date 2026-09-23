import express from "express";
import { getAllBsGroups, saveBsGroup, deleteBsGroup } from "../controllers/bsGroup.controller.js";

const router = express.Router();

router.get("/", getAllBsGroups);
router.post("/", saveBsGroup);
router.delete("/:code", deleteBsGroup);

export default router;