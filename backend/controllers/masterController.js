import * as accountService from "../services/accountService.js";

const sendSave = (handler) => async (req, res, next) => {
  try {
    res.json({ success: true, data: await handler(req.body) });
  } catch (error) {
    next(error);
  }
};

const sendDelete = (handler, param) => async (req, res, next) => {
  try {
    await handler(req.params[param]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const saveAccount = sendSave(accountService.saveAccount);
export const deleteAccount = sendDelete(accountService.deleteAccount, "code");
export const bulkSaveAccounts = sendSave(accountService.bulkSaveAccounts);

export const saveGroup = sendSave(accountService.saveGroup);
export const deleteGroup = sendDelete(accountService.deleteGroup, "id");
export const bulkSaveGroups = sendSave(accountService.bulkSaveGroups);

export const saveSubGroup = sendSave(accountService.saveSubGroup);
export const deleteSubGroup = sendDelete(accountService.deleteSubGroup, "id");
export const bulkSaveSubGroups = sendSave(accountService.bulkSaveSubGroups);

export const saveTds = sendSave(accountService.saveTds);
export const deleteTds = sendDelete(accountService.deleteTds, "code");
export const bulkSaveTds = sendSave(accountService.bulkSaveTds);

export const saveClosingStock = sendSave(accountService.saveClosingStock);
export const deleteClosingStock = sendDelete(accountService.deleteClosingStock, "id");
