// export const createSeedDatabase = () => ({
//   groups: [
//     { id: "GRP-ASSET", name: "Current Assets", mainDescription: "Assets" },
//     { id: "GRP-BANK", name: "Bank Accounts", mainDescription: "Assets" },
//     { id: "GRP-SALES", name: "Sales Accounts", mainDescription: "Incomes" },
//     { id: "GRP-DIRECT-EXP", name: "Direct Expenses", mainDescription: "Expenses" },
//     { id: "GRP-INDIRECT-EXP", name: "Indirect Expenses", mainDescription: "Expenses" },
//     { id: "GRP-LIABILITY", name: "Current Liabilities", mainDescription: "Liabilities" }
//   ],
//   subGroups: [
//     { id: "SG-CASH", name: "CASH - ON - HAND", groupName: "Current Assets", mainDescription: "Assets", ledgerType: "GENERAL LEDGER", tbSlNo: 1, pAndL: 0 },
//     { id: "SG-BANK", name: "BANK ACCOUNTS", groupName: "Bank Accounts", mainDescription: "Assets", ledgerType: "GENERAL LEDGER", tbSlNo: 2, pAndL: 0 },
//     { id: "SG-DEBTORS", name: "SUNDRY DEBTORS", groupName: "Current Assets", mainDescription: "Assets", ledgerType: "GENERAL LEDGER", tbSlNo: 3, pAndL: 0 },
//     { id: "SG-SALES", name: "DOMESTIC SALES", groupName: "Sales Accounts", mainDescription: "Incomes", ledgerType: "GENERAL LEDGER", tbSlNo: 11, pAndL: 1 },
//     { id: "SG-FREIGHT", name: "FREIGHT & CARTAGE", groupName: "Direct Expenses", mainDescription: "Expenses", ledgerType: "GENERAL LEDGER", tbSlNo: 21, pAndL: 1 },
//     { id: "SG-ADMIN", name: "ADMINISTRATIVE EXPENSES", groupName: "Indirect Expenses", mainDescription: "Expenses", ledgerType: "GENERAL LEDGER", tbSlNo: 31, pAndL: 1 },
//     { id: "SG-TAX", name: "STATUTORY PAYABLES", groupName: "Current Liabilities", mainDescription: "Liabilities", ledgerType: "GENERAL LEDGER", tbSlNo: 41, pAndL: 0 }
//   ],
//   accounts: [
//     { code: "1001007", name: "Cash - Main Office", groupName: "Current Assets", subGroupName: "CASH - ON - HAND", place: "Kovilpatti", phone: "04632-220101", address: "Main cashier counter", openingDebit: 18500, openingCredit: 0 },
//     { code: "1002001", name: "Indian Overseas Bank - Current A/c", groupName: "Bank Accounts", subGroupName: "BANK ACCOUNTS", place: "Kovilpatti", phone: "04632-240111", address: "IOB current account", openingDebit: 122500, openingCredit: 0 },
//     { code: "2003001", name: "Sri Lakshmi Traders", groupName: "Current Assets", subGroupName: "SUNDRY DEBTORS", place: "Madurai", phone: "98430 11122", address: "West Masi Street, Madurai", openingDebit: 45000, openingCredit: 0 },
//     { code: "2003002", name: "Vel Export Agencies", groupName: "Current Assets", subGroupName: "SUNDRY DEBTORS", place: "Tuticorin", phone: "98431 55590", address: "Harbour Road, Tuticorin", openingDebit: 27500, openingCredit: 0 },
//     { code: "4001001", name: "Domestic Yarn Sales", groupName: "Sales Accounts", subGroupName: "DOMESTIC SALES", place: "Kovilpatti", phone: "", address: "Sales ledger", openingDebit: 0, openingCredit: 0 },
//     { code: "5001001", name: "Freight Outward", groupName: "Direct Expenses", subGroupName: "FREIGHT & CARTAGE", place: "Kovilpatti", phone: "", address: "Transport expense ledger", openingDebit: 0, openingCredit: 0 },
//     { code: "6001001", name: "Office Maintenance", groupName: "Indirect Expenses", subGroupName: "ADMINISTRATIVE EXPENSES", place: "Kovilpatti", phone: "", address: "Admin expense ledger", openingDebit: 0, openingCredit: 0 },
//     { code: "7001001", name: "TDS Payable", groupName: "Current Liabilities", subGroupName: "STATUTORY PAYABLES", place: "Kovilpatti", phone: "", address: "Statutory deduction ledger", openingDebit: 0, openingCredit: 8500 }
//   ],
//   vouchers: [
//     {
//       id: "V-SEED-JV-001",
//       voucherNo: "JV-001",
//       voucherDate: "2026-04-03",
//       type: "JV",
//       narration: "Sales invoice booked for Sri Lakshmi Traders",
//       totalAmount: 32000,
//       userName: "SIVA",
//       createdAt: "2026-04-03T10:00:00.000Z",
//       items: [
//         { accountCode: "2003001", accountName: "Sri Lakshmi Traders", debit: 32000, credit: 0, narration: "Invoice receivable booked" },
//         { accountCode: "4001001", accountName: "Domestic Yarn Sales", debit: 0, credit: 32000, narration: "Domestic sales revenue" }
//       ]
//     },
//     {
//       id: "V-SEED-JV-002",
//       voucherNo: "PV-001",
//       voucherDate: "2026-04-05",
//       type: "PV",
//       narration: "Year-end freight provision",
//       totalAmount: 7800,
//       userName: "PRIYA",
//       createdAt: "2026-04-05T12:30:00.000Z",
//       items: [
//         { accountCode: "5001001", accountName: "Freight Outward", debit: 7800, credit: 0, narration: "Provision for freight bills" },
//         { accountCode: "7001001", accountName: "TDS Payable", debit: 0, credit: 7800, narration: "Provision liability" }
//       ]
//     },
//     {
//       id: "V-SEED-CP-001",
//       voucherNo: "CP-001",
//       voucherDate: "2026-04-08",
//       type: "CP",
//       narration: "Paid office maintenance by cash",
//       chequeNo: "",
//       chequeName: "",
//       totalAmount: 3650,
//       userName: "SIVA",
//       createdAt: "2026-04-08T09:15:00.000Z",
//       items: [
//         { accountCode: "6001001", accountName: "Office Maintenance", debit: 3650, credit: 0, narration: "Electrical and stationery expenses" },
//         { accountCode: "1001007", accountName: "Cash - Main Office", debit: 0, credit: 3650, narration: "Cash paid" }
//       ]
//     },
//     {
//       id: "V-SEED-CR-001",
//       voucherNo: "CR-001",
//       voucherDate: "2026-04-10",
//       type: "CR",
//       narration: "Receipt from Vel Export Agencies",
//       totalAmount: 15000,
//       userName: "ARUN",
//       createdAt: "2026-04-10T11:45:00.000Z",
//       items: [
//         { accountCode: "1001007", accountName: "Cash - Main Office", debit: 15000, credit: 0, narration: "Cash received" },
//         { accountCode: "2003002", accountName: "Vel Export Agencies", debit: 0, credit: 15000, narration: "Part payment received" }
//       ]
//     },
//     {
//       id: "V-SEED-CONTRA-001",
//       voucherNo: "CT-001",
//       voucherDate: "2026-04-12",
//       type: "CONTRA",
//       narration: "Cash deposited into bank",
//       totalAmount: 20000,
//       userName: "SIVA",
//       createdAt: "2026-04-12T13:20:00.000Z",
//       items: [
//         { accountCode: "1002001", accountName: "Indian Overseas Bank - Current A/c", debit: 20000, credit: 0, narration: "Cash deposit" },
//         { accountCode: "1001007", accountName: "Cash - Main Office", debit: 0, credit: 20000, narration: "Transferred to bank" }
//       ]
//     }
//   ],
//   tds: [
//     { code: "TDS1", name: "Contractor TDS", rate: 1, tdsPercentage: 1, scPercentage: 0, accountHeadCode: "7001001", accountHeadName: "TDS Payable", sectionCode: "194C" },
//     { code: "TDS2", name: "Professional TDS", rate: 10, tdsPercentage: 10, scPercentage: 0, accountHeadCode: "7001001", accountHeadName: "TDS Payable", sectionCode: "194J" }
//   ],
//   serviceTax: [
//     { code: "ST1", name: "GST Freight RCM", rate: 5, taxPercentage: 5, scPercentage: 0, chessPercentage: 0, accountCode: "7001001", accountName: "TDS Payable" },
//     { code: "ST2", name: "GST Services RCM", rate: 18, taxPercentage: 18, scPercentage: 0, chessPercentage: 0, accountCode: "7001001", accountName: "TDS Payable" }
//   ],
//   plSettings: [
//     { id: "PL-SEED-1", desc: "Domestic Sales", groupName: "Sales Accounts", sortOrder: 1 },
//     { id: "PL-SEED-2", desc: "Direct Freight", groupName: "Direct Expenses", sortOrder: 2 }
//   ],
//   // bsGroups: [
//   //   { code: "BS-CASH", name: "Cash and Bank", mainGroupCode: "BSM-ASSET", side: "ASSET", sortOrder: 1 },
//   //   { code: "BS-STAT", name: "Statutory Payables", mainGroupCode: "BSM-LIABILITY", side: "LIABILITY", sortOrder: 1 }
//   // ],
//   reverseTypes: [
//     { code: "RCM-FRT", name: "Freight Reverse Charge", taxPercentage: 5 },
//     { code: "RCM-SVC", name: "Service Reverse Charge", taxPercentage: 18 }
//   ],
//   reverseBills: [
//     { id: "RB-SEED-001", billNo: "RB-001", billDate: "2026-04-06", accDate: "2026-04-06", partyName: "Kumar Roadways", reverseTypeCode: "RCM-FRT", taxableAmount: 12000, taxAmount: 600, grandTotal: 12600, narration: "Inbound freight under RCM" },
//     { id: "RB-SEED-002", billNo: "RB-002", billDate: "2026-04-14", accDate: "2026-04-14", partyName: "Prime Compliance Services", reverseTypeCode: "RCM-SVC", taxableAmount: 9000, taxAmount: 1620, grandTotal: 10620, narration: "Professional service RCM" }
//   ],
//   // billWiseOpenings: [
//   //   { id: "BWO-SEED-001", accountCode: "2003001", accountName: "Sri Lakshmi Traders", billNo: "SLT-OP-01", billDate: "2026-04-01", debit: 25000, credit: 0 },
//   //   { id: "BWO-SEED-002", accountCode: "2003002", accountName: "Vel Export Agencies", billNo: "VEA-OP-01", billDate: "2026-04-01", debit: 17500, credit: 0 }
//   // ],
//   auditLogs: [
//     { id: "LOG-SEED-001", timestamp: "2026-04-03T10:00:00.000Z", userName: "SIVA", action: "VOUCHER ADD", details: "Added JV Voucher No JV-001" },
//     { id: "LOG-SEED-002", timestamp: "2026-04-05T12:30:00.000Z", userName: "PRIYA", action: "VOUCHER ADD", details: "Added provision voucher PV-001" },
//     { id: "LOG-SEED-003", timestamp: "2026-04-10T11:45:00.000Z", userName: "ARUN", action: "CASH RECEIPT", details: "Recorded receipt from Vel Export Agencies" }
//   ],
//   closingStock: [
//     { id: "CS-SEED-001", stockDate: "2026-04-17", description: "Finished yarn stock", debit: 0, credit: 42000 },
//     { id: "CS-SEED-002", stockDate: "2026-04-17", description: "Packing material stock", debit: 0, credit: 8500 }
//   ],
//   cForms: [],
//   fForms: [],
//   hForms: [],
//   e1Forms: [],
//   cFormPurchases: [],
//   currentUser: "SIVA"
// });
