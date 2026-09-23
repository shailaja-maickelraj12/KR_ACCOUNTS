import { DataTypes } from "sequelize";

export default (sequelize) => sequelize.define("SubGroup", {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  groupName: { type: DataTypes.STRING },
  mainDescription: { type: DataTypes.STRING },
  ledgerType: { type: DataTypes.STRING },
  tbSlNo: { type: DataTypes.INTEGER },
  pAndL: { type: DataTypes.INTEGER },
  payload: { type: DataTypes.JSON }
});
