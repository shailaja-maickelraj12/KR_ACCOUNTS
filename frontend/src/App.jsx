import React, { useState, useEffect } from "react";
import Sidebar from "./components/common/Sidebar";
import PageHeader from "./components/common/PageHeader";
import AccountMaster from "./components/masters/AccountMaster";
import GroupMaster from "./components/masters/GroupMaster";
import SubGroupMaster from "./components/masters/SubGroupMaster";
import TDSMaster from "./components/masters/TDSMaster";
import JournalVoucher from "./components/vouchers/JournalVoucher";
import CashPayment from "./components/vouchers/CashPayment";
import ReportsModule from "./components/reports/ReportsModule";
import GeneralLedger from "./components/reports/GeneralLedger";
import ContraEntry from "./components/vouchers/ContraEntry";
import BankPayment from './components/vouchers/BankPayment';
import BankReceipt from './components/vouchers/BankReceipt';
import DebitNote from "./components/vouchers/DebitNote";
import CreditNote from "./components/vouchers/CreditNote";

import { 
  getDB, 
  subscribeToDB, 
  setCurrentUser, 
  saveVoucher, 
  deleteVoucher, 
  saveAccount, 
  deleteAccount, 
  saveSubGroup, 
  deleteSubGroup,
  saveGroup, 
  deleteGroup,
  saveTds, 
  deleteTds,
  addAuditLog,
  computeTrialBalance,
  computeProfitLoss,
  computeBalanceSheet,
  computeGeneralLedgerRange,
  computeCashBook,
  authenticateUser
} from "./database";
import { 
  TrendingUp, 
  Users, 
  Activity, 
  CreditCard, 
  ShieldAlert, 
  BookOpen, 
  Cpu, 
  Printer, 
  X,
  FileSpreadsheet
} from "lucide-react";

const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) return setError("Please enter a username.");
    if (!password.trim()) return setError("Please enter a password.");
    
    // RESTORED ORIGINAL LOGIC: !isLogin as the third argument (isRegistering)
    const result = await authenticateUser(username, password, !isLogin);
    if (result.success) {
      onLogin(result.user);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] font-sans text-slate-800 p-4 overflow-hidden relative">
      {/* 1. PROFESSIONAL BACKGROUND PATTERN */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.4]" 
        style={{ 
          backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`, 
          backgroundSize: '32px 32px' 
        }}
      ></div>

      {/* 2. MAIN INTERACTIVE CONTAINER */}
      <div className="relative bg-white w-full max-w-5xl h-[650px] rounded-[40px] shadow-[0_40px_120px_-20px_rgba(15,23,42,0.3)] overflow-hidden flex z-10 border border-white">
        
        {/* --- LEFT SLOT: LOGIN FORM (Visible when isLogin is true) --- */}
        <div className={`w-1/2 h-full flex flex-col justify-center px-20 transition-all duration-1000 ease-in-out z-20 ${!isLogin ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'}`}>
          <div className="mb-10">
            <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
              <Cpu className="text-white w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Welcome to<br/>AccuFlow ERP</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3">Enterprise Suite v2.0</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && isLogin && (
              <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-[11px] font-bold">
                {error}
              </div>
            )}
            <div className="group">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest group-focus-within:text-blue-600 transition-colors">Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full p-4 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all bg-slate-50/80 text-sm shadow-sm" 
                placeholder="Enter admin ID" 
                required
              />
            </div>
            <div className="group">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest group-focus-within:text-blue-600 transition-colors">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full p-4 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all bg-slate-50/80 text-sm shadow-sm" 
                placeholder="••••••••" 
                required
              />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-blue-700 transition-all cursor-pointer text-xs uppercase tracking-[0.2em] mt-4 active:scale-95 shadow-slate-200">
              Secure Sign In
            </button>
          </form>
        </div>

        {/* --- RIGHT SLOT: REGISTRATION FORM (Visible when isLogin is false) --- */}
        <div className={`w-1/2 h-full flex flex-col justify-center px-20 transition-all duration-1000 ease-in-out z-20 ${isLogin ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'}`}>
          <div className="mb-10">
            <div className="bg-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-100">
              <Users className="text-white w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Create User<br/>Environment</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3">System Registration</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && !isLogin && (
              <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-[11px] font-bold">
                {error}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">New Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all bg-slate-50/80 text-sm shadow-sm" placeholder="New ID" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Master Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 border border-slate-100 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all bg-slate-50/80 text-sm shadow-sm" placeholder="••••••••" required />
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-slate-900 transition-all cursor-pointer text-xs uppercase tracking-[0.2em] mt-4 active:scale-95 shadow-emerald-100">
              Initialize Account
            </button>
          </form>
        </div>

        {/* --- 3. THE SLIDING OVERLAY (VISUAL PANEL) --- */}
        <div 
          className={`absolute top-0 left-0 w-1/2 h-full bg-slate-900 transition-all duration-[1000ms] ease-[cubic-bezier(0.86,0,0.07,1)] z-40 flex flex-col items-center justify-center text-white overflow-hidden
          ${isLogin ? 'translate-x-full rounded-l-[100px]' : 'translate-x-0 rounded-r-[100px]'}`}
        >
          {/* Moving Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 opacity-90"></div>
          
          {/* Login Mode Content */}
          <div className={`flex flex-col items-center transition-all duration-700 delay-300 ${!isLogin ? 'opacity-0 -translate-y-10 scale-75 pointer-events-none absolute' : 'opacity-100 translate-y-0 scale-100'}`}>
            <div className="relative mb-10">
              <div className="w-32 h-32 bg-blue-500/20 rounded-full absolute -inset-6 animate-pulse"></div>
              <div className="relative bg-blue-600/20 p-8 rounded-full backdrop-blur-xl border border-white/10">
                <ShieldAlert className="w-20 h-20 text-blue-400 animate-bounce" style={{ animationDuration: '3s' }} />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 tracking-tight">Enterprise Security</h3>
            <p className="text-slate-400 text-[11px] text-center px-20 leading-relaxed uppercase tracking-[0.2em] font-medium">
              Verified access protocol for Kayaar Exports ledger maintenance.
            </p>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); setError(""); setUsername(""); setPassword(""); }}
              className="mt-12 px-12 py-3.5 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-slate-900 transition-all z-50 cursor-pointer active:scale-90"
            >
              Sign Up Instead
            </button>
          </div>

          {/* Signup Mode Content */}
          <div className={`flex flex-col items-center transition-all duration-700 delay-300 ${isLogin ? 'opacity-0 translate-y-10 scale-75 pointer-events-none absolute' : 'opacity-100 translate-y-0 scale-100'}`}>
            <div className="relative mb-10">
              <div className="w-32 h-32 bg-emerald-500/20 rounded-full absolute -inset-6 animate-pulse"></div>
              <div className="relative bg-emerald-500/20 p-8 rounded-full backdrop-blur-xl border border-white/10">
                <TrendingUp className="w-20 h-20 text-emerald-400 animate-bounce" style={{ animationDuration: '3s' }} />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 tracking-tight">Scale Operations</h3>
            <p className="text-slate-400 text-[11px] text-center px-20 leading-relaxed uppercase tracking-[0.2em] font-medium">
              Join the real-time financial reporting ecosystem today.
            </p>
            <button 
              type="button"
              onClick={() => { setIsLogin(true); setError(""); setUsername(""); setPassword(""); }}
              className="mt-12 px-12 py-3.5 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-slate-900 transition-all z-50 cursor-pointer active:scale-90"
            >
              Back to Login
            </button>
          </div>

          <div className="absolute bottom-10 flex flex-col items-center gap-2 opacity-30">
            <div className="w-8 h-1 bg-white/20 rounded-full"></div>
            <span className="text-[8px] font-black uppercase tracking-[0.5em]">Kayaar Limited</span>
          </div>
        </div>

      </div>
      
      {/* Decorative Outer blurs */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-blue-400/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-emerald-400/10 blur-[100px] rounded-full pointer-events-none"></div>
    </div>
  );
};
// Helper function to convert numeric amounts to words (e.g. for Vouchers)
const amountInWords = (amount) => {
  if (!amount || amount === 0) return "ZERO ONLY";
  const a = ["", "ONE ", "TWO ", "THREE ", "FOUR ", "FIVE ", "SIX ", "SEVEN ", "EIGHT ", "NINE ", "TEN ", "ELEVEN ", "TWELVE ", "THIRTEEN ", "FOURTEEN ", "FIFTEEN ", "SIXTEEN ", "SEVENTEEN ", "EIGHTEEN ", "NINETEEN "];
  const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  
  const inWords = (num) => {
    let str = "";
    if (num > 99) { str += a[Math.floor(num / 100)] + "HUNDRED "; num %= 100; }
    if (num > 19) { str += b[Math.floor(num / 10)] + " "; num %= 10; }
    if (num > 0) { str += a[num]; }
    return str;
  };
  
  let rupees = Math.floor(amount);
  let paise = Math.round((amount - rupees) * 100);
  let str = "";
  let crores = Math.floor(rupees / 10000000); rupees %= 10000000;
  let lakhs = Math.floor(rupees / 100000); rupees %= 100000;
  let thousands = Math.floor(rupees / 1000); rupees %= 1000;
  
  if (crores > 0) str += inWords(crores) + "CRORE ";
  if (lakhs > 0) str += inWords(lakhs) + "LAKH ";
  if (thousands > 0) str += inWords(thousands) + "THOUSAND ";
  if (rupees > 0) str += inWords(rupees);
  
  let res = str.trim();
  if (res === "") res = "ZERO";
  if (paise > 0) res += " AND PAISE " + inWords(paise).trim();
  return res + " ONLY";
};

const ReportViewerContent = ({ config, database, onClose }) => {
  const { reportType, fromDate, toDate, selectedAccount, selectedMultiAccounts } = config;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [viewVoucher, setViewVoucher] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
    setViewVoucher(null);
  }, [reportType, fromDate, toDate, selectedAccount]);

  const exportJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  };

  const exportCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  };

  const ActionButtons = ({ data, csvFn, filename }) => (
    <div className="flex flex-wrap gap-2 justify-end mb-6 no-print border-b border-slate-200 pb-4">
      <button onClick={() => csvFn()} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-bold shadow flex items-center gap-1 cursor-pointer"><FileSpreadsheet className="w-3.5 h-3.5"/> Excel</button>
      <button onClick={() => exportJSON(data, `${filename}.json`)} className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded text-xs font-bold shadow flex items-center gap-1 cursor-pointer">JSON</button>
      <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold shadow flex items-center gap-1 cursor-pointer"><Printer className="w-3.5 h-3.5"/> Print</button>
      <button onClick={onClose} className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold shadow flex items-center gap-1 cursor-pointer"><X className="w-3.5 h-3.5"/> Exit</button>
    </div>
  );

  const ReportHeader = ({ title, subtitle, config }) => (
    <div className="text-center mb-6 border-b border-slate-300 pb-4">
      <h2 className="font-bold text-lg tracking-widest text-slate-800">KAYAAR EXPORTS PRIVATE LIMITED</h2>
      <h3 className="font-bold text-sm uppercase mt-1">{title}</h3>
      {subtitle && <p className="text-[10px] text-slate-600 mt-1">{subtitle}</p>}
      {config && (
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-[10px] text-slate-500">
          {config.reportCategory && <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">Category: <b>{config.reportCategory}</b></span>}
          {config.selectedAccount && <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">Account: <b>{config.selectedAccount}</b></span>}
          {config.selectedGroup && <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">Group: <b>{config.selectedGroup}</b></span>}
          {config.selectedMultiAccounts?.length > 0 && <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">Accounts: <b>{config.selectedMultiAccounts.join(", ")}</b></span>}
          {config.searchAll && <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">Search: <b>"{config.searchAll}"</b></span>}
          {config.condensed && <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-bold">Condensed Report</span>}
        </div>
      )}
    </div>
  );

  const Pagination = ({ total }) => {
    if (total === 0) return null;
    const totalPages = Math.ceil(total / pageSize);
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-slate-300 no-print text-xs font-bold text-slate-600 gap-4">
        <div>
          Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} records
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>Rows per page:</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="border border-slate-300 rounded p-1 outline-none bg-white">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={999999}>All (Print)</option>
            </select>
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded overflow-hidden">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1.5 disabled:opacity-50 hover:bg-slate-100 border-r border-slate-300 cursor-pointer">Prev</button>
            <span className="px-3 py-1.5 bg-slate-50">Page {currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1.5 disabled:opacity-50 hover:bg-slate-100 border-l border-slate-300 cursor-pointer">Next</button>
          </div>
        </div>
      </div>
    );
  };

  if (reportType === "General Ledger" || reportType === "From To Party General Ledger" || reportType === "From To Party Sub Ledger") {
    if (!selectedAccount) return <div className="text-center text-slate-500 py-10 font-sans">Please select an Account Head to view the General Ledger.</div>;
    const data = computeGeneralLedgerRange(selectedAccount, fromDate, toDate);
    if (!data) return <div className="text-center text-slate-500 py-10 font-sans">No data computed.</div>;

    const handleCSV = () => {
      let csv = "Date,Voucher No,Type,Narration,Debit,Credit,Balance\n";
      csv += `,,,"Opening Balance",${data.openingBalance > 0 ? data.openingBalance : ""},${data.openingBalance < 0 ? Math.abs(data.openingBalance) : ""},${data.openingBalance}\n`;
      data.lines.forEach(l => {
        csv += `"${l.voucherDate}","${l.voucherNo}","${l.type}","${(l.narration || "").replace(/"/g, '""')}",${l.debit},${l.credit},${l.balance}\n`;
      });
      csv += `,,,"Closing Balance",,,${data.endingBalance}\n`;
      exportCSV(csv, `General_Ledger_${selectedAccount}.csv`);
    };

    return (
      <div className="w-full">
        <ActionButtons data={data} csvFn={handleCSV} filename={`General_Ledger_${selectedAccount}`} />
        <ReportHeader title={`LEDGER: ${data.account?.name}`} subtitle={`Period: ${fromDate} to ${toDate}`} config={config} />
        <div className="text-right text-[10px] mb-2 font-bold text-slate-600">Opening Balance: Rs. {data.openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        <table className="w-full text-left font-mono text-[11px] border-collapse">
          <thead>
            <tr className="border-t border-b border-dashed border-slate-400 py-1">
              <th className="py-2">Date</th>
              <th className="py-2">Voucher No</th>
              <th className="py-2">Voucher Type</th>
              <th className="py-2">Narration</th>
              <th className="py-2 text-right">Debit</th>
              <th className="py-2 text-right">Credit</th>
              <th className="py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-slate-300">
            {data.lines.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((l, i) => (
              <tr key={i}>
                <td className="py-1.5">{l.voucherDate}</td>
                <td className="py-1.5">{l.voucherNo}</td>
                <td className="py-1.5">{l.type}</td>
                <td className="py-1.5">{l.narration}</td>
                <td className="py-1.5 text-right">{l.debit > 0 ? l.debit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}</td>
                <td className="py-1.5 text-right">{l.credit > 0 ? l.credit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}</td>
                <td className="py-1.5 text-right">{l.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right text-[11px] mt-4 font-bold border-t border-dashed border-slate-400 pt-2 text-slate-800">
          Closing Balance: Rs. {data.endingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </div>
        <Pagination total={data.lines.length} />
      </div>
    );
  }

  if (reportType === "Trial Balance" || reportType === "Day Book") {
    const data = computeTrialBalance(toDate);
    if (!data) return <div className="text-center text-slate-500 py-10 font-sans">No data computed.</div>;

    const handleCSV = () => {
      let csv = "Account Code,Account Name,Sub Group,Debit,Credit\n";
      data.accounts.forEach(a => {
        csv += `"${a.code}","${a.name}","${a.subGroupName}",${a.debit},${a.credit}\n`;
      });
      csv += `,,Total,${data.totalDebit},${data.totalCredit}\n`;
      exportCSV(csv, `Trial_Balance_${toDate}.csv`);
    };

    return (
      <div className="w-full">
        <ActionButtons data={data} csvFn={handleCSV} filename={`Trial_Balance_${toDate}`} />
        <ReportHeader title={reportType} subtitle={`Period: ${fromDate} to ${toDate}`} config={config} />
        <table className="w-full text-left font-mono text-[11px] border-collapse">
          <thead>
            <tr className="border-t border-b border-dashed border-slate-400 py-1">
              <th className="py-2">Acc Code</th>
              <th className="py-2">Account Name</th>
              <th className="py-2">Sub Group</th>
              <th className="py-2 text-right">Debit</th>
              <th className="py-2 text-right">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-slate-300">
            {data.accounts.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((a, i) => (
              <tr key={i}>
                <td className="py-1.5">{a.code}</td>
                <td className="py-1.5 font-bold">{a.name}</td>
                <td className="py-1.5 text-slate-500">{a.subGroupName}</td>
                <td className="py-1.5 text-right">{a.debit > 0 ? a.debit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}</td>
                <td className="py-1.5 text-right">{a.credit > 0 ? a.credit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end gap-12 mt-4 font-bold border-t border-b border-dashed border-slate-400 py-2 text-[11px]">
          <div>Total Debit: Rs. {data.totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          <div>Total Credit: Rs. {data.totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <Pagination total={data.accounts.length} />
      </div>
    );
  }

  if (reportType === "Cash Book" || reportType === "Bank Book" || reportType === "Journal Book") {
    const acc = selectedMultiAccounts && selectedMultiAccounts.length > 0 ? selectedMultiAccounts[0] : selectedAccount;
    if (!acc) return <div className="text-center text-slate-500 py-10 font-sans">Please select an Account Head.</div>;
    const data = computeGeneralLedgerRange(acc, fromDate, toDate);
    if (!data) return <div className="text-center text-slate-500 py-10 font-sans">No data computed.</div>;

    const handleCSV = () => {
      let csv = "Date,Voucher No,Narration,Credit,Debit,Balance\n";
      csv += `,,Opening Balance,,,${data.openingBalance}\n`;
      data.lines.forEach(l => {
        csv += `"${l.voucherDate}","${l.voucherNo}","${(l.narration || "").replace(/"/g, '""')}",${l.credit},${l.debit},${l.balance}\n`;
      });
      csv += `,,Closing Balance,,,${data.endingBalance}\n`;
      exportCSV(csv, `Book_${acc}.csv`);
    };

    return (
      <div className="w-full">
        <ActionButtons data={data} csvFn={handleCSV} filename={`Book_${acc}`} />
        <ReportHeader title={`${reportType}: ${data.account?.name}`} subtitle={`Period: ${fromDate} to ${toDate}`} config={config} />
        <div className="text-right text-[10px] mb-2 font-bold text-slate-600">Opening Balance: Rs. {data.openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        <table className="w-full text-left font-mono text-[11px] border-collapse">
          <thead>
            <tr className="border-t border-b border-dashed border-slate-400 py-1">
              <th className="py-2">Date</th>
              <th className="py-2">Voucher No</th>
              <th className="py-2">Narration</th>
              <th className="py-2 text-right">Credit</th>
              <th className="py-2 text-right">Debit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-slate-300">
            {data.lines.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((l, i) => (
              <tr key={i}>
                <td className="py-1.5">{l.voucherDate}</td>
                <td className="py-1.5">{l.voucherNo}</td>
                <td className="py-1.5">{l.narration}</td>
                <td className="py-1.5 text-right text-orange-600">{l.credit > 0 ? l.credit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}</td>
                <td className="py-1.5 text-right text-emerald-600">{l.debit > 0 ? l.debit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between text-[11px] mt-4 font-bold border-t border-dashed border-slate-400 pt-2 text-slate-800">
           <div>Grand Total: Rs. {(data.lines.reduce((s, l) => s + l.debit, 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
           <div>Closing Balance: Rs. {data.endingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <Pagination total={data.lines.length} />
      </div>
    );
  }

  if (reportType === "Profit & Loss" || reportType === "Profit & Loss Account" || reportType === "Trading Account") {
    const data = computeProfitLoss(fromDate, toDate);
    if (!data) return <div className="text-center text-slate-500 py-10 font-sans">No data computed.</div>;

    const handleCSV = () => {
      let csv = "Particulars,Amount\n";
      csv += `"Sales Revenue",${data.salesRevenue}\n`;
      csv += `"Closing Stock",${data.closingStock}\n`;
      csv += `"Opening Stock",-${data.openingStock}\n`;
      csv += `"Direct Expenses",-${data.directExpenses}\n`;
      csv += `"Gross Profit",${data.grossProfit}\n`;
      csv += `"Other Income",${data.otherIncome}\n`;
      csv += `"Administrative Expenses",-${data.administrativeExpenses}\n`;
      csv += `"Net Profit",${data.netProfit}\n`;
      exportCSV(csv, `Profit_Loss_${toDate}.csv`);
    };

    return (
      <div className="w-full">
        <ActionButtons data={data} csvFn={handleCSV} filename={`Profit_Loss_${toDate}`} />
        <ReportHeader title={reportType} subtitle={`Period: ${fromDate} to ${toDate}`} config={config} />
        <table className="w-full text-left font-mono text-[11px] border-collapse">
          <tbody className="divide-y divide-dotted divide-slate-300">
            <tr><td className="py-1.5">Sales Revenue</td><td className="py-1.5 text-right font-bold">{data.salesRevenue.toLocaleString("en-IN", {minimumFractionDigits: 2})}</td></tr>
            <tr><td className="py-1.5">Add: Closing Stock</td><td className="py-1.5 text-right">{data.closingStock.toLocaleString("en-IN", {minimumFractionDigits: 2})}</td></tr>
            <tr><td className="py-1.5 text-slate-500">Less: Opening Stock</td><td className="py-1.5 text-right text-slate-500">({data.openingStock.toLocaleString("en-IN", {minimumFractionDigits: 2})})</td></tr>
            <tr><td className="py-1.5 text-slate-500">Less: Direct Expenses</td><td className="py-1.5 text-right text-slate-500">({data.directExpenses.toLocaleString("en-IN", {minimumFractionDigits: 2})})</td></tr>
            <tr className="bg-slate-50 font-bold border-t border-slate-400"><td className="py-2">GROSS PROFIT</td><td className="py-2 text-right text-green-700">{data.grossProfit.toLocaleString("en-IN", {minimumFractionDigits: 2})}</td></tr>
            <tr><td className="py-1.5">Add: Other Income</td><td className="py-1.5 text-right">{data.otherIncome.toLocaleString("en-IN", {minimumFractionDigits: 2})}</td></tr>
            <tr><td className="py-1.5 text-slate-500">Less: Administrative Expenses</td><td className="py-1.5 text-right text-slate-500">({data.administrativeExpenses.toLocaleString("en-IN", {minimumFractionDigits: 2})})</td></tr>
            <tr className="bg-slate-100 font-bold border-t border-b border-slate-400"><td className="py-2">NET PROFIT</td><td className="py-2 text-right text-[#2563EB]">{data.netProfit.toLocaleString("en-IN", {minimumFractionDigits: 2})}</td></tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (reportType === "Balance Sheet") {
    const data = computeBalanceSheet(toDate);
    if (!data) return <div className="text-center text-slate-500 py-10 font-sans">No data computed.</div>;

    const handleCSV = () => {
      let csv = "Liabilities,Amount,Assets,Amount\n";
      const maxRows = Math.max(data.liabilities.length + 2, data.assets.length + 4);
      for(let i=0; i<maxRows; i++) {
         let liaName = "", liaAmt = "", astName = "", astAmt = "";
         if (i===0) { liaName = "Share Capital"; liaAmt = data.shareCapital; astName = "Fixed Assets"; astAmt = data.fixedAssets; }
         else if (i===1) { liaName = "Reserves & Surplus"; liaAmt = data.reservesAndSurplus; astName = "Closing Stock"; astAmt = data.closingStock; }
         else if (i===2) { astName = "Bank Balances"; astAmt = data.bankBalances; }
         else if (i===3) { astName = "Cash on Hand"; astAmt = data.cashOnHand; }
         else {
           const lIdx = i - 2;
           if (lIdx < data.liabilities.length) { liaName = data.liabilities[lIdx].name; liaAmt = data.liabilities[lIdx].value; }
           const aIdx = i - 4;
           const currentAssetsList = data.assets.filter(a => a.group !== "Cash on Hand" && a.group !== "Bank Balances" && a.group !== "Fixed Assets");
           if (aIdx >= 0 && aIdx < currentAssetsList.length) { astName = currentAssetsList[aIdx].name; astAmt = currentAssetsList[aIdx].value; }
         }
         csv += `"${liaName}","${liaAmt}","${astName}","${astAmt}"\n`;
      }
      csv += `"Total Liabilities",${data.totalLiabilities},"Total Assets",${data.totalAssets}\n`;
      exportCSV(csv, `Balance_Sheet_${toDate}.csv`);
    };

    return (
      <div className="w-full">
        <ActionButtons data={data} csvFn={handleCSV} filename={`Balance_Sheet_${toDate}`} />
        <ReportHeader title="BALANCE SHEET" subtitle={`Period: ${fromDate} to ${toDate}`} config={config} />
        <div className="grid grid-cols-2 gap-6 font-mono text-[11px]">
          <div className="border-r border-dashed border-slate-300 pr-4">
            <h4 className="font-bold border-b border-slate-400 pb-1 mb-2 text-slate-800">LIABILITIES</h4>
            <div className="flex justify-between mb-1 font-bold"><span>Share Capital</span><span>{data.shareCapital.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between mb-1 font-bold"><span>Reserves & Surplus</span><span>{data.reservesAndSurplus.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
            <div className="mt-2 text-slate-400 border-t border-dotted pt-1 mb-1">Current Liabilities</div>
            {data.liabilities.map((l, i) => (
              <div key={i} className="flex justify-between text-slate-600"><span className="truncate pr-2">{l.name}</span><span>{l.value.toLocaleString("en-IN")}</span></div>
            ))}
          </div>
          <div className="pl-2">
            <h4 className="font-bold border-b border-slate-400 pb-1 mb-2 text-slate-800">ASSETS</h4>
            <div className="flex justify-between mb-1 font-bold"><span>Fixed Assets</span><span>{data.fixedAssets.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between mb-1 font-bold"><span>Closing Stock</span><span>{data.closingStock.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between mb-1 font-bold"><span>Bank Balances</span><span className="text-[#2563EB]">{data.bankBalances.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between mb-1 font-bold"><span>Cash on Hand</span><span className="text-[#2563EB]">{data.cashOnHand.toLocaleString("en-IN")}</span></div>
            <div className="mt-2 text-slate-400 border-t border-dotted pt-1 mb-1">Current Assets</div>
            {data.assets.filter(a => a.group !== "Cash on Hand" && a.group !== "Bank Balances" && a.group !== "Fixed Assets").map((a, i) => (
              <div key={i} className="flex justify-between text-slate-600"><span className="truncate pr-2">{a.name}</span><span>{a.value.toLocaleString("en-IN")}</span></div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 font-mono text-[12px] font-bold border-t-2 border-dashed border-slate-500 mt-6 pt-2">
           <div className="flex justify-between pr-4 border-r border-dashed border-slate-300"><span>TOTAL:</span><span className="text-[#2563EB]">Rs. {data.totalLiabilities.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
           <div className="flex justify-between pl-2"><span>TOTAL:</span><span className="text-[#2563EB]">Rs. {data.totalAssets.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
        </div>
      </div>
    );
  }

  let genericHeaders = [];
  let genericRows = [];
  let displayData = false;
  
  const isRightAligned = (h) => ['Amount', 'Debit', 'Credit', 'Balance', 'Total', 'Tax', 'Rate', 'Qty', 'Liability'].some(keyword => String(h).includes(keyword));

  if (["Cash", "Bank", "Journal Voucher", "Contra Entry", "Debit Note", "Credit Note"].includes(reportType)) {
    const typeMap = { "Cash": ["CP", "CR"], "Bank": ["BP", "BR"], "Journal Voucher": ["JV"], "Contra Entry": ["CONTRA"], "Debit Note": ["DN"], "Credit Note": ["CN"] };
    const targetTypes = typeMap[reportType] || [];
    const data = (database?.vouchers || []).filter(v => targetTypes.includes(v.type) && v.voucherDate >= fromDate && v.voucherDate <= toDate);
    
    if (viewVoucher) {
      const v = viewVoucher;
      const firstItem = v.items?.[0] || {};
      const amtWords = amountInWords(v.totalAmount || 0);

      return (
        <div className="w-full">
          <div className="mb-4 no-print flex justify-between border-b border-slate-200 pb-4">
            <button onClick={() => setViewVoucher(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer">
              &larr; Back to List
            </button>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-bold shadow flex items-center gap-1 cursor-pointer"><Printer className="w-3.5 h-3.5"/> Print Voucher</button>
            </div>
          </div>
          <div className="border-2 border-slate-800 p-6 rounded relative bg-white print:border-none print:shadow-none print:p-0">
            <ReportHeader title={`${reportType} VOUCHER`} subtitle="" />
            <div className="flex justify-between mb-6 text-xs">
              <div>
                <p><span className="font-bold">Voucher No:</span> {v.voucherNo}</p>
                <p><span className="font-bold">Account Code:</span> {firstItem.accountCode || "-"}</p>
                <p><span className="font-bold">Party Name:</span> {firstItem.accountName || v.partyName || "-"}</p>
              </div>
              <div className="text-right">
                <p><span className="font-bold">Voucher Date:</span> {v.voucherDate}</p>
                <p><span className="font-bold">Voucher Type:</span> {v.type}</p>
              </div>
            </div>
            <table className="w-full text-left text-xs mb-6 border-collapse">
              <thead>
                <tr className="border-t border-b border-slate-800">
                  <th className="py-2">Narration / Description</th>
                  <th className="py-2 text-right">Amount (Rs)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-4 whitespace-pre-wrap">{v.narration || firstItem.narration || "-"}</td>
                  <td className="py-4 text-right align-top font-bold">{(v.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-b border-slate-800">
                  <td className="py-2 font-bold text-right">Grand Total:</td>
                  <td className="py-2 font-bold text-right">{(v.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
            <div className="text-xs mb-16">
              <p className="font-bold">Amount In Words:</p>
              <p className="uppercase text-slate-700">{amtWords}</p>
            </div>
            <div className="flex justify-between text-xs font-bold pt-8 border-t border-slate-300 text-slate-500">
              <span>Prepared By</span>
              <span>Entered By</span>
              <span>Checked By</span>
              <span>Authorised Signatory</span>
            </div>
          </div>
        </div>
      );
    }

    const handleCSV = () => {
      let csv = "Voucher No,Date,Type,Party,Account Code,Amount,Narration\n";
      data.forEach(v => {
        const firstItem = v.items?.[0] || {};
        const accountCode = firstItem.accountCode || "-";
        const partyName = firstItem.accountName || v.partyName || "-";
        csv += `"${v.voucherNo}","${v.voucherDate}","${v.type}","${partyName}","${accountCode}",${(v.totalAmount || 0)},"${(v.narration || firstItem.narration || "-").replace(/"/g, '""')}"\n`;
      });
      exportCSV(csv, `Voucher_Report_${toDate}.csv`);
    };

    return (
      <div className="w-full">
        <ActionButtons data={data} csvFn={handleCSV} filename={`Voucher_Report_${toDate}`} />
        <ReportHeader title={`${reportType} REGISTER`} subtitle={`Period: ${fromDate} to ${toDate}`} config={config} />
        <table className="w-full text-left font-mono text-[11px] border-collapse">
          <thead>
            <tr className="border-t border-b border-dashed border-slate-400 py-1">
              <th className="py-2">Voucher No</th>
              <th className="py-2">Date</th>
              <th className="py-2">Type</th>
              <th className="py-2">Party Name</th>
              <th className="py-2">Account Code</th>
              <th className="py-2 text-right">Amount</th>
              <th className="py-2 pl-2">Narration</th>
              <th className="py-2 text-center no-print">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-slate-300">
            {data.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(v => {
              const firstItem = v.items?.[0] || {};
              const accountCode = firstItem.accountCode || "-";
              const partyName = firstItem.accountName || v.partyName || "-";
              return (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="py-1.5 font-bold text-blue-600">{v.voucherNo}</td>
                  <td className="py-1.5">{v.voucherDate}</td>
                  <td className="py-1.5 font-bold">{v.type}</td>
                  <td className="py-1.5 truncate max-w-[120px]">{partyName}</td>
                  <td className="py-1.5 text-slate-500">{accountCode}</td>
                  <td className="py-1.5 text-right font-bold text-slate-700">{(v.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="py-1.5 pl-2 truncate max-w-[150px] text-slate-600">{v.narration || firstItem.narration || "-"}</td>
                  <td className="py-1.5 text-center no-print">
                    <button onClick={() => setViewVoucher(v)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded text-[10px] font-bold border border-slate-300 shadow-sm cursor-pointer">View</button>
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-10 font-bold text-slate-500">No vouchers found for the selected criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination total={data.length} />
      </div>
    );
  }
  else if (["C Form", "F Form", "H Form", "E1 Form", "C Form Purchase"].includes(reportType)) {
    let data = [];
    if (reportType === "C Form") data = database?.cForms || [];
    else if (reportType === "F Form") data = database?.fForms || [];
    else if (reportType === "H Form") data = database?.hForms || [];
    else if (reportType === "E1 Form") data = database?.e1Forms || [];
    else if (reportType === "C Form Purchase") data = database?.cFormPurchases || [];

    data = data.filter(d => {
      const dt = d.date || (d.updatedAt ? d.updatedAt.split("T")[0] : "");
      return dt >= fromDate && dt <= toDate;
    });

    genericHeaders = ["Form No", "Party Name", "Date", "Amount"];
    genericRows = data.map(d => [d.id || "-", d.partyName || "-", d.date || (d.updatedAt ? d.updatedAt.split("T")[0] : "-"), (parseFloat(d.amount || d.totalAmount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })]);
    displayData = true;
  }
  else if (["TDS Register", "TDS Summary", "TDS Payable", "TCS Summary"].includes(reportType)) {
    const data = (database?.vouchers || []).filter(v => v.tdsEnabled && v.voucherDate >= fromDate && v.voucherDate <= toDate);
    genericHeaders = ["Date", "Voucher No", "Party", "Narration", "TDS Amount", "Total Amount"];
    genericRows = data.map(v => [v.voucherDate, v.voucherNo, v.items?.[0]?.accountName || "-", v.narration || "-", (parseFloat(v.tdsAmount||0)).toLocaleString("en-IN", { minimumFractionDigits: 2 }), (parseFloat(v.totalAmount||0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })]);
    displayData = true;
  }
  else if (reportType === "Reverse Bill Entries") {
    const data = (database?.reverseBills || []).filter(v => v.accDate >= fromDate && v.accDate <= toDate);
    genericHeaders = ["Date", "Bill No", "Party", "Purchase Type", "Taxable Amount", "GST Amount", "Grand Total"];
    genericRows = data.map(v => [v.accDate, v.billNo, v.partyName, v.purchaseType, (parseFloat(v.taxableAmount||v.billAmount||0)).toLocaleString("en-IN", { minimumFractionDigits: 2 }), (parseFloat(v.gst||v.taxAmount||0)).toLocaleString("en-IN", { minimumFractionDigits: 2 }), (parseFloat(v.grandTotal||0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })]);
    displayData = true;
  }
  else if (reportType === "Audit Reports") {
    const data = (database?.auditLogs || []).filter(d => {
      const dt = d.timestamp.split("T")[0];
      return dt >= fromDate && dt <= toDate;
    });
    genericHeaders = ["Timestamp", "User", "Action", "Details"];
    genericRows = data.map(d => [new Date(d.timestamp).toLocaleString(), d.userName, d.action, d.details]);
    displayData = true;
  }
  else if (reportType === "Sub Ledger All" || reportType === "Sub Ledger") {
    const data = computeTrialBalance(toDate);
    const filtered = data.accounts.filter(a => selectedAccount ? a.code === selectedAccount : true);
    genericHeaders = ["Sub Group", "Account Code", "Account Name", "Balance"];
    genericRows = filtered.map(a => [a.subGroupName, a.code, a.name, a.balance > 0 ? `${a.balance.toLocaleString("en-IN")} Dr` : `${Math.abs(a.balance).toLocaleString("en-IN")} Cr`]);
    displayData = true;
  }
  else if (reportType === "Account Summary") {
    const data = computeTrialBalance(toDate);
    genericHeaders = ["Account Code", "Account Name", "Group", "Balance"];
    genericRows = data.accounts.map(a => [a.code, a.name, a.groupName, a.balance > 0 ? `${a.balance.toLocaleString("en-IN")} Dr` : `${Math.abs(a.balance).toLocaleString("en-IN")} Cr`]);
    displayData = true;
  }
  else if (reportType === "Outstanding Bills") {
    const data = (database?.billWiseOpenings || []).filter(b => b.billDate >= fromDate && b.billDate <= toDate);
    genericHeaders = ["Bill No", "Date", "Party Name", "Sub Group", "Amount Due"];
    genericRows = data.map(b => [b.billNo, b.billDate, b.partyName, b.subGroup, (parseFloat(b.debit || 0) - parseFloat(b.credit || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })]);
    displayData = true;
  }
  else if (reportType === "Missing Entries" || reportType === "Tally Missing Entry") {
    genericHeaders = ["Voucher No", "Date", "Status"];
    genericRows = [];
    displayData = true;
  }

  if (displayData) {
    const handleCSV = () => {
      let csv = genericHeaders.map(h => `"${h}"`).join(",") + "\n";
      genericRows.forEach(r => {
        csv += r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
      });
      exportCSV(csv, `${reportType.replace(/\s+/g, '_')}_${toDate}.csv`);
    };

    return (
      <div className="w-full">
        <ActionButtons data={genericRows} csvFn={handleCSV} filename={`${reportType.replace(/\s+/g, '_')}_${toDate}`} />
        <ReportHeader title={reportType} subtitle={`Period: ${fromDate} to ${toDate}`} config={config} />
        <table className="w-full text-left font-mono text-[11px] border-collapse">
          <thead>
            <tr className="border-t border-b border-dashed border-slate-400 py-1">
              {genericHeaders.map((h, i) => (
                <th key={i} className={`py-2 px-3 ${isRightAligned(h) ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-slate-300">
            {genericRows.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j} className={`py-1.5 px-3 ${isRightAligned(genericHeaders[j]) ? 'text-right' : ''} ${typeof cell === 'string' && cell.startsWith('-') ? 'text-red-600' : ''}`}>{cell}</td>
                ))}
              </tr>
            ))}
            {genericRows.length === 0 && (
              <tr>
                <td colSpan={genericHeaders.length} className="text-center py-4 text-slate-500">No records found for the selected criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination total={genericRows.length} />
      </div>
    );
  }

  return (
    <div className="text-center p-10 font-mono text-slate-500">
      <p className="font-bold text-lg mb-2">{reportType} generated</p>
      <p>This report output is currently structured via direct JSON endpoints.</p>
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={() => exportJSON({ status: "ok", type: reportType, filters: config }, `${reportType.replace(/\s+/g, '_')}.json`)} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded font-sans text-xs font-bold cursor-pointer shadow">Download Raw JSON</button>
      </div>
    </div>
  );
};

export default function App() {
  const [db, setDb] = useState(getDB());
  const [activeTab, setActiveTab] = useState("journal-voucher");
  
  // Retro print modal states
  const [printedVoucher, setPrintedVoucher] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const MissingComponent = ({ title, id }) => (
    <div className="flex-1 overflow-hidden flex flex-col" id={`${id}-tab`}>
      <PageHeader category="Masters" title={title} description="This master component is not available." />
      <div className="p-6">
        <div className="bg-white border rounded-lg p-8 text-center text-slate-500">
          <p>The component for this master screen (e.g., <strong>{title}.jsx</strong>) was not found.</p>
          <p className="text-xs mt-2">To implement this screen, please ensure the corresponding component file exists in the project.</p>
        </div>
      </div>
    </div>
  );


  // Subscribe to DB changes to stay beautifully reactively in-sync with local storage
  useEffect(() => {
    const unsubscribe = subscribeToDB((newDb) => {
      setDb(newDb);
    });
    return unsubscribe;
  }, []);

  const handleSetCurrentUser = (user) => {
    setCurrentUser(user);
  };

  // Vouchers Persistence bridge
  const handleSaveVoucher = (v) => {
    return saveVoucher(v);
  };

  // --- PRINT WRAP DETECTOR (Replicating "frmPrint" desktop print viewer) ---
  const triggerPrintModal = (vOrReport) => {
    setPrintedVoucher(vOrReport);
    setIsPrintModalOpen(true);
  };

  // Protect all application routes behind the auth screen
  if (!db.currentUser) {
    return <AuthScreen onLogin={handleSetCurrentUser} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans antialiased text-[#1E293B]" id="main-app-viewport">
      
      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={db.currentUser} 
        setCurrentUser={handleSetCurrentUser} 
      />

      {/* Main Content Workspace viewport */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0" id="main-content-flow">
        
        {/* Dynamic Nav Indicator */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] shadow-sm flex items-center justify-between px-8 select-none shrink-0" id="top-nav-bar">
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <span>Kayaar ERP</span> &rsaquo; 
            <span className="text-[#2563EB] font-bold uppercase">{activeTab.replace("-", " ")}</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-semibold text-[#1E293B]">
            <span className="bg-blue-50 text-[#2563EB] px-2.5 py-1 rounded inline-flex items-center gap-1.5 font-mono text-[10px] font-bold">
              <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full inline-block animate-ping"></span>
              API PORT: 5000 DEV ACTIVE
            </span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-slate-200 text-[#2563EB] font-bold flex items-center justify-center rounded-full border border-[#E2E8F0]">
                {db.currentUser.charAt(0).toUpperCase()}
              </div>
              <span className="text-slate-700">Acting User: {db.currentUser}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Route views router */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0" id="workspace-viewport">
          
          {/* TAB 2: ACCOUNTS MASTER */}
          {activeTab === "accounts-master" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0" id="accounts-master-tab">
              <PageHeader category="Masters" title="Accounts head Master Explorer" description="Create and configure ledger accounts, places, Opening Credit/Debit, and contact parameters." />
              <AccountMaster 
                type="accounts" 
                database={db}
                onSaveAccount={saveAccount}
                onDeleteAccount={deleteAccount}
              />
            </div>
          )}

          {/* TAB: GROUP MASTER */}
          {activeTab === "group-master" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0" id="group-master-tab">
              <PageHeader category="Masters" title="Group Master" description="Define high-level account groupings like Assets, Liabilities, etc." />
              <GroupMaster
                database={db}
                onSaveGroup={saveGroup}
                onDeleteGroup={deleteGroup}
              />
            </div>
          )}

          {/* TAB: SUBGROUP MASTER */}
          {activeTab === "subgroup-master" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0" id="subgroup-master-tab">
              <PageHeader category="Masters" title="Sub Group Master" description="Define sub-group hierarchies, Trial Balance mapping index, and Profit & Loss placement." />
              <SubGroupMaster
                database={db}
                onSave={saveSubGroup}
                onDelete={deleteSubGroup}
              />
            </div>
          )}

          {/* TAB: TDS MASTER */}
          {activeTab === "tds-master" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0" id="tds-master-tab">
              <PageHeader category="Masters" title="TDS Type Master" description="Configure legal slab percentages for Tax Deducted at Source." />
              <TDSMaster
                database={db}
                onSave={saveTds}
                onDelete={deleteTds}
              />
            </div>
          )}

          {/* TAB 5: JOURNAL VOUCHER ENTRY FORM */}
          {activeTab === "journal-voucher" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0" id="jv-entry-tab">
              <PageHeader category="Vouchers" title="Journal Voucher Entry Sheet" description="Input structural bookkeeping adjustments, transfers, and double-entry postings." />
              <JournalVoucher 
                database={db} 
                onSaveVoucher={handleSaveVoucher} 
                onDeleteVoucher={deleteVoucher}
                onPrint={triggerPrintModal}
              />
            </div>
          )}

          {/* TAB 6: CASH PAYMENT */}
          {activeTab === "cash-payment" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0" id="cp-entry-tab">
              <PageHeader category="Vouchers" title="Cash Payments Registry" description="Log cash expenditures against corresponding debit heads (generates printed vouchers)." />
              <CashPayment 
                database={db}
                mode="CP"
                onSaveVoucher={handleSaveVoucher}
                onDeleteVoucher={deleteVoucher}
                onPrint={triggerPrintModal}
              />
            </div>
          )}

          {/* TAB 6B: BANK PAYMENT */}
          {activeTab === "bank-payment" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0" id="bp-entry-tab">
              <PageHeader category="Vouchers" title="Bank Payments Registry" description="Manage and print specialized bank payment vouchers." />
              <BankPayment 
                database={db}
                onSaveVoucher={handleSaveVoucher}
                onDeleteVoucher={deleteVoucher}
              />
            </div>
          )}

          {/* TAB 7: CASH RECEIPTS */}
          {activeTab === "cash-receipt" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0" id="cr-entry-tab">
              <PageHeader category="Vouchers" title="Cash Receipts Collection" description="Post incoming cash liquidity balances paid into your drawers." />
              <CashPayment 
                database={db}
                mode="CR"
                onSaveVoucher={handleSaveVoucher}
                onDeleteVoucher={deleteVoucher}
                onPrint={triggerPrintModal}
              />
            </div>
          )}

          {/* TAB 7B: BANK RECEIPTS */}
          {activeTab === "bank-receipt" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0" id="br-entry-tab">
              <PageHeader category="Vouchers" title="Bank Receipts Collection" description="Post incoming liquidity balances paid into your bank accounts." />
              <BankReceipt 
                database={db}
                mode="BR"
                onSaveVoucher={handleSaveVoucher}
                onDeleteVoucher={deleteVoucher}
                onPrint={triggerPrintModal}
              />
            </div>
          )}

          {/* TAB 8: CONTRA ENTRY VOUCHER */}
          {activeTab === "contra-entry" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0" id="contra-entry-tab">
              <PageHeader category="Vouchers" title="Contra Bank / Cash Transfers" description="Record liquid inter-account movements between vault drawers and active bank limit accounts." />
              <ContraEntry
                database={db}
                onSaveVoucher={handleSaveVoucher}
                onDeleteVoucher={deleteVoucher}
              />
            </div>
          )}

          {/* TAB: DEBIT NOTE */}
          {activeTab === "debit-note" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0" id="dn-entry-tab">
              <PageHeader category="Vouchers" title="Debit Note Register" description="Record Debit Notes for purchase returns and rate differences." />
              <DebitNote database={db} onSaveVoucher={handleSaveVoucher} onDeleteVoucher={deleteVoucher} onPrint={triggerPrintModal} />
            </div>
          )}

          {/* TAB: CREDIT NOTE */}
          {activeTab === "credit-note" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0" id="cn-entry-tab">
              <PageHeader category="Vouchers" title="Credit Note Register" description="Record Credit Notes for sales returns and discount adjustments." />
              <CreditNote database={db} onSaveVoucher={handleSaveVoucher} onDeleteVoucher={deleteVoucher} onPrint={triggerPrintModal} />
            </div>
          )}

          {/* --- REPORT VIEWERS --- */}
          {activeTab === "reports-module" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <PageHeader category="Reports" title="Dynamic Reports Hub" description="Generate, preview, print, and export financial and accounting reports." />
              <ReportsModule database={db} onPrint={triggerPrintModal} />
            </div>
          )}

          {activeTab === "general-ledger" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <PageHeader category="Reports" title="Corporate General Ledger Statement" description="Audit detailed debit/credit postings, initial balances, and running calculations over custom periods." />
              <GeneralLedger database={db} activeReport="ledger" onPrint={triggerPrintModal} />
            </div>
          )}

          {activeTab === "trial-balance" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <PageHeader category="Reports" title="Live Trial Balance Sheet" description="Cumulative closing debit and credit balance sheet calculations for absolute mathematical validation." />
              <GeneralLedger database={db} activeReport="trial" onPrint={triggerPrintModal} />
            </div>
          )}

          {activeTab === "profit-loss" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <PageHeader category="Reports" title="Profit & Loss Margin Statement" description="Trading reports, gross profit lines, administrative overheads expenses, and net corporate profit." />
              <GeneralLedger database={db} activeReport="pl" onPrint={triggerPrintModal} />
            </div>
          )}

          {activeTab === "balance-sheet" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <PageHeader category="Reports" title="Combined Corporate Balance Sheet" description="Consolidated capital, reserves, liabilities breakdown, and corporate property asset balances." />
              <GeneralLedger database={db} activeReport="bs" onPrint={triggerPrintModal} />
            </div>
          )}

          {/* Audit Logs tab */}
          {activeTab === "audit-logs" && (
            <div className="flex-1 overflow-y-auto p-6" id="audit-logs-tab">
              <PageHeader category="System" title="Audit Trail Security Logs" description="Full historical logs of actions committed by various system users." />
              <div className="bg-white border rounded-lg overflow-hidden shadow-sm max-w-4xl mx-auto mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[#64748B] font-bold uppercase tracking-wider">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Detail</th>
                      <th className="p-4 text-right">Acting User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] font-mono text-[11px] leading-relaxed">
                    {db.auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-4 text-slate-400">{log.timestamp}</td>
                        <td className="p-4 text-blue-600 font-bold">{log.action}</td>
                        <td className="p-4 text-slate-600">{log.details}</td>
                        <td className="p-4 text-right font-bold text-slate-800">{log.userName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* --- HIGH-FIDELITY RETRO frmPrint DOT MATRIX PRINT VIEW MODAL --- */}
      {isPrintModalOpen && printedVoucher && (
        <div className="fixed inset-0 bg-[#0F172A]/75 flex items-center justify-center z-50 p-4 overflow-y-auto select-none" id="frmPrint-modal">
          <div className="bg-[#FAF8F5] border border-stone-300 rounded shadow-2xl p-8 max-w-3xl w-full text-[#1E293B] relative" style={{ fontFamily: "Courier New, Courier, monospace" }}>
            
            {/* Modal Closer */}
            <div className="absolute top-4 right-4 flex items-center gap-2 font-sans text-xs">
              {printedVoucher.type !== "REPORT" && (
                <button 
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded flex items-center gap-1 font-bold font-sans cursor-pointer shadow"
                >
                  <Printer className="w-4 h-4" /> Trigger System Print
                </button>
              )}
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 bg-stone-200/50 p-1.5 rounded-full cursor-pointer flex items-center justify-center w-8 h-8"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vintage dot matrix paper header */}
            <div className="text-center font-bold text-xs uppercase scroll-py-1">
              <div>========================================================================</div>
              <div className="text-sm font-bold tracking-widest text-[#2563EB]">KAYAAR EXPORTS PRIVATE LIMITED</div>
              <div>COIMBATORE ROAD, K.R.NAGAR, KOVILPATTI - 628503</div>
              <div>========================================================================</div>
              
              {printedVoucher.type === "REPORT" ? (
                <div className="mt-2 font-extrabold text-[13px] bg-stone-200/50 py-1 font-sans">
                  *** {printedVoucher.reportType.toUpperCase()} FINANCIAL BOARD REPORT ***
                </div>
              ) : (
                <div className="mt-2 font-extrabold text-[13px] bg-stone-200/50 py-1 font-sans">
                  *** {printedVoucher.type === "JV" ? "BILL JOURNAL VOUCHER" : `${printedVoucher.type} CASHBOOK VOUCHER`} ***
                </div>
              )}
              
              {printedVoucher.type === "REPORT" ? (
                <div className="text-left text-[11px] grid grid-cols-2 gap-y-1 my-4 normal-case font-normal text-slate-700">
                  <div>From Date: <span className="font-bold font-serif">{printedVoucher.fromDate}</span></div>
                  <div className="text-right">To Date: <span className="font-bold">{printedVoucher.toDate}</span></div>
                </div>
              ) : (
                <div className="text-left text-[11px] grid grid-cols-2 gap-y-1 my-4 normal-case font-normal text-slate-700">
                  <div>Vou.No:  <span className="font-bold font-serif">{printedVoucher.voucherNo || printedVoucher.billNo || "96"}</span></div>
                  <div className="text-right">Vou.Date: <span className="font-bold">{printedVoucher.voucherDate || printedVoucher.accDate || "17/04/2026"}</span></div>
                  <div>Bill.No: <span className="font-bold">{printedVoucher.billNo || "N/A"}</span></div>
                  <div className="text-right">Bill.Date:<span className="font-bold">{printedVoucher.billDate || "N/A"}</span></div>
                  {printedVoucher.chequeNo && (
                    <>
                      <div>Cheque No: <span className="font-bold">{printedVoucher.chequeNo}</span></div>
                      <div className="text-right">Cheque Name: <span className="font-bold">{printedVoucher.chequeName}</span></div>
                    </>
                  )}
                </div>
              )}
              
              <div>------------------------------------------------------------------------</div>
            </div>

            {/* Printable contents table */}
            <div className="mt-4 text-[11.5px] leading-relaxed">
              
              {printedVoucher.type === "REPORT" ? (
                <ReportViewerContent config={printedVoucher} database={db} onClose={() => setIsPrintModalOpen(false)} />
              ) : (
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="font-bold">
                      <th className="pb-2">Sl.No</th>
                      <th className="pb-2">Account Description Head</th>
                      <th className="pb-2 text-right">Debit (Dr.)</th>
                      <th className="pb-2 text-right">Credit (Cr.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printedVoucher.items && printedVoucher.items.map((line, idx) => (
                      <tr key={idx} className="border-b border-dashed border-stone-200">
                        <td className="py-1">{idx + 1}</td>
                        <td className="py-1">
                          <span className="font-bold block">{line.accountName}</span>
                          {line.narration && <span className="text-[10px] text-stone-500 block max-w-sm truncate">{line.narration}</span>}
                        </td>
                        <td className="py-1 text-right">{(parseFloat(line.debit || line.amount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className="py-1 text-right">{(parseFloat(line.credit || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Print Summary Footer specifics of printable accounting files */}
              <div className="mt-6 text-right font-bold space-y-1">
                <div>-----------------------------------------------------</div>
                <div>Voucher Total: Rs. {(printedVoucher.totalAmount || printedVoucher.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                <div className="text-[10px] text-stone-500 font-normal uppercase italic mt-1.5">
                  *** Rs. {(printedVoucher.totalAmount || printedVoucher.grandTotal || 0).toLocaleString()} ONLY ***
                </div>
                <div>-----------------------------------------------------</div>
              </div>

              {/* Memo narration */}
              {printedVoucher.narration && (
                <div className="mt-4 p-2 bg-stone-100 rounded text-[10px] text-stone-500 leading-relaxed font-sans border">
                  <strong>VOUCHER REMARKS MEMO MEMORANDUM:</strong> <br/>
                  {printedVoucher.narration}
                </div>
              )}

            </div>

            {/* Vintage sign-offs on dotted ledger layout */}
            <div className="border-t border-dashed border-stone-400 pt-8 mt-12 text-[10px] text-stone-500 flex justify-between gap-4 font-mono select-none">
              <div>
                <span>PREPARED & VERIFIED BY</span>
                <div className="w-32 border-b border-stone-400 border-dashed mt-6"></div>
              </div>
              <div>
                <span>CHECKED BY: MD</span>
                <div className="w-32 border-b border-stone-400 border-dashed mt-6"></div>
              </div>
              <div className="text-right">
                <span>AUTHORISED SIGNATORY OFFICIAL</span>
                <div className="w-32 border-b border-stone-400 border-dashed mt-6 ml-auto"></div>
              </div>
            </div>

            {/* Printing guidance info */}
            <div className="text-center text-[9px] text-stone-400 mt-8">
              Printed on {new Date().toLocaleString()} | AccuFlow Desktop Emulator Pro
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
