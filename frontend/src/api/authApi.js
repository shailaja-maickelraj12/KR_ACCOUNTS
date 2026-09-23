import api from "./axios.js";

export const updateCurrentUser = (user) => api.post("/user", { user });
export const addAuditLog = (action, details) => api.post("/audit", { action, details });
