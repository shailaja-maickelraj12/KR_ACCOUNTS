import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "TDSMaster",
    {
      code: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false
      },

      tdsPercentage: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },

      scPercentage: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },

      chessPercentage: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },

      hsChessPercentage: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },

      accountHeadName: {
        type: DataTypes.STRING,
        allowNull: true
      },

      sectionCode: {
        type: DataTypes.STRING,
        allowNull: true
      },

      payload: {
        type: DataTypes.JSON,
        allowNull: true
      }
    },
    {
      tableName: "tds_masters",
      timestamps: true
    }
  );