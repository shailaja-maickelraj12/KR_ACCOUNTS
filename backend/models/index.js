import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import defineUser from "./User.js";
import defineAccount from "./Account.js";
import defineGroup from "./Group.js";
import defineSubGroup from "./SubGroup.js";
import defineVoucher from "./Voucher.js";
import defineVoucherItem from "./VoucherItem.js";
import defineTDSMaster from "./TDSMaster.js";
import defineAuditLog from "./AuditLog.js";
import defineContraEntry from "./ContraEntry.js";
import defineContraEntryItem from "./ContraEntryItem.js";

const User = defineUser(sequelize);
const Account = defineAccount(sequelize);
const Group = defineGroup(sequelize);
const SubGroup = defineSubGroup(sequelize);
const Voucher = defineVoucher(sequelize);
const VoucherItem = defineVoucherItem(sequelize);
const TDSMaster = defineTDSMaster(sequelize);
const AuditLog = defineAuditLog(sequelize);
const ContraEntry = defineContraEntry(sequelize);
const ContraEntryItem = defineContraEntryItem(sequelize);

const AppRecord = sequelize.define("AppRecord", {
  collection: { type: DataTypes.STRING, primaryKey: true },
  recordKey: { type: DataTypes.STRING, primaryKey: true },
  payload: { type: DataTypes.JSON, allowNull: false }
});

Voucher.hasMany(VoucherItem, { foreignKey: "voucherId", sourceKey: "id", as: "items", onDelete: "CASCADE" });
VoucherItem.belongsTo(Voucher, { foreignKey: "voucherId", targetKey: "id" });
ContraEntry.hasMany(ContraEntryItem, { foreignKey: "contraEntryId", sourceKey: "id", as: "items", onDelete: "CASCADE" });
ContraEntryItem.belongsTo(ContraEntry, { foreignKey: "contraEntryId", targetKey: "id" });

export {
  sequelize,
  User,
  Account,
  Group,
  SubGroup,
  Voucher,
  VoucherItem,
  TDSMaster,
  AuditLog,
  AppRecord,
  ContraEntry,
  ContraEntryItem
};
