import api from "./axios.js";

export const getDatabaseState = () => api.get("/db");
