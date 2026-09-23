import { Router } from "express";
import * as controller from "../controllers/billWiseOpening.controller.js";

const router = Router();

router.get("/", controller.getAll);
router.post("/", controller.upsert);
router.delete("/:id", controller.remove);

export default router;