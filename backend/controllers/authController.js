import { User } from "../models/index.js";

export const updateCurrentUser = async (req, res, next) => {
  try {
    const userName = req.body.user || "SIVA";
    await User.update({ isCurrent: false }, { where: {} });
    let existing = await User.findOne({ where: { userName } });
    if (existing) {
      existing.isCurrent = true;
      await existing.save();
    } else {
      await User.create({ userName, password: "password123", isCurrent: true });
    }
    res.json({ success: true, currentUser: userName });
  } catch (error) {
    next(error);
  }
};
