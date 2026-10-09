import * as tallyService from "../services/tallyService.js";

export const getStatus = async (req, res, next) => {
  try {
    const status = await tallyService.getTallyStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
};

export const postVoucher = async (req, res, next) => {
  try {
    const result = await tallyService.postVoucherToTally(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
