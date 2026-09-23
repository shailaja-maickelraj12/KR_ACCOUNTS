import { Router } from "express";
import * as controller from "../controllers/taxForm.controller.js";

const router = Router();

router.get("/:type", controller.getAll);
router.post("/:type", controller.upsert);
router.delete("/:type/:id", controller.remove);

export default router;