import express from "express";
import * as controller from "../controllers/contraEntry.controller.js";

const router = express.Router();

router.post("/", controller.save);
router.delete("/:id", controller.remove);

export default router;