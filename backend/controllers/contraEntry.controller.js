import { saveContraEntry, deleteContraEntry } from "../services/voucherService.js";

export const save = async (req, res, next) => {
  try {
    const saved = await saveContraEntry(req.body);
    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await deleteContraEntry(req.params.id);
    res.json({ success: true, message: "Record deleted" });
  } catch (error) {
    next(error);
  }
};