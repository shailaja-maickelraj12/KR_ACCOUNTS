import { DataTypes } from "sequelize";

export default (sequelize) => {
  const ContraEntryItem = sequelize.define("ContraEntryItem", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    contraEntryId: { type: DataTypes.STRING, allowNull: false },
    accountCode: DataTypes.STRING,
    debit: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    credit: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    narration: DataTypes.STRING,
    payload: { type: DataTypes.JSON, allowNull: false }
  });

  return ContraEntryItem;
};