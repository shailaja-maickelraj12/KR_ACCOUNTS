import { CForm, FForm, HForm, E1Form, CFormPurchase } from "../models/index.js";

const getModel = (type) => {
  switch(type) {
    case "c-form": return CForm;
    case "f-form": return FForm;
    case "h-form": return HForm;
    case "e1-form": return E1Form;
    case "c-form-purchase": return CFormPurchase;
    default: throw new Error("Invalid form type: " + type);
  }
};

const unwrap = (row) => ({ ...row.toJSON().payload, ...row.toJSON() });

export const getAll = async (req, res, next) => {
  try {
    const rows = await getModel(req.params.type).findAll({ order: [["updatedAt", "DESC"]] });
    res.json({ success: true, data: rows.map(unwrap) });
  } catch (err) { next(err); }
};

export const upsert = async (req, res, next) => {
  try {
    const Model = getModel(req.params.type);
    const data = req.body;
    const key = data.id || `TF-${Date.now()}`;
    const recordData = { ...data, id: key, payload: data };
    
    await Model.upsert(recordData);
    res.json({ success: true, data: recordData });
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    await getModel(req.params.type).destroy({ where: { id: req.params.id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
};