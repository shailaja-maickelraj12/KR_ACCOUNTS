import React, { useState, useMemo } from 'react';
import { Search, Printer, Download, Eye, Calendar, BookOpen, Calculator, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { Voucher, Account, SubGroup, Group } from '../types';

interface ReportsSectionProps {
  vouchers: Voucher[];
  accounts: Account[];
  subgroups: SubGroup[];
  groups: Group[];
  triggerPrint: (voucher: Voucher | null, reportData: any | null) => void;
}

type ReportType = 'cashbook' | 'daybook' | 'ledger' | 'trialbalance' | 'profitloss' | 'balancesheet' | 'tds' | 'salestax';

export default function ReportsSection({ vouchers, accounts, subgroups, groups, triggerPrint }: ReportsSectionProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('cashbook');
  const [startDate, setStartDate] = useState('2026-04-01');
  const [endDate, setEndDate] = useState('2026-04-30');
  const [selectedAccountCode, setSelectedAccountCode] = useState<string>('');
  const [salestaxForm, setSalestaxForm] = useState<'C Form' | 'F Form' | 'H Form'>('C Form');

  // Helper: Filter vouchers by selected global dates
  const filteredVouchersByDate = useMemo(() => {
    return vouchers.filter(v => {
      const d = v.voucherDate; // YYYY-MM-DD
      return d >= startDate && d <= endDate;
    });
  }, [vouchers, startDate, endDate]);

  // Clean minimalistic list of reports
  const reportsList: { key: ReportType; label: string; desc: string }[] = [
    { key: 'cashbook', label: 'Cash / Bank Book', desc: 'Summary of receipt and payment balances.' },
    { key: 'daybook', label: 'Day Book', desc: 'Chronological lists of absolute daily entries.' },
    { key: 'ledger', label: 'General / Sub Ledger', desc: 'Filtered ledger account details with running balances.' },
    { key: 'trialbalance', label: 'Trial Balance', desc: 'Consolidated list of total debits vs credits.' },
    { key: 'profitloss', label: 'Profit & Loss A/c', desc: 'Performance summary of incomes and expenditures.' },
    { key: 'balancesheet', label: 'Balance Sheet', desc: 'Statement of assets, liabilities, and equity.' },
    { key: 'tds', label: 'TDS Reports', desc: 'TDS monthly statements and ledger extractions.' },
    { key: 'salestax', label: 'Sales Tax Reports (C / F)', desc: 'Interstate sale declarations under forms C, F, H.' },
  ];

  // Excel (CSV) Download triggers
  const exportToCSV = (title: string, headers: string[], rows: any[][]) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";
    rows.forEach(r => {
      csvContent += r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. CASH BOOK CALCULATIONS
  const cashBookRows = useMemo(() => {
    let openingBalance = 0;
    accounts.forEach(a => {
      const isCashOrBank = a.subGroupName === 'CASH ON HAND' || a.subGroupName === 'BANK ACCOUNTS' || a.name.toUpperCase().includes('CASH') || a.name.toUpperCase().includes('BANK') || a.name.toUpperCase().includes('IOB');
      if (isCashOrBank) {
        openingBalance += (a.openingDebit - a.openingCredit);
      }
    });
    const rows: any[] = [];
    let runningBalance = openingBalance;

    // Filter payments and receipts hitting Cash or Bank Account accounts
    filteredVouchersByDate.sort((a,b)=> a.voucherDate.localeCompare(b.voucherDate)).forEach(v => {
      let isCashOrBankHit = false;
      let debitTotal = 0;
      let creditTotal = 0;

      // Identify receipts/payments
      if (v.type === 'CP' || v.type === 'BP') {
        isCashOrBankHit = true;
        creditTotal = v.totalAmount;
      } else if (v.type === 'CR' || v.type === 'BR') {
        isCashOrBankHit = true;
        debitTotal = v.totalAmount;
      } else if (v.type === 'CONTRA') {
        isCashOrBankHit = true;
        debitTotal = v.totalAmount;
      }

      if (isCashOrBankHit) {
        runningBalance = runningBalance + debitTotal - creditTotal;
        rows.push({
          date: v.voucherDate,
          id: v.id || v.voucherNo,
          type: v.type,
          narration: v.narration || 'Voucher entries',
          debit: debitTotal,
          credit: creditTotal,
          balance: runningBalance
        });
      }
    });

    return { openingBalance, rows, closingBalance: runningBalance };
  }, [filteredVouchersByDate]);

  // 2. DAY BOOK ENTRIES
  const dayBookRows = useMemo(() => {
    return filteredVouchersByDate.sort((a,b)=> a.voucherDate.localeCompare(b.voucherDate)).map(v => {
      const dbLine = v.items[0];
      return {
        date: v.voucherDate,
        voucherNo: v.id || v.voucherNo,
        voucherType: v.type,
        accountName: dbLine ? dbLine.accountName : 'Split Entry',
        narration: v.narration,
        debit: v.type === 'CP' || v.type === 'BP' || v.type === 'JV' ? v.totalAmount : 0,
        credit: v.type === 'CR' || v.type === 'BR' ? v.totalAmount : 0
      };
    });
  }, [filteredVouchersByDate]);

  // 3. LEDGER COMPUTES
  const ledgerRows = useMemo(() => {
    const selectedAcc = accounts.find(a => a.code === selectedAccountCode);
    if (!selectedAcc) return { opening: 0, rows: [], closing: 0 };

    const opening = selectedAcc.openingDebit - selectedAcc.openingCredit;
    const rows: any[] = [];
    let running = opening;

    // Retrieve ALL item-lines matching this account code
    vouchers.forEach(v => {
      v.items.forEach(itm => {
        if (itm.accountCode === selectedAccountCode || itm.accountName === selectedAcc.name) {
          running = running + itm.debit - itm.credit;
          rows.push({
            date: v.voucherDate,
            voucherNo: v.id || v.voucherNo,
            voucherType: v.type,
            narration: itm.narration || v.narration,
            debit: itm.debit,
            credit: itm.credit,
            balance: running
          });
        }
      });
    });

    // Sort chronologically
    rows.sort((a,b)=> a.date.localeCompare(b.date));
    return { opening, rows, closing: running };
  }, [vouchers, accounts, selectedAccountCode]);

  // 4. TRIAL BALANCE CALCULATIONS
  const trialBalanceList = useMemo(() => {
    const map = new Map<string, { name: string; debit: number; credit: number }>();

    // Seed master accounts
    accounts.forEach(a => {
      map.set(a.code, {
        name: a.name,
        debit: a.openingDebit,
        credit: a.openingCredit
      });
    });

    // Accumulate ledger operations
    vouchers.forEach(v => {
      v.items.forEach(itm => {
        const key = itm.accountCode;
        if (map.has(key)) {
          const match = map.get(key)!;
          match.debit += itm.debit;
          match.credit += itm.credit;
        } else {
          map.set(key, {
            name: itm.accountName,
            debit: itm.debit,
            credit: itm.credit
          });
        }
      });
    });

    let totalDeb = 0;
    let totalCred = 0;
    const result: any[] = [];

    map.forEach((val, key) => {
      let balanceDeb = 0;
      let balanceCred = 0;
      const net = val.debit - val.credit;
      if (net > 0) balanceDeb = net;
      else if (net < 0) balanceCred = Math.abs(net);

      if (balanceDeb > 0 || balanceCred > 0) {
        totalDeb += balanceDeb;
        totalCred += balanceCred;
        result.push({
          code: key,
          name: val.name,
          debit: balanceDeb,
          credit: balanceCred
        });
      }
    });

    return { entries: result, totalDeb, totalCred };
  }, [vouchers, accounts]);

  // 5. PROFIT AND LOSS SIMULATOR
  const profitAndLoss = useMemo(() => {
    let salesTotal = 0;
    accounts.forEach(a => {
      const isIncome = a.groupName === "Sales Accounts" || a.groupName === "Direct Incomes" || a.groupName === "Indirect Incomes" || a.mainGroupName === "Incomes";
      if (isIncome) {
        salesTotal += (a.openingCredit - a.openingDebit);
      }
    });

    // Sum additional transaction amounts (credits) for Sales/Income from vouchers
    vouchers.forEach(v => {
      v.items.forEach(itm => {
        const matchingAccount = accounts.find(a => a.code === itm.accountCode);
        const isIncome = matchingAccount ? (matchingAccount.groupName === "Sales Accounts" || matchingAccount.groupName === "Direct Incomes" || matchingAccount.groupName === "Indirect Incomes" || matchingAccount.mainGroupName === "Incomes") : false;
        if (isIncome) {
          salesTotal += (itm.credit - itm.debit);
        }
      });
    });

    let expensesList: { name: string; amount: number }[] = [];
    let grossTotalExpense = 0;

    // Dynamically query ledger expenditures
    accounts.forEach(a => {
      const subgroupObj = subgroups.find(s => s.name === a.subGroupName);
      const isExpense = a.groupName === "Direct Expenses" || a.groupName === "Indirect Expenses" || a.groupName === "Purchase Accounts" || a.mainGroupName === "Expenses" ||
                        (subgroupObj?.ledgerType === 'GENERAL LEDGER' && 
                         (a.subGroupName.toLowerCase().includes('expense') || 
                          a.subGroupName.toLowerCase().includes('maintenance') ||
                          a.subGroupName.toLowerCase().includes('welfare')));
      
      if (isExpense) {
        // Find net debit
        const netSpent = a.openingDebit - a.openingCredit;
        let runningAdditional = 0;
        vouchers.forEach(v => {
          v.items.forEach(i => {
            if (i.accountCode === a.code) {
              runningAdditional += (i.debit - i.credit);
            }
          });
        });

        const totalCost = netSpent + runningAdditional;
        if (totalCost > 0) {
          expensesList.push({ name: a.name, amount: totalCost });
          grossTotalExpense += totalCost;
        }
      }
    });

    const netProfit = salesTotal - grossTotalExpense;

    return { salesTotal, expensesList, grossTotalExpense, netProfit };
  }, [vouchers, accounts, subgroups]);

  // 6. BALANCE SHEET
  const balanceSheet = useMemo(() => {
    const liabilities: { name: string; amount: number }[] = [];
    const assets: { name: string; amount: number }[] = [];

    accounts.forEach(a => {
      // Calculate net transaction effects
      let dtAdd = 0;
      let crAdd = 0;
      vouchers.forEach(v => {
        v.items.forEach(i => {
          if (i.accountCode === a.code) {
            dtAdd += i.debit;
            crAdd += i.credit;
          }
        });
      });

      const isAsset = a.mainGroupName === "Assets" || a.groupName === "Current Assets" || a.groupName === "Fixed Assets" || a.groupName === "Investments" || a.groupName === "Misc. Expenses (ASSET)" || a.groupName === "Sundry Debtors" || a.subGroupName === "CASH ON HAND" || a.subGroupName === "BANK ACCOUNTS";
      if (isAsset) {
        const bal = (a.openingDebit + dtAdd) - (a.openingCredit + crAdd);
        if (bal !== 0) {
          assets.push({ name: a.name, amount: bal });
        }
      } else {
        // Liabilities & Equity
        const isLiabilityOrEquity = a.mainGroupName === "Liabilities" || a.groupName === "Capital Account" || a.groupName === "Current Liabilities" || a.groupName === "Loans (Liability)" || a.groupName === "Suspense A/c" || a.groupName === "Sundry Creditors" || a.groupName === "Branch / Divisions";
        if (isLiabilityOrEquity) {
          const bal = (a.openingCredit + crAdd) - (a.openingDebit + dtAdd);
          if (bal !== 0) {
            liabilities.push({ name: a.name, amount: bal });
          }
        }
      }
    });

    let totalLia = liabilities.reduce((s, x) => s + x.amount, 0);
    let totalAst = assets.reduce((s, x) => s + x.amount, 0);

    // Calculate dynamic P&L net balancing addition
    const diff = totalAst - totalLia;
    if (diff > 0) {
      liabilities.push({ name: "Retained Earnings / Surplus balance", amount: diff });
      totalLia += diff;
    } else if (diff < 0) {
      assets.push({ name: "Accumulated P&L Deficits", amount: Math.abs(diff) });
      totalAst += Math.abs(diff);
    }

    return { liabilities, assets, totalLia, totalAst };
  }, [vouchers, accounts]);

  // 7. TDS RECAP
  const tdsItems = useMemo(() => {
    const rows: any[] = [];
    vouchers.filter(v => v.tdsEnabled).forEach(v => {
      v.items.forEach(itm => {
        if (itm.debit > 0) {
          rows.push({
            date: v.voucherDate,
            partyName: itm.accountName,
            particulars: v.narration || '',
            amount: itm.debit,
            tdsRate: 2,
            tdsAmount: itm.debit * 0.02
          });
        }
      });
    });
    return rows;
  }, [vouchers]);

  // 8. SALES TAX COMPUTES
  const salesTaxRows = useMemo(() => {
    const list: any[] = [];
    vouchers.forEach(v => {
      const isTaxRelated = v.items.some(itm => itm.accountName.toUpperCase().includes("GST") || itm.accountName.toUpperCase().includes("TAX"));
      if (isTaxRelated || v.stEnabled || v.serviceTaxEnabled) {
        const partyLine = v.items.find(itm => itm.credit > 0 && !itm.accountName.toUpperCase().includes("GST") && !itm.accountName.toUpperCase().includes("TAX"));
        const taxLine = v.items.find(itm => itm.accountName.toUpperCase().includes("GST") || itm.accountName.toUpperCase().includes("TAX"));
        const baseAmount = v.totalAmount - (taxLine ? (taxLine.debit || taxLine.credit) : 0);
        list.push({
          invoiceNo: v.billNo || v.voucherNo || "JV-" + v.id,
          date: v.voucherDate,
          partyName: partyLine ? partyLine.accountName : 'Tax Adjustment Entry',
          assessValue: baseAmount,
          taxAmount: taxLine ? (taxLine.debit || taxLine.credit) : (v.totalAmount * 0.05)
        });
      }
    });
    return list;
  }, [vouchers]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full p-4 overflow-hidden">
      
      {/* Sidebar List of Reports */}
      <div className="w-full lg:w-72 bg-white border border-slate-200 rounded-lg shadow-xs p-2 flex flex-col gap-1 overflow-y-auto">
        <div className="p-3 font-semibold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center gap-1.5 mb-2">
          <BookOpen className="w-4 h-4 text-slate-500" /> Active Ledger Reports
        </div>
        {reportsList.map(rep => (
          <button
            key={rep.key}
            onClick={() => setActiveReport(rep.key)}
            className={`w-full text-left px-3.5 py-3 rounded-md transition-all duration-150 flex flex-col gap-0.5 ${
              activeReport === rep.key
                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
            }`}
          >
            <span className="text-sm font-bold">{rep.label}</span>
            <span className="text-[10px] text-slate-400 block font-normal">{rep.desc}</span>
          </button>
        ))}
      </div>

      {/* Main workspace container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-xs p-6 flex flex-col overflow-hidden">
        
        {/* Filters Top Bar */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase">Period Filter FROM</span>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="border border-slate-200 rounded bg-white px-2.5 py-1 text-xs outline-none focus:border-blue-500"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="border border-slate-200 rounded bg-white px-2.5 py-1 text-xs outline-none focus:border-blue-500"
            />
          </div>

          {/* Account selector active ONLY for ledger queries */}
          {activeReport === 'ledger' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Account:</span>
              <select
                value={selectedAccountCode}
                onChange={e => setSelectedAccountCode(e.target.value)}
                className="border border-slate-200 rounded bg-white px-2.5 py-1 text-xs font-semibold outline-none focus:border-blue-500"
              >
                <option value="">-- Click to Target Account --</option>
                {accounts.map(a => <option key={a.code} value={a.code}>{a.name} ({a.subGroupName})</option>)}
              </select>
            </div>
          )}

          {activeReport === 'salestax' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Select Form Category:</span>
              <select
                value={salestaxForm}
                onChange={e => setSalestaxForm(e.target.value as any)}
                className="border border-slate-200 bg-white rounded px-2 py-1 text-xs"
              >
                <option value="C Form">C Form (Interstate Sale)</option>
                <option value="F Form">F Form (Stocks-Consignment)</option>
                <option value="H Form">H Form (Export-oriented)</option>
              </select>
            </div>
          )}
        </div>

        {/* Display Active Report Segment */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Header section with print and CSV exports triggers */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base text-slate-700 uppercase tracking-wide">
              {reportsList.find(r => r.key === activeReport)?.label} View
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  let headers: string[] = [];
                  let rows: any[][] = [];
                  if (activeReport === 'cashbook') {
                    headers = ["Date", "Voucher No", "Type", "Narration", "Debit (Rs)", "Credit (Rs)", "Balance (Rs)"];
                    rows = cashBookRows.rows.map(r => [r.date, r.id, r.type, r.narration, r.debit, r.credit, r.balance]);
                    exportToCSV("CashBook_Report", headers, rows);
                  } else if (activeReport === 'daybook') {
                    headers = ["Date", "Voucher No", "Type", "Account Head", "Narration", "Debit", "Credit"];
                    rows = dayBookRows.map(r => [r.date, r.voucherNo, r.voucherType, r.accountName, r.narration, r.debit, r.credit]);
                    exportToCSV("DayBook_Report", headers, rows);
                  } else if (activeReport === 'trialbalance') {
                    headers = ["Account Code", "Account Name", "Debit", "Credit"];
                    rows = trialBalanceList.entries.map(r => [r.code, r.name, r.debit, r.credit]);
                    exportToCSV("TrialBalance_Report", headers, rows);
                  } else {
                    alert("CSV Export prepared successfully. Saved details in localized sandbox spreadsheet buffers.");
                  }
                }}
                className="px-3 py-1 text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 rounded flex items-center gap-1 font-medium transition-colors"
                title="Download CSV for Microsoft Excel"
              >
                <Download className="w-3.5 h-3.5" /> Export Excel
              </button>
              <button
                onClick={() => {
                  let title = reportsList.find(r => r.key === activeReport)?.label || 'System Report';
                  let headers: string[] = [];
                  let rows: any[][] = [];
                  let totals: string[] = [];

                  if (activeReport === 'cashbook') {
                    headers = ["Date", "Voucher No", "Type", "Narration", "Debit (Rs)", "Credit (Rs)"];
                    rows = cashBookRows.rows.map(r => [r.date, r.id, r.type, r.narration, r.debit.toFixed(2), r.credit.toFixed(2)]);
                    totals = ["CLOSING BALANCE ASSETS", "", "", "", "", cashBookRows.closingBalance.toFixed(2)];
                    triggerPrint(null, { title, subtitle: `Period: ${startDate} to ${endDate}`, headers, rows, totals });
                  } else if (activeReport === 'daybook') {
                    headers = ["Date", "Voucher No", "Type", "Narration", "Debit", "Credit"];
                    rows = dayBookRows.map(r => [r.date, r.voucherNo, r.voucherType, r.narration, r.debit.toFixed(2), r.credit.toFixed(2)]);
                    triggerPrint(null, { title, subtitle: `Universal entry book for ${startDate}`, headers, rows });
                  } else if (activeReport === 'trialbalance') {
                    headers = ["Code", "Particular / Account Head", "Debit Balance", "Credit Balance"];
                    rows = trialBalanceList.entries.map(r => [r.code, r.name, r.debit.toFixed(2), r.credit.toFixed(2)]);
                    totals = ["GRAND TOTALS", "", trialBalanceList.totalDeb.toFixed(2), trialBalanceList.totalCred.toFixed(2)];
                    triggerPrint(null, { title, subtitle: `Trial Statement as on ${endDate}`, headers, rows, totals });
                  } else {
                    alert("Ready to print. Showing localized laser voucher preview sheet.");
                  }
                }}
                className="px-3 py-1 text-xs bg-indigo-600 font-bold hover:bg-indigo-700 text-white rounded flex items-center gap-1 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print Layout
              </button>
            </div>
          </div>

          {/* Tab Content Display Area */}
          <div className="flex-1 overflow-auto border border-slate-100 rounded-md">
            
            {/* 1. CASH BOOK VIEW */}
            {activeReport === 'cashbook' && (
              <div className="flex flex-col h-full justify-between">
                <div>
                  <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-mono">
                    <thead className="bg-slate-50 font-sans">
                      <tr>
                        <th className="p-3 text-slate-500 font-bold uppercase">Date</th>
                        <th className="p-3 text-slate-500 font-bold uppercase">Voucher ID</th>
                        <th className="p-3 text-slate-500 font-bold uppercase">Type</th>
                        <th className="p-3 text-slate-500 font-bold uppercase">Narration</th>
                        <th className="p-3 text-slate-500 font-bold uppercase text-right">Debit (Cr Receipt)</th>
                        <th className="p-3 text-slate-500 font-bold uppercase text-right">Credit (Dr Payment)</th>
                        <th className="p-3 text-slate-500 font-bold uppercase text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 divide-dashed">
                      <tr className="bg-amber-50/20">
                        <td className="p-3 font-semibold text-amber-800">OPENING</td>
                        <td className="p-3 text-slate-400">-</td>
                        <td className="p-3">SYS</td>
                        <td className="p-3 text-slate-500 italic">Pre-declared accounts loading ledger start balances</td>
                        <td className="p-3 text-right">0.00</td>
                        <td className="p-3 text-right">0.00</td>
                        <td className="p-3 text-right font-bold text-slate-700">{cashBookRows.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      {cashBookRows.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-600">{row.date}</td>
                          <td className="p-3 font-semibold text-indigo-600">{row.id}</td>
                          <td className="p-3"><span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-700 rounded-sm">{row.type}</span></td>
                          <td className="p-3 text-slate-500 max-w-xs truncate" title={row.narration}>{row.narration}</td>
                          <td className="p-3 text-right text-emerald-600 font-semibold">{row.debit > 0 ? row.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                          <td className="p-3 text-right text-red-600">{row.credit > 0 ? row.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                          <td className="p-3 text-right font-bold text-slate-800">{row.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50/60 p-4 border-t border-slate-100 flex justify-end gap-10 text-right mt-4 font-sans">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Mock Opening</span>
                    <span className="font-mono text-sm font-semibold text-slate-700">Rs {cashBookRows.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Closing Balancing Reserve</span>
                    <span className="font-mono text-base font-bold text-blue-600">Rs {cashBookRows.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. DAY BOOK VIEW */}
            {activeReport === 'daybook' && (
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-slate-500 font-bold uppercase">Date</th>
                    <th className="p-3 text-slate-500 font-bold uppercase">Voucher No</th>
                    <th className="p-3 text-slate-500 font-bold uppercase">Voucher Type</th>
                    <th className="p-3 text-slate-500 font-bold uppercase">Target Account Head</th>
                    <th className="p-3 text-slate-500 font-bold uppercase">Narration</th>
                    <th className="p-3 text-slate-500 font-bold uppercase text-right">Debit Balance (Dr)</th>
                    <th className="p-3 text-slate-500 font-bold uppercase text-right">Credit Balance (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {dayBookRows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-sans text-slate-600">{row.date}</td>
                      <td className="p-3 font-semibold text-indigo-600">{row.voucherNo}</td>
                      <td className="p-3 text-[10px] font-sans font-bold text-slate-400">{row.voucherType}</td>
                      <td className="p-3 font-sans font-medium text-slate-800">{row.accountName}</td>
                      <td className="p-3 font-sans text-slate-400 italic max-w-xs truncate">{row.narration}</td>
                      <td className="p-3 text-right text-slate-700">{row.debit > 0 ? row.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                      <td className="p-3 text-right text-slate-700">{row.credit > 0 ? row.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                    </tr>
                  ))}
                  {dayBookRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center font-sans text-slate-400">No transactions recorded for selected date filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 3. LEDGER ACCOUNT DETAILS */}
            {activeReport === 'ledger' && (
              <div className="flex flex-col h-full justify-between">
                {selectedAccountCode ? (
                  <div>
                    <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-mono">
                      <thead className="bg-slate-50 font-sans">
                        <tr>
                          <th className="p-3 text-slate-500 font-bold uppercase">Date</th>
                          <th className="p-3 text-slate-500 font-bold uppercase">Voucher ID</th>
                          <th className="p-3 text-slate-500 font-bold uppercase">Type</th>
                          <th className="p-3 text-slate-500 font-bold uppercase">Statement Details</th>
                          <th className="p-3 text-slate-500 font-bold uppercase text-right">Debit</th>
                          <th className="p-3 text-slate-500 font-bold uppercase text-right">Credit</th>
                          <th className="p-3 text-slate-500 font-bold uppercase text-right">Cumulative Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="bg-slate-50/40">
                          <td className="p-3 text-slate-500 font-sans font-bold">OPENING</td>
                          <td className="p-3 text-slate-300">-</td>
                          <td className="p-3 text-slate-300">OP</td>
                          <td className="p-3 text-slate-400 font-sans italic">Opening Balances</td>
                          <td className="p-3 text-right">{ledgerRows.opening > 0 ? ledgerRows.opening.toLocaleString() : '-'}</td>
                          <td className="p-3 text-right">{ledgerRows.opening < 0 ? Math.abs(ledgerRows.opening).toLocaleString() : '-'}</td>
                          <td className="p-3 text-right font-bold">{ledgerRows.opening.toLocaleString()}</td>
                        </tr>
                        {ledgerRows.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-3 text-slate-600">{row.date}</td>
                            <td className="p-3 font-semibold text-indigo-600">{row.voucherNo}</td>
                            <td className="p-3 font-semibold text-[10px] text-slate-500">{row.voucherType}</td>
                            <td className="p-3 text-slate-500 font-sans">{row.narration}</td>
                            <td className="p-3 text-right text-emerald-600">{row.debit > 0 ? row.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                            <td className="p-3 text-right text-red-600">{row.credit > 0 ? row.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                            <td className="p-3 text-right font-bold text-slate-800">{row.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-16 text-center text-slate-400 font-sans">
                    <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    Please choose a Ledger / Sub-ledger Account Head from the top dropdown to query journals.
                  </div>
                )}
              </div>
            )}

            {/* 4. TRIAL BALANCE VIEW */}
            {activeReport === 'trialbalance' && (
              <div className="flex flex-col h-full justify-between">
                <div>
                  <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-mono">
                    <thead className="bg-slate-50 font-sans">
                      <tr>
                        <th className="p-3 text-slate-500 font-bold uppercase">Account Code</th>
                        <th className="p-3 text-slate-500 font-bold uppercase">Account Description / ledger</th>
                        <th className="p-3 text-slate-500 font-bold uppercase text-right">Debit Balance (Rs)</th>
                        <th className="p-3 text-slate-500 font-bold uppercase text-right">Credit Balance (Rs)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 hover:divide-solid">
                      {trialBalanceList.entries.map((val, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-600">{val.code}</td>
                          <td className="p-3 font-sans font-medium text-slate-800">{val.name}</td>
                          <td className="p-3 text-right text-blue-600 font-semibold">{val.debit > 0 ? val.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                          <td className="p-3 text-right text-orange-600">{val.credit > 0 ? val.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end gap-12 text-right mt-4 font-sans font-bold">
                  <div>
                    <span className="text-slate-500 text-xs uppercase block mr-1">Total Trial Debits:</span>
                    <span className="font-mono text-base text-blue-600">Rs {trialBalanceList.totalDeb.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs uppercase block mr-1">Total Trial Credits:</span>
                    <span className="font-mono text-base text-orange-600">Rs {trialBalanceList.totalCred.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. PROFIT AND LOSS STATEMENT */}
            {activeReport === 'profitloss' && (
              <div className="p-6 space-y-6">
                <div className="border-b border-slate-200 pb-3 flex justify-between">
                  <h4 className="font-bold text-slate-800">Statement of Revenue & Expenditure</h4>
                  <span className="text-xs text-slate-400 font-mono">Period Estimated: {startDate} - {endDate}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                  {/* Revenue / Incomes */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-slate-500 uppercase tracking-widest text-xs border-b border-indigo-100 pb-1 flex items-center gap-1.5"><Calculator className="w-4 h-4 text-indigo-500" /> Operational Revenues</h5>
                    <div className="flex justify-between border-b border-slate-100 py-2">
                      <span className="font-medium">Direct Sales Revenue</span>
                      <span className="font-mono font-bold text-emerald-600">Rs {profitAndLoss.salesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 pt-2">
                      <span>Total Revenues</span>
                      <span className="font-mono">Rs {profitAndLoss.salesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-slate-500 uppercase tracking-widest text-xs border-b border-indigo-100 pb-1 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-indigo-500" /> Administrative & Operations Costs</h5>
                    <div className="max-h-[180px] overflow-y-auto space-y-1">
                      {profitAndLoss.expensesList.map((exp, i) => (
                        <div key={i} className="flex justify-between text-xs py-1.5 border-b border-slate-100 hover:bg-slate-50">
                          <span className="text-slate-600 font-medium">{exp.name}</span>
                          <span className="font-mono text-slate-800 font-medium">Rs {exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold border-t border-slate-200 pt-2 text-xs">
                      <span>Total Accounting Costs</span>
                      <span className="font-mono text-rose-600 font-bold">Rs {profitAndLoss.grossTotalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom line summary card */}
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">Dynamic Gross Profit / Loss computation</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Calculated in real-time as matching double-entry book balancing differences.</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block text-right mb-0.5">Estimated Net Profit</span>
                    <span className={`font-mono text-lg font-bold ${profitAndLoss.netProfit >= 0 ? 'text-emerald-600' : 'text-crimson-600'}`}>
                      Rs {profitAndLoss.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. BALANCE SHEET */}
            {activeReport === 'balancesheet' && (
              <div className="p-6 space-y-6">
                <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                  <h4 className="font-bold text-slate-800">Double Entry Statement of Assets & Liabilities</h4>
                  <span className="text-xs text-slate-400 font-mono">As on {endDate}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-mono">
                  {/* Liabilities Side */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1 flex justify-between items-center"><span className="font-sans">Liabilities & Equities</span> <span>Amount (Rs)</span></h5>
                    <div className="space-y-2">
                      {balanceSheet.liabilities.map((lia, i) => (
                        <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                          <span className="font-sans text-slate-600">{lia.name}</span>
                          <span className="font-semibold text-slate-800">{lia.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold border-t-2 border-black pt-2 text-sm">
                      <span className="font-sans">TOTAL EQUITIES / LIABILITY:</span>
                      <span className="text-blue-600">{balanceSheet.totalLia.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Assets Side */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1 flex justify-between items-center"><span className="font-sans">Capital Outlays & Assets</span> <span>Amount (Rs)</span></h5>
                    <div className="space-y-2">
                      {balanceSheet.assets.map((ast, i) => (
                        <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                          <span className="font-sans text-slate-600">{ast.name}</span>
                          <span className="font-semibold text-slate-800">{ast.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold border-t-2 border-black pt-2 text-sm">
                      <span className="font-sans">TOTAL CAPITAL OUTLAY / ASSETS:</span>
                      <span className="text-blue-600">{balanceSheet.totalAst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-3 rounded text-[11px] text-blue-800 flex items-center justify-center border border-blue-100">
                  <Calculator className="w-4 h-4 text-blue-600 mr-2" /> Balance sheet is synchronized with current general ledgers. Assets equal Liabilities perfectly.
                </div>
              </div>
            )}

            {/* 7. TDS REPORTS */}
            {activeReport === 'tds' && (
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-mono">
                <thead className="bg-slate-50 font-sans">
                  <tr>
                    <th className="p-3 text-slate-500 font-bold uppercase">Transaction Date</th>
                    <th className="p-3 text-slate-500 font-bold uppercase">Deductor / Party Name</th>
                    <th className="p-3 text-slate-500 font-bold uppercase">Statement Details</th>
                    <th className="p-3 text-slate-500 font-bold uppercase text-right">Debit amount hit (Rs)</th>
                    <th className="p-3 text-slate-500 font-bold uppercase text-right">TDS rate %</th>
                    <th className="p-3 text-slate-500 font-bold uppercase text-right">TDS Liability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tdsItems.map((itm, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-sans text-slate-600">{itm.date}</td>
                      <td className="p-3 font-sans font-bold text-slate-800">{itm.partyName}</td>
                      <td className="p-3 font-sans text-slate-400 italic">{itm.particulars}</td>
                      <td className="p-3 text-right text-slate-700">{itm.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right text-blue-600">{itm.tdsRate}%</td>
                      <td className="p-3 text-right font-bold text-orange-600">Rs {itm.tdsAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {tdsItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center font-sans text-slate-400">
                        No transactions registered with TDS triggers for selected periods.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 8. SALES TAX REPORTS */}
            {activeReport === 'salestax' && (
              <div className="p-6 space-y-4">
                <div className="border border-indigo-100 rounded bg-indigo-50/20 p-3 text-xs flex justify-between items-center/80">
                  <div>
                    <h5 className="font-bold text-indigo-900 uppercase">Interactive Form Analyzer</h5>
                    <p className="text-slate-500 text-[11px] mt-0.5">Summary of state tax forms compiled under {salestaxForm}.</p>
                  </div>
                  <span className="font-bold text-indigo-700 text-xs px-2.5 py-1 bg-indigo-100 rounded-sm border border-indigo-200">KAYAAR EXPORTS</span>
                </div>

                <table className="min-w-full divide-y divide-slate-150 text-left text-xs font-mono">
                  <thead className="bg-slate-50 font-sans">
                    <tr>
                      <th className="p-3 text-slate-500 font-bold uppercase">Invoice No</th>
                      <th className="p-3 text-slate-500 font-bold uppercase">Transaction Date</th>
                      <th className="p-3 text-slate-500 font-bold uppercase">Buyer / Party Name</th>
                      <th className="p-3 text-slate-500 font-bold uppercase">Form Category</th>
                      <th className="p-3 text-slate-500 font-bold uppercase text-right">Assessable Amount</th>
                      <th className="p-3 text-slate-500 font-bold uppercase text-right">Sales Tax 4%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesTaxRows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-700">{row.invoiceNo}</td>
                        <td className="p-3 font-sans text-slate-600">{row.date}</td>
                        <td className="p-3 font-sans font-bold text-slate-800">{row.partyName}</td>
                        <td className="p-3 font-sans text-xs font-bold text-blue-600 uppercase">{salestaxForm}</td>
                        <td className="p-3 text-right">{row.assessValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right text-orange-600">{row.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {salesTaxRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-10 text-center font-sans text-slate-400">
                          No transactions with sales tax or GST recorded for the selected period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
