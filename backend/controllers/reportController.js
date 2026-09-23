import { User, AuditLog } from "../models/index.js";
import { getMastersState } from "../services/accountService.js";
import { getVoucherState } from "../services/voucherService.js";

export const getDatabaseState = async (req, res, next) => {
  try {
    const [masters, vouchers, currentUser, auditLogs] = await Promise.all([
      getMastersState(),
      getVoucherState(),
      User.findOne({ where: { isCurrent: true } }),
      AuditLog.findAll({ order: [["timestamp", "DESC"]], limit: 200 })
    ]);

    res.json({
      ...masters,
      ...vouchers,
      auditLogs: auditLogs.map((row) => row.toJSON()),
      currentUser: currentUser?.userName || "SIVA"
    });
  } catch (error) {
    next(error);
  }
};
