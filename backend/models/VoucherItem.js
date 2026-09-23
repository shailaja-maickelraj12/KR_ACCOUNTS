import { DataTypes } from "sequelize";

export default (sequelize) => sequelize.define("VoucherItem", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  voucherId: { type: DataTypes.STRING, allowNull: false },
  accountCode: { type: DataTypes.STRING },
  debit: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  credit: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  narration: { type: DataTypes.TEXT },
  payload: { type: DataTypes.JSON }
});
