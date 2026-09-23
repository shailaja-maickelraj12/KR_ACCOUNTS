import { Voucher } from "../models/index.js";

const unwrap = (row) => {
  const plain = row.toJSON();
  return { ...plain.payload, ...plain };
};

// Uses the payload pattern to preserve nested line items and UI-specific fields
// like bankOption, acPay, etc. without requiring strict schema columns.
export const saveVoucher = async (data) => {
  const key = data.id || `VOU-${Date.now()}`;
  
  const recordData = { 
    ...data, 
    id: key,
    payload: data // Encapsulates the entire JSON structure including nested items
  };
  
  await Voucher.upsert(recordData);
  
  const row = await Voucher.findOne({ where: { id: key } });
  return unwrap(row);
};

export const deleteVoucher = (id) => Voucher.destroy({ where: { id } });