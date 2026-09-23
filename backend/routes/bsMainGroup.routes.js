import express from "express";
import { getAllBsMainGroups, saveBsMainGroup, deleteBsMainGroup } from "../controllers/bsMainGroup.controller.js";

const router = express.Router();

router.get("/", getAllBsMainGroups);
router.post("/", saveBsMainGroup);
router.delete("/:code", deleteBsMainGroup);

export default router;