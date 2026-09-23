import { DataTypes } from "sequelize";

export default (sequelize) => sequelize.define("Group", {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  mainDescription: { type: DataTypes.STRING },
  payload: { type: DataTypes.JSON }
});
