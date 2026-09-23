import { DataTypes } from "sequelize";

export default (sequelize) => sequelize.define("Account", {
  code: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  groupName: { type: DataTypes.STRING },
  subGroupName: { type: DataTypes.STRING },
  openingDebit: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  openingCredit: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  payload: { type: DataTypes.JSON }
});
