import { Account, AppRecord, Group, SubGroup, TDSMaster, User } from "../models/index.js";

const unwrap = (row) => {
  const plain = row.toJSON();
  return { ...plain.payload, ...plain };
};

const upsertByKey = async (Model, keyField, data, fallbackPrefix) => {
  const key = data[keyField] || `${fallbackPrefix}${Date.now()}`;
  
  const recordData = { 
    ...data, 
    [keyField]: key,
    payload: data
  };
  
  await Model.upsert(recordData);
  return recordData;
};

const destroyByKey = (Model, keyField, key) => Model.destroy({ where: { [keyField]: key } });

const listAppRecords = async (collection) => {
  const rows = await AppRecord.findAll({ where: { collection }, order: [["updatedAt", "ASC"]] });
  return rows.map((row) => row.payload);
};

const upsertAppRecord = async (collection, keyField, data, fallbackPrefix) => {
  const recordKey = data[keyField] || `${fallbackPrefix}${Date.now()}`;
  const payload = { ...data, [keyField]: recordKey };
  await AppRecord.upsert({ collection, recordKey, payload });
  return payload;
};

const deleteAppRecord = (collection, recordKey) => AppRecord.destroy({ where: { collection, recordKey } });

export const getMastersState = async () => ({
  groups: (await Group.findAll()).map(unwrap),
  subGroups: (await SubGroup.findAll()).map(unwrap),
  accounts: (await Account.findAll()).map(unwrap),
  tds: (await TDSMaster.findAll()).map(unwrap),
  closingStock: await listAppRecords("closingStock"),
  users: (await User.findAll()).map(u => ({ id: u.id, username: u.userName }))
});

export const saveAccount = async (data) => {
  let account = { ...data };
  if (!account.code) {
    const accounts = await Account.findAll();
    const existingCodes = new Set(accounts.map(a => String(a.code || "").trim()).filter(Boolean));
    
    if (account.subGroupName) {
      const subAccs = accounts.filter(
        a => a.subGroupName && a.subGroupName.trim().toLowerCase() === account.subGroupName.trim().toLowerCase()
      );
      let maxNum = -1;
      let padLen = 0;
      for (const a of subAccs) {
        const raw = String(a.code || "").trim();
        if (/^\d+$/.test(raw)) {
          const n = parseInt(raw, 10);
          if (n > maxNum) {
            maxNum = n;
            padLen = raw.length;
          }
        }
      }
      if (maxNum > 0) {
        let candidate = maxNum + 1;
        while (existingCodes.has(String(candidate).padStart(padLen, "0"))) {
          candidate++;
        }
        account.code = String(candidate).padStart(padLen, "0");
      }
    }

    if (!account.code) {
      const highestCode = accounts.reduce((highest, row) => {
        const numericCode = Number(row.code);
        return Number.isInteger(numericCode) && numericCode > highest ? numericCode : highest;
      }, 1000000);
      let candidate = highestCode + 1;
      while (existingCodes.has(String(candidate))) {
        candidate++;
      }
      account.code = String(candidate);
    }
  }

  return upsertByKey(Account, "code", account, "ACC");
};

export const deleteAccount = (code) => destroyByKey(Account, "code", code);

export const bulkSaveAccounts = async (accountsList = []) => {
  if (!Array.isArray(accountsList) || accountsList.length === 0) return { count: 0 };
  const records = accountsList.map(item => {
    const key = item.code || `ACC${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      ...item,
      code: key,
      payload: item
    };
  });
  await Account.bulkCreate(records, {
    updateOnDuplicate: [
      "name", "groupName", "subGroupName", "openingDebit", "openingCredit", "payload", "updatedAt"
    ]
  });
  return { count: records.length, data: records };
};

export const saveGroup = (data) => upsertByKey(Group, "id", data, "G");
export const deleteGroup = (id) => destroyByKey(Group, "id", id);

export const bulkSaveGroups = async (groupsList = []) => {
  if (!Array.isArray(groupsList) || groupsList.length === 0) return { count: 0 };
  const records = groupsList.map(item => {
    const key = item.id || `G${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      ...item,
      id: key,
      payload: item
    };
  });
  await Group.bulkCreate(records, {
    updateOnDuplicate: ["name", "mainDescription", "payload", "updatedAt"]
  });
  return { count: records.length, data: records };
};

export const saveSubGroup = async (data) => {
  const saved = await upsertByKey(SubGroup, "id", data, "SG");
  const id = saved?.id ?? data?.id;
  const row = await SubGroup.findOne({ where: { id } });
  if (!row) return saved;
  const plain = row.toJSON();
  return { ...plain.payload, ...plain };
};

export const deleteSubGroup = (id) => destroyByKey(SubGroup, "id", id);

export const bulkSaveSubGroups = async (subgroupsList = []) => {
  if (!Array.isArray(subgroupsList) || subgroupsList.length === 0) return { count: 0 };
  const records = subgroupsList.map(item => {
    const key = item.id || `SG${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      ...item,
      id: key,
      payload: item
    };
  });
  await SubGroup.bulkCreate(records, {
    updateOnDuplicate: ["name", "groupName", "mainDescription", "ledgerType", "tbSlNo", "pAndL", "payload", "updatedAt"]
  });
  return { count: records.length, data: records };
};

export const saveTds = async (data) => {
  const saved = await upsertByKey(TDSMaster, "code", data, "TDS");
  const code = saved?.code ?? data?.code;
  const row = await TDSMaster.findOne({ where: { code } });
  if (!row) return saved;
  const plain = row.toJSON();
  return { ...plain.payload, ...plain };
};

export const deleteTds = (code) => destroyByKey(TDSMaster, "code", code);

export const bulkSaveTds = async (tdsList = []) => {
  if (!Array.isArray(tdsList) || tdsList.length === 0) return { count: 0 };
  const records = tdsList.map(item => {
    const key = item.code || `TDS${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      ...item,
      code: key,
      payload: item
    };
  });
  await TDSMaster.bulkCreate(records, {
    updateOnDuplicate: [
      "name", "tdsPercentage", "scPercentage", "chessPercentage", 
      "hsChessPercentage", "accountHeadName", "sectionCode", "payload", "updatedAt"
    ]
  });
  return { count: records.length, data: records };
};

export const saveClosingStock = (data) => upsertAppRecord("closingStock", "id", data, "CS");
export const deleteClosingStock = (id) => deleteAppRecord("closingStock", id);
export const saveUser = (data) => upsertAppRecord("users", "id", data, "U");
export const deleteUser = (id) => deleteAppRecord("users", id);

export const registerUser = async (username, password) => {
  const existingUser = await User.findOne({ where: { userName: username } });
  if (existingUser) {
    return { success: false, message: "Username already exists." };
  }
  await User.create({ userName: username, password });
  return { success: true, user: username };
};

export const loginUser = async (username, password) => {
  const user = await User.findOne({ where: { userName: username } });
  if (!user) return { success: false, message: "User not found. Please create an account." };
  if (user.password !== password) return { success: false, message: "Invalid password." };
  return { success: true, user: user.userName };
};
