import { AuditLog, User } from "../models/index.js";

export const addAuditLog = async (req, res, next) => {
  try {
    const currentUser = await User.findOne({ where: { isCurrent: true } });
    const log = {
      id: `LOG${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(),
      userName: currentUser?.userName || "SIVA",
      action: req.body.action,
      details: req.body.details
    };
    await AuditLog.create(log);
    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};
