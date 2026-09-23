import api from "./axios.js";

export const saveVoucher = (data) => api.post("/vouchers", data);
export const deleteVoucher = (id) => api.delete(`/vouchers/${id}`);
export const saveReverseBill = (data) => api.post("/reverse-bills", data);
export const deleteReverseBill = (id) => api.delete(`/reverse-bills/${id}`);
