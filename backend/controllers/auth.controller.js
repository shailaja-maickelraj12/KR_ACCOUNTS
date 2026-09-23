import * as accountService from "../services/accountService.js";

export const register = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required." });
    }
    const result = await accountService.registerUser(username, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required." });
    }
    const result = await accountService.loginUser(username, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};