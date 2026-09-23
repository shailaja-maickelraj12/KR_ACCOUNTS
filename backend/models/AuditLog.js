import { DataTypes } from "sequelize";

export default (sequelize) => sequelize.define("AuditLog", {
  id: { type: DataTypes.STRING, primaryKey: true },
  timestamp: { type: DataTypes.DATE, allowNull: false },
  userName: { type: DataTypes.STRING },
  action: { type: DataTypes.STRING, allowNull: false },
  details: { type: DataTypes.TEXT }
});
