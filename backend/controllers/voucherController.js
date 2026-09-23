import * as voucherService from "../services/voucherService.js";

export const saveVoucher = async (req, res, next) => {
  try {
    res.json({ success: true, data: await voucherService.saveVoucher(req.body) });
  } catch (error) {
    next(error);
  }
};

export const deleteVoucher = async (req, res, next) => {
  try {
    await voucherService.deleteVoucher(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
