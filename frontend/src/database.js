// Professional ERP database layer with dynamic server API synchronisation and optimistic local state cache.
// Keeps calculated accounting methods for ledger, cashbook, trial balance, P&L, and balance sheet active.

const BASE_URL = "/ams";

// The dynamic local cache state, initialized to empty and filled on runtime module load from the Express backend
let dbState = {
  groups: [],
  subGroups: [],
  accounts: [],
  vouchers: [],
  tds: [],
  closingStock: [],
  auditLogs: [],
  users: [],
  currentUser: null
};

const listeners = new Set();

export function subscribeToDB(listener) {
  listeners.add(listener);
  // Send current cache state immediately to the listener
  listener({ ...dbState });
  return () => {
    listeners.delete(listener);
  };
}

function notifyDB() {
  listeners.forEach(l => l({ ...dbState }));
}

export function getDB() {
  return dbState;
}

// Background API Synchronizer helper
async function apiCall(url, method = "POST", body = null) {
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" }
    };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(`${BASE_URL}${url}`, options);
    const result = await res.json();
    return result;
  } catch (error) {
    console.error(`[API Error] ${url}:`, error);
  }
}

// Immediately on module load, fire off a query to pull the latest state from the backend
fetch(`${BASE_URL}/db`)
  .then(res => {
    if (!res.ok) throw new Error("Could not fetch ERP db");
    return res.json();
  })
  .then(data => {
    if (data && typeof data === "object") {
      dbState = { ...dbState, ...data };
      dbState.users = dbState.users || [];
      if (dbState.currentUser === "SIVA") {
        dbState.currentUser = null;
      }
      notifyDB();
    }
  })
  .catch(err => {
    console.error("Critical: Could not connect to fullstack backend.", err);
  });

// Active user APIs
export function setCurrentUser(user) {
  dbState.currentUser = user || null;
  if (user) {
    addAuditLog("USER LOGGED IN", `User session started for ${dbState.currentUser}`);
  } else {
    addAuditLog("USER LOGGED OUT", `User securely logged out`);
  }
  apiCall("/user", "POST", { user });
  notifyDB();
}

export function getCurrentUser() {
  return dbState.currentUser;
}

// Authentication
export async function authenticateUser(username, password, isRegister) {
  try {
    const endpoint = isRegister ? "/auth/register" : "/auth/login";
    const result = await apiCall(endpoint, "POST", { username, password });
    
    if (result && result.success) {
      if (isRegister) {
        if (!dbState.users) dbState.users = [];
        dbState.users.push({ username });
        notifyDB();
      }
      return { success: true, user: result.user };
    } else {
      return { 
        success: false, 
        message: result?.message || (isRegister ? "Registration failed" : "Invalid credentials") 
      };
    }
  } catch (err) {
    return { success: false, message: "Server connection failed." };
  }
}

// Audit Log APIs
export function addAuditLog(action, details) {
  const log = {
    id: "LOG" + Date.now() + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    userName: dbState.currentUser,
    action,
    details
  };
  dbState.auditLogs.unshift(log);
  if (dbState.auditLogs.length > 200) {
    dbState.auditLogs.pop();
  }
  apiCall("/audit", "POST", { action, details });
  notifyDB();
}

// Group Operations
export function generateGroupId(mainDescription = "Assets", groups = []) {
  const prefixMap = {
    "assets": 1000,
    "liabilities": 2000,
    "incomes": 3000,
    "expenses": 4000,
    "profit & loss a/c": 5000,
    "profit & loss": 5000
  };
  
  const descKey = (mainDescription || "Assets").trim().toLowerCase();
  let baseNum = 1000;
  for (const [k, v] of Object.entries(prefixMap)) {
    if (descKey.includes(k) || k.includes(descKey)) {
      baseNum = v;
      break;
    }
  }

  const existingIds = new Set((groups || []).map(g => String(g.id || "").trim().toUpperCase()).filter(Boolean));
  
  let maxSuffix = 0;
  for (const g of groups || []) {
    const idStr = String(g.id || "").trim().toUpperCase();
    const m = idStr.match(/^G(\d{4})$/);
    if (m) {
      const num = parseInt(m[1], 10);
      if (num >= baseNum && num < baseNum + 1000) {
        const offset = num - baseNum;
        if (offset > maxSuffix) maxSuffix = offset;
      }
    }
  }

  let candidateNum = baseNum + maxSuffix + 1;
  while (existingIds.has(`G${candidateNum}`)) {
    candidateNum++;
  }
  return `G${candidateNum}`;
}

export function getGroups() { return dbState.groups; }
export function saveGroup(group) {
  const idx = dbState.groups.findIndex(g => g.id === group.id);
  let payload = { ...group };
  if (idx >= 0) {
    dbState.groups[idx] = payload;
  } else {
    payload.id = payload.id || generateGroupId(payload.mainDescription, dbState.groups);
    dbState.groups.push(payload);
  }
  addAuditLog("GROUP SAVE", `Saved Group ${payload.name}`);
  apiCall("/groups", "POST", payload);
  notifyDB();
}
export function deleteGroup(id) {
  dbState.groups = dbState.groups.filter(g => g.id !== id);
  addAuditLog("GROUP DELETE", `Deleted Group ID ${id}`);
  apiCall(`/groups/${id}`, "DELETE");
  notifyDB();
}

export async function bulkSaveGroups(groupsList = [], onProgress = () => {}) {
  const CHUNK_SIZE = 250;
  const total = groupsList.length;
  let processed = 0;

  const existingKeys = new Set((dbState.groups || []).map(g => String(g.id || "").toUpperCase()).filter(Boolean));
  const processedTemp = [];
  
  const sanitizedList = groupsList.map((grp) => {
    let finalId = grp.id ? String(grp.id).trim() : "";
    const cat = grp.mainDescription || "Assets";
    if (!finalId) {
      finalId = generateGroupId(cat, [...dbState.groups, ...processedTemp]);
      while (existingKeys.has(finalId.toUpperCase())) {
        const numPart = parseInt(finalId.replace(/\D/g, ""), 10) + 1;
        finalId = `G${numPart}`;
      }
      existingKeys.add(finalId.toUpperCase());
    } else {
      existingKeys.add(finalId.toUpperCase());
    }
    const item = {
      ...grp,
      id: finalId,
      name: grp.name || finalId,
      mainDescription: cat
    };
    processedTemp.push(item);
    return item;
  });

  const map = new Map();
  (dbState.groups || []).forEach(g => {
    if (g.id) map.set(String(g.id), g);
  });

  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = sanitizedList.slice(i, i + CHUNK_SIZE);
    await apiCall("/groups/bulk", "POST", chunk);
    
    chunk.forEach(grp => {
      map.set(String(grp.id), grp);
    });

    processed += chunk.length;
    onProgress(Math.min(processed, total), total);
    await new Promise(r => setTimeout(r, 5));
  }

  dbState.groups = Array.from(map.values());
  addAuditLog("BULK GROUP IMPORT", `Bulk imported ${total} groups`);
  notifyDB();
}

// SubGroups Operations
export function getSubGroups() { return dbState.subGroups; }
export async function saveSubGroup(sg) {
  const result = await apiCall("/subgroups", "POST", sg);

  if (result?.success && result.data) {
    const savedItem = result.data;
    const idx = dbState.subGroups.findIndex(s => s.id === savedItem.id);

    if (idx >= 0) {
      dbState.subGroups[idx] = savedItem;
    } else {
      dbState.subGroups.push(savedItem);
    }
    
    addAuditLog("SUBGROUP SAVE", `Saved SubGroup: ${savedItem.name}`);
    notifyDB();
  } else {
    // Optimistic fallback
    const idx = dbState.subGroups.findIndex(s => s.id === sg.id);
    if (idx >= 0) {
      dbState.subGroups[idx] = sg;
    } else {
      dbState.subGroups.push({ ...sg, id: sg.id || ("SG" + Date.now()) });
    }
    notifyDB();
  }
}
export function deleteSubGroup(id) {
  dbState.subGroups = dbState.subGroups.filter(s => s.id !== id);
  addAuditLog("SUBGROUP DELETE", `Deleted SubGroup ID ${id}`);
  apiCall(`/subgroups/${id}`, "DELETE");
  notifyDB();
}

export async function bulkSaveSubGroups(subgroupsList = [], onProgress = () => {}) {
  const CHUNK_SIZE = 250;
  const total = subgroupsList.length;
  let processed = 0;

  let counter = 1;
  const existingKeys = new Set((dbState.subGroups || []).map(s => String(s.id || "").toUpperCase()).filter(Boolean));

  const sanitizedList = subgroupsList.map((sg, idx) => {
    let finalId = sg.id ? String(sg.id).trim() : "";
    if (!finalId) {
      finalId = `SG-${String(counter).padStart(3, "0")}`;
      while (existingKeys.has(finalId.toUpperCase())) {
        counter++;
        finalId = `SG-${String(counter).padStart(3, "0")}`;
      }
      existingKeys.add(finalId.toUpperCase());
    } else {
      existingKeys.add(finalId.toUpperCase());
    }
    return {
      ...sg,
      id: finalId,
      name: sg.name || finalId,
      groupName: sg.groupName || "",
      mainDescription: sg.mainDescription || "Expenses",
      ledgerType: sg.ledgerType || "SUB LEDGER",
      tbSlNo: sg.tbSlNo !== undefined ? Number(sg.tbSlNo) || 0 : 0,
      pAndL: sg.pAndL !== undefined ? Number(sg.pAndL) || 0 : 0
    };
  });

  const map = new Map();
  (dbState.subGroups || []).forEach(s => {
    if (s.id) map.set(String(s.id), s);
  });

  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = sanitizedList.slice(i, i + CHUNK_SIZE);
    await apiCall("/subgroups/bulk", "POST", chunk);
    
    chunk.forEach(sg => {
      map.set(String(sg.id), sg);
    });

    processed += chunk.length;
    onProgress(Math.min(processed, total), total);
    await new Promise(r => setTimeout(r, 5));
  }

  dbState.subGroups = Array.from(map.values());
  addAuditLog("BULK SUBGROUP IMPORT", `Bulk imported ${total} subgroups`);
  notifyDB();
}

// Accounts Operations
export function getAccounts() { return dbState.accounts; }
export function saveAccount(acc) {
  const idx = dbState.accounts.findIndex(a => a.code === acc.code);
  let payload = { ...acc };
  if (idx >= 0) {
    dbState.accounts[idx] = payload;
  } else {
    if (!payload.code) {
      let maxCode = 60000000;
      for (const a of dbState.accounts || []) {
        const raw = String(a.code || "").trim();
        if (/^\d{8}$/.test(raw)) {
          const n = parseInt(raw, 10);
          if (n >= 60000001 && n > maxCode) maxCode = n;
        }
      }
      const existingCodes = new Set((dbState.accounts || []).map(a => String(a.code || "").trim()).filter(Boolean));
      let candidate = maxCode + 1;
      while (existingCodes.has(String(candidate))) {
        candidate++;
      }
      payload.code = String(candidate);
    }
    dbState.accounts.push(payload);
  }
  addAuditLog("ACCOUNT SAVE", `Saved Account ${payload.name} (${payload.code})`);
  apiCall("/accounts", "POST", payload);
  notifyDB();
}
export function deleteAccount(code) {
  dbState.accounts = dbState.accounts.filter(a => a.code !== code);
  addAuditLog("ACCOUNT DELETE", `Deleted Account Code ${code}`);
  apiCall(`/accounts/${code}`, "DELETE");
  notifyDB();
}

export async function bulkSaveAccounts(accountsList = [], onProgress = () => {}) {
  const CHUNK_SIZE = 500;
  const total = accountsList.length;
  let processed = 0;

  const existingKeys = new Set((dbState.accounts || []).map(a => String(a.code || "").toUpperCase()).filter(Boolean));

  let maxCode = 60000000;
  for (const a of dbState.accounts || []) {
    const raw = String(a.code || "").trim();
    if (/^\d{8}$/.test(raw)) {
      const n = parseInt(raw, 10);
      if (n >= 60000001 && n > maxCode) {
        maxCode = n;
      }
    }
  }
  let currentCounter = maxCode + 1;

  const sanitizedList = accountsList.map((acc) => {
    let finalCode = acc.code ? String(acc.code).trim() : "";
    if (!finalCode) {
      while (existingKeys.has(String(currentCounter))) {
        currentCounter++;
      }
      finalCode = String(currentCounter);
      existingKeys.add(finalCode.toUpperCase());
      currentCounter++;
    } else {
      existingKeys.add(finalCode.toUpperCase());
    }
    return {
      ...acc,
      code: finalCode,
      name: acc.name || finalCode,
      groupName: acc.groupName || "",
      subGroupName: acc.subGroupName || "",
      openingDebit: parseFloat(acc.openingDebit) || 0,
      openingCredit: parseFloat(acc.openingCredit) || 0
    };
  });

  const accountMap = new Map();
  (dbState.accounts || []).forEach(a => {
    if (a.code) accountMap.set(String(a.code), a);
  });

  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = sanitizedList.slice(i, i + CHUNK_SIZE);
    await apiCall("/accounts/bulk", "POST", chunk);
    
    chunk.forEach(acc => {
      accountMap.set(String(acc.code), acc);
    });

    processed += chunk.length;
    onProgress(Math.min(processed, total), total);
    await new Promise(r => setTimeout(r, 5));
  }

  dbState.accounts = Array.from(accountMap.values());
  addAuditLog("BULK ACCOUNT IMPORT", `Bulk imported ${total} accounts`);
  notifyDB();
}

// Vouchers Operations
export function getVouchers() { return dbState.vouchers; }
export function saveVoucher(v) {
  const idx = dbState.vouchers.findIndex(item => item.id === v.id);
  
  let calculatedTotal = 0;
  if(v.items && v.items.length) {
    calculatedTotal = v.items.reduce((sum, current) => sum + (parseFloat(current.debit) || 0), 0);
    if (calculatedTotal === 0) {
      calculatedTotal = v.items.reduce((sum, current) => sum + (parseFloat(current.credit) || 0), 0);
    }
  }

  const voucherData = {
    ...v,
    totalAmount: calculatedTotal,
    userName: dbState.currentUser,
    createdAt: v.createdAt || new Date().toISOString()
  };

  if (idx >= 0) {
    dbState.vouchers[idx] = voucherData;
    addAuditLog("VOUCHER UPDATE", `Updated ${v.type} Voucher No ${v.voucherNo}`);
  } else {
    voucherData.id = "V" + Date.now() + Math.floor(Math.random()*1000);
    dbState.vouchers.unshift(voucherData);
    addAuditLog("VOUCHER ADD", `Added ${v.type} Voucher No ${v.voucherNo}`);
  }
  
  if (voucherData.type === "CONTRA") {
    apiCall("/contra-entries", "POST", voucherData);
  } else {
    apiCall("/vouchers", "POST", voucherData);
  }
  
  notifyDB();
  return voucherData;
}

export function deleteVoucher(id) {
  const v = dbState.vouchers.find(item => item.id === id);
  dbState.vouchers = dbState.vouchers.filter(item => item.id !== id);
  if (v) {
    addAuditLog("VOUCHER DELETE", `Deleted ${v.type} Voucher No ${v.voucherNo}`);
    if (v.type === "CONTRA") {
      apiCall(`/contra-entries/${id}`, "DELETE");
    } else {
      apiCall(`/vouchers/${id}`, "DELETE");
    }
  } else {
    apiCall(`/vouchers/${id}`, "DELETE");
  }
  notifyDB();
}

// TDS Operations
export function getTds() { return dbState.tds; }
export async function saveTds(item) {
  const result = await apiCall("/tds", "POST", item);

  if (result?.success && result.data) {
    const savedItem = result.data;
    const idx = dbState.tds.findIndex(t => t.code === savedItem.code);

    if (idx >= 0) {
      dbState.tds[idx] = savedItem;
    } else {
      dbState.tds.push(savedItem);
    }
    
    addAuditLog("TDS MASTER SAVE", `Saved TDS: ${savedItem.name} (${savedItem.code})`);
    notifyDB();
  } else {
    const idx = dbState.tds.findIndex(t => t.code === item.code);
    if (idx >= 0) {
      dbState.tds[idx] = item;
    } else {
      dbState.tds.push(item);
    }
    notifyDB();
  }
}
export function deleteTds(code) {
  dbState.tds = dbState.tds.filter(t => t.code !== code);
  addAuditLog("TDS MASTER DELETE", `Deleted TDS code ${code}`);
  apiCall(`/tds/${code}`, "DELETE");
  notifyDB();
}

export async function bulkSaveTds(tdsList = [], onProgress = () => {}) {
  const CHUNK_SIZE = 250;
  const total = tdsList.length;
  let processed = 0;

  const map = new Map();
  dbState.tds.forEach(t => map.set(String(t.code), t));

  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = tdsList.slice(i, i + CHUNK_SIZE);
    await apiCall("/tds/bulk", "POST", chunk);
    
    chunk.forEach(t => {
      map.set(String(t.code), t);
    });

    processed += chunk.length;
    onProgress(Math.min(processed, total), total);
    await new Promise(r => setTimeout(r, 5));
  }

  dbState.tds = Array.from(map.values());
  addAuditLog("BULK TDS IMPORT", `Bulk imported ${total} TDS records`);
  notifyDB();
}

// Closing Stock Operations
export function getClosingStock() { return dbState.closingStock; }
export function saveClosingStock(item) {
  const idx = dbState.closingStock.findIndex(c => c.id === item.id);
  let payload = { ...item };
  if (idx >= 0) {
    dbState.closingStock[idx] = payload;
  } else {
    payload.id = "CS" + Date.now();
    dbState.closingStock.push(payload);
  }
  apiCall("/closing-stocks", "POST", payload);
  notifyDB();
}
export function deleteClosingStock(id) {
  dbState.closingStock = dbState.closingStock.filter(c => c.id !== id);
  apiCall(`/closing-stocks/${id}`, "DELETE");
  notifyDB();
}

// --- CALCULATED ACCOUNTING ENGINE ---

// Generates general ledger lines for an account with start/end date
export function computeGeneralLedgerRange(accountCode, fromStr, toStr) {
  const acc = dbState.accounts.find(a => a.code === accountCode);
  if (!acc) return { account: null, lines: [], openingBalance: 0, endingBalance: 0 };

  const fromDate = new Date(fromStr || "1970-01-01");
  const toDate = new Date(toStr || "9999-12-31");

  // Initial opening balances from master
  let opBal = (acc.openingDebit || 0) - (acc.openingCredit || 0);

  // Filter vouchers that target this account
  const list = [];
  const sortedVrs = [...dbState.vouchers].sort((a,b) => new Date(a.voucherDate).getTime() - new Date(b.voucherDate).getTime());

  for (const v of sortedVrs) {
    const vDate = new Date(v.voucherDate);
    const targetedLine = v.items ? v.items.filter(item => item.accountCode === accountCode) : [];

    for (const item of targetedLine) {
      const lineDebit = parseFloat(item.debit) || 0;
      const lineCredit = parseFloat(item.credit) || 0;

      if (vDate < fromDate) {
        opBal += (lineDebit - lineCredit);
      } else if (vDate <= toDate) {
        list.push({
          voucherId: v.id,
          voucherNo: v.voucherNo,
          voucherDate: v.voucherDate,
          type: v.type,
          narration: item.narration || v.narration,
          debit: lineDebit,
          credit: lineCredit,
          rawItem: item
        });
      }
    }
  }

  let running = opBal;
  const processedLines = list.map(l => {
    running += (l.debit - l.credit);
    return {
      ...l,
      balance: running
    };
  });

  return {
    account: acc,
    openingBalance: opBal,
    endingBalance: running,
    lines: processedLines
  };
}

// Cash Book Statement computation helper
export function computeCashBook(fromStr, toStr) {
  const cashAccounts = dbState.accounts.filter(a => 
    a.subGroupName === "CASH - ON - HAND" || 
    (a.name && a.name.toLowerCase().includes("cash"))
  );
  const targetCode = cashAccounts.length > 0 ? cashAccounts[0].code : null;

  if (!targetCode) {
    return { account: null, lines: [], openingBalance: 0, endingBalance: 0 };
  }
  return computeGeneralLedgerRange(targetCode, fromStr, toStr);
}

// Trial balance calculation over all ledger accounts
export function computeTrialBalance(asOfDateStr) {
  const asOf = asOfDateStr ? new Date(asOfDateStr) : new Date("9999-12-31");
  const balances = [];
  let totalDebit = 0;
  let totalCredit = 0;

  for (const acc of dbState.accounts) {
    let bal = (parseFloat(acc.openingDebit) || 0) - (parseFloat(acc.openingCredit) || 0);

    for (const v of dbState.vouchers) {
      if (new Date(v.voucherDate) <= asOf && v.items) {
        for (const item of v.items) {
          if (item.accountCode === acc.code) {
            bal += (parseFloat(item.debit) || 0) - (parseFloat(item.credit) || 0);
          }
        }
      }
    }

    if (bal !== 0 || acc.openingDebit > 0 || acc.openingCredit > 0) {
      const lineDebit = bal > 0 ? bal : 0;
      const lineCredit = bal < 0 ? Math.abs(bal) : 0;
      totalDebit += lineDebit;
      totalCredit += lineCredit;

      balances.push({
        code: acc.code,
        name: acc.name,
        groupName: acc.groupName || "",
        subGroupName: acc.subGroupName || "",
        debit: lineDebit,
        credit: lineCredit
      });
    }
  }

  return {
    lines: balances,
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
  };
}

// Profit & Loss calculation statement
export function computeProfitLoss(fromStr, toStr) {
  const fromDate = new Date(fromStr || "1970-01-01");
  const toDate = new Date(toStr || "9999-12-31");

  let salesAccounts = 0;
  let directExpenses = 0;
  let indirectIncomes = 0;
  let indirectExpenses = 0;
  let openingStock = 0;
  let closingStockVal = 0;

  const incomeLines = [];
  const expenseLines = [];

  for (const acc of dbState.accounts) {
    let bal = (parseFloat(acc.openingDebit) || 0) - (parseFloat(acc.openingCredit) || 0);
    for (const v of dbState.vouchers) {
      const vDate = new Date(v.voucherDate);
      if (vDate >= fromDate && vDate <= toDate && v.items) {
        for (const item of v.items) {
          if (item.accountCode === acc.code) {
            bal += (parseFloat(item.debit) || 0) - (parseFloat(item.credit) || 0);
          }
        }
      }
    }

    const sub = dbState.subGroups.find(s => s.name === acc.subGroupName);
    const mainCategory = sub?.mainDescription || acc.mainGroupName || "";

    if (mainCategory === "Incomes" || acc.groupName === "Sales Accounts") {
      const incVal = Math.abs(bal);
      salesAccounts += incVal;
      incomeLines.push({ name: acc.name, code: acc.code, value: incVal, group: acc.subGroupName });
    } else if (mainCategory === "Expenses" || acc.groupName === "Direct Expenses" || acc.groupName === "Indirect Expenses") {
      const expVal = Math.abs(bal);
      if (acc.groupName === "Direct Expenses") {
        directExpenses += expVal;
      } else {
        indirectExpenses += expVal;
      }
      expenseLines.push({ name: acc.name, code: acc.code, value: expVal, group: acc.subGroupName });
    }
  }

  const grossProfit = (salesAccounts + closingStockVal) - (openingStock + directExpenses);
  const netProfit = (grossProfit + indirectIncomes) - indirectExpenses;

  return {
    salesAccounts,
    closingStock: closingStockVal,
    openingStock,
    directExpenses,
    grossProfit,
    indirectIncomes,
    indirectExpenses,
    netProfit,
    incomeLines,
    expenseLines
  };
}

// Balance Sheet computation model
export function computeBalanceSheet(asOfDateStr) {
  const asOf = asOfDateStr ? new Date(asOfDateStr) : new Date();
  const pl = computeProfitLoss("1970-01-01", asOf.toISOString().split("T")[0]);

  let shareCapital = 0;
  let reservesAndSurplus = 0;
  let currentLiabilities = 0;
  let fixedAssets = 0;
  let currentAssets = 0;
  let bankBalances = 0;
  let cashOnHand = 0;

  const liabilities = [];
  const assets = [];

  for (const acc of dbState.accounts) {
    let balVal = (parseFloat(acc.openingDebit) || 0) - (parseFloat(acc.openingCredit) || 0);
    for (const v of dbState.vouchers) {
      if (new Date(v.voucherDate) <= asOf && v.items) {
        for (const item of v.items) {
          if (item.accountCode === acc.code) {
            balVal += (parseFloat(item.debit) || 0) - (parseFloat(item.credit) || 0);
          }
        }
      }
    }

    const sub = dbState.subGroups.find(s => s.name === acc.subGroupName);
    const mainCategory = sub?.mainDescription || acc.mainGroupName || "";

    if (mainCategory === "Liabilities" && acc?.groupName !== "Capital Account") {
      currentLiabilities += Math.abs(balVal);
      liabilities.push({ name: acc.name, code: acc.code, value: Math.abs(balVal), group: acc.subGroupName });
    } else if (mainCategory === "Assets" || acc?.groupName === "Fixed Assets") {
      if (acc?.groupName === "Fixed Assets") {
        fixedAssets += balVal;
        assets.push({ name: acc.name, code: acc.code, value: balVal, group: "Fixed Assets" });
      } else if (acc?.subGroupName === "CASH - ON - HAND") {
        cashOnHand += balVal;
        assets.push({ name: acc.name, code: acc.code, value: balVal, group: "Cash on Hand" });
      } else if (acc?.subGroupName === "BANK ACCOUNTS") {
        bankBalances += balVal;
        assets.push({ name: acc.name, code: acc.code, value: balVal, group: "Bank Balances" });
      } else {
        currentAssets += balVal;
        assets.push({ name: acc.name, code: acc.code, value: balVal, group: acc.subGroupName || "Current Assets" });
      }
    }
  }

  reservesAndSurplus += pl.netProfit;

  const totalLiabilities = shareCapital + reservesAndSurplus + currentLiabilities;
  const totalAssets = fixedAssets + currentAssets + bankBalances + cashOnHand + pl.closingStock;

  return {
    shareCapital,
    reservesAndSurplus,
    currentLiabilities,
    liabilities,
    fixedAssets,
    currentAssets: currentAssets + pl.closingStock,
    closingStock: pl.closingStock,
    bankBalances,
    cashOnHand,
    assets,
    totalLiabilities,
    totalAssets,
    unbalancedAmount: Math.abs(totalLiabilities - totalAssets)
  };
}
