import { DataTypes } from "sequelize";

export default (sequelize) => sequelize.define("Voucher", {
  id: { type: DataTypes.STRING, primaryKey: true },
  voucherNo: { type: DataTypes.STRING },
  voucherDate: { type: DataTypes.DATEONLY },
  type: { type: DataTypes.STRING },
  narration: { type: DataTypes.TEXT },
  totalAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  userName: { type: DataTypes.STRING },
  payload: { type: DataTypes.JSON }
});
