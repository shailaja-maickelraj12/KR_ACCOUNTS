import api from "./axios.js";

export const getDatabaseState = () => api.get("/db");
export const saveAccount = (data) => api.post("/accounts", data);
export const deleteAccount = (code) => api.delete(`/accounts/${code}`);
export const saveGroup = (data) => api.post("/groups", data);
export const deleteGroup = (id) => api.delete(`/groups/${id}`);
export const saveSubGroup = (data) => api.post("/subgroups", data);
export const deleteSubGroup = (id) => api.delete(`/subgroups/${id}`);
