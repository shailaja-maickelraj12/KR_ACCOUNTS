import { TDSMaster } from "../models/index.js";

// GET /api/tds
export const getAllTds = async (req, res, next) => {
  try {
    const records = await TDSMaster.findAll();

    const data = records.map(record => ({
      ...record.toJSON(),
      ...(record.payload || {})
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/tds
export const saveTdsRecord = async (req, res, next) => {
  try {
    const data = req.body;

    const code = (data.code || `TDS${Date.now()}`).toUpperCase();

    const recordData = {
      code,
      name: data.name,
      tdsPercentage: Number(data.tdsPercentage) || 0,
      scPercentage: Number(data.scPercentage) || 0,
      chessPercentage: Number(data.chessPercentage) || 0,
      hsChessPercentage: Number(data.hsChessPercentage) || 0,
      accountHeadName: data.accountHeadName || null,
      sectionCode: data.sectionCode || null,
      payload: data
    };

    console.log("Saving TDS Record:", recordData);

    // Insert or Update
    await TDSMaster.upsert(recordData);

    // Re-fetch from DB to confirm persistence
    const savedRecord = await TDSMaster.findOne({
      where: { code }
    });

    if (!savedRecord) {
      throw new Error(`Unable to locate saved TDS record: ${code}`);
    }

    console.log("Saved Record Found:", savedRecord.toJSON());

    res.json({ success: true, data: savedRecord });
  } catch (error) {
    console.error("TDS Save Error:", error);
    next(error);
  }
};

// DELETE /api/tds/:code
export const deleteTdsRecord = async (req, res, next) => {
  try {
    const deleted = await TDSMaster.destroy({
      where: {
        code: req.params.code
      }
    });

    res.json({
      success: true,
      deleted
    });
  } catch (error) {
    next(error);
  }
};