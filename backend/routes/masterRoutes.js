import { Router } from "express";
import * as masterController from "../controllers/masterController.js";

const router = Router();

router.post("/accounts/bulk", masterController.bulkSaveAccounts);
router.post("/accounts", masterController.saveAccount);
router.delete("/accounts/:code", masterController.deleteAccount);

router.post("/groups/bulk", masterController.bulkSaveGroups);
router.post("/groups", masterController.saveGroup);
router.delete("/groups/:id", masterController.deleteGroup);

router.post("/subgroups/bulk", masterController.bulkSaveSubGroups);
router.post("/subgroups", masterController.saveSubGroup);
router.delete("/subgroups/:id", masterController.deleteSubGroup);

router.post("/tds/bulk", masterController.bulkSaveTds);

router.post("/closing-stocks", masterController.saveClosingStock);
router.delete("/closing-stocks/:id", masterController.deleteClosingStock);

export default router;
