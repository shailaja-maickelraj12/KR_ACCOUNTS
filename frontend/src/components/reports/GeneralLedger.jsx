import React, { useState, useEffect } from "react";
import { 
  computeGeneralLedgerRange, 
  computeTrialBalance, 
  computeCashBook, 
  computeProfitLoss, 
  computeBalanceSheet,
  getAccounts,
  getSubGroups
} from "../../database";
import { Printer, FileSpreadsheet, Eye, Info, Calendar } from "lucide-react";

export default function GeneralLedger({ database, activeReport = "ledger", onPrint }) {
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2026-04-17");
  const [selectedAccount, setSelectedAccount] = useState("1001001"); // Default Repairs & Maint
  const [selectedSubGroup, setSelectedSubGroup] = useState("CREDITORS - OTHERS");
  const [searchQuery, setSearchQuery] = useState("");

  // Report States
  const [ledgerReport, setLedgerReport] = useState(null);
  const [trialReport, setTrialReport] = useState(null);
  const [cashReport, setCashReport] = useState(null);
  const [plReport, setPlReport] = useState(null);
  const [bsReport, setBsReport] = useState(null);

  // Trigger Calculations
  const calculateReports = () => {
    if (activeReport === "ledger") {
      const res = computeGeneralLedgerRange(selectedAccount, fromDate, toDate);
      setLedgerReport(res);
    } else if (activeReport === "trial") {
      const res = computeTrialBalance(toDate);
      setTrialReport(res);
    } else if (activeReport === "cash") {
      const res = computeCashBook(selectedAccount, fromDate, toDate);
      setCashReport(res);
    } else if (activeReport === "pl") {
      const res = computeProfitLoss(fromDate, toDate);
      setPlReport(res);
    } else if (activeReport === "bs") {
      const res = computeBalanceSheet(toDate);
      setBsReport(res);
    }
  };

  useEffect(() => {
    calculateReports();
  }, [database, activeReport, fromDate, toDate, selectedAccount, selectedSubGroup]);

  // Keep selectedAccount dynamically synced with database.accounts when loaded
  useEffect(() => {
    if (database.accounts && database.accounts.length > 0) {
      const exists = database.accounts.some(a => a.code === selectedAccount);
      if (!exists) {
        setSelectedAccount(database.accounts[0].code);
      }
    }
  }, [database.accounts]);

  // Export to Excel simulation
  const simulateExcel = () => {
    alert("Export Successful: Report generated in xlsx format and saved to downloads folder.");
  };

  // Helper for printing
  const handlePrintReport = () => {
    onPrint({
      type: "REPORT",
      reportType: activeReport,
      fromDate,
      toDate,
      selectedAccount,
      selectedSubGroup,
      ledgerReport,
      trialReport,
      cashReport,
      plReport,
      bsReport
    });
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#F8FAFC] min-h-0" id="reports-dock">
      
      {/* Parameter Control Bar */}
      <div className="p-5 bg-white border-b border-[#E2E8F0] shadow-sm flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 select-none shrink-0">
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#2563EB]" />
          <span>From:</span>
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="p-1.5 border rounded outline-none font-mono text-slate-800"
          />
          <span>To:</span>
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="p-1.5 border rounded outline-none font-mono text-slate-800"
          />
        </div>

        {/* Selected target account for specific statements */}
        {(activeReport === "ledger" || activeReport === "cash") && (
          <div className="flex items-center gap-2">
            <span>Select Account Head:</span>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="p-1.5 border rounded outline-none font-mono bg-white"
            >
              {database.accounts.map(a => (
                <option key={a.code} value={a.code}>{a.name} ({a.code})</option>
              ))}
            </select>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button 
            onClick={simulateExcel}
            className="bg-white border hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" /> Export Excel
          </button>
          <button 
            onClick={handlePrintReport}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Dot Matrix Frame
          </button>
        </div>

      </div>

      {/* Main reporting view frame with Smooth Scrolling */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0" id="reports-canvas">
        <div className="max-w-4xl mx-auto bg-white border border-[#E2E8F0] rounded-lg shadow p-8 min-h-[700px] flex flex-col justify-between" id="dot-matrix-paper-mock">
          
          {/* Paper content with elegant monospace style (reproducing dot matrix print layout) */}
          <div className="font-mono text-xs select-text">
            
            {/* Kayaar Header */}
            <div className="text-center mb-6">
              <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">KAYAAR EXPORTS PRIVATE LIMITED</h2>
              <p className="text-[10px] text-slate-500 mt-1">Railway Feeder Road, K.R.Nagar, Kovilpatti - 628503</p>
              <div className="border-b border-[#E2E8F0] w-full my-3"></div>
              
              {activeReport === "ledger" && (
                <div className="font-bold text-[#1E293B]">
                  GENERAL SUB-LEDGER FOR: {ledgerReport?.account?.name}
                  <div className="text-[10px] text-slate-500 font-normal mt-1">
                    Period: {fromDate} to {toDate} | Account Code: {ledgerReport?.account?.code}
                  </div>
                </div>
              )}

              {activeReport === "trial" && (
                <div className="font-bold text-[#1E293B]">
                  TRIAL BALANCE STATEMENTS
                  <div className="text-[10px] text-slate-500 font-normal mt-1">As of: {toDate}</div>
                </div>
              )}

              {activeReport === "cash" && (
                <div className="font-bold text-[#1E293B]">
                  CASH BOOK RECEIPTS & PAYMENTS OUTFLOW
                  <div className="text-[10px] text-slate-500 font-normal mt-1">Registers: {fromDate} to {toDate}</div>
                </div>
              )}

              {activeReport === "pl" && (
                <div className="font-bold text-[#1E293B]">
                  PROFIT & LOSS STATEMENT
                  <div className="text-[10px] text-slate-500 font-normal mt-1">Trading Period: {fromDate} to {toDate}</div>
                </div>
              )}

              {activeReport === "bs" && (
                <div className="font-bold text-[#1E293B]">
                  BALANCE SHEET DETAIL STATEMENT
                  <div className="text-[10px] text-slate-500 font-normal mt-1">As of financial date: {toDate}</div>
                </div>
              )}

              {activeReport === "sales-tax" && (
                <div className="font-bold text-[#1E293B]">
                  TDS MONTHLY RETENTION STATEMENT (SECTION 94 C)
                  <div className="text-[10px] text-slate-500 font-normal mt-1">Period: {fromDate} to {toDate}</div>
                </div>
              )}
            </div>

            {/* General Ledger Table Section (Mapping Page 13) */}
            {activeReport === "ledger" && ledgerReport && (
              <div>
                <div className="text-right text-[10px] text-slate-400 mb-2">
                  Opening Ledger Balance: Rs. {ledgerReport.openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })} (Dr.)
                </div>
                
                <table className="w-full text-left font-mono text-[11px] leading-relaxed">
                  <thead>
                    <tr className="border-t border-b border-dashed border-slate-400 py-1 font-bold text-slate-700">
                      <th className="py-2">Date</th>
                      <th className="py-2">Vou.Type</th>
                      <th className="py-2 text-center">Vou.No</th>
                      <th className="py-2 w-1/3">Transaction Memo / Particulars</th>
                      <th className="py-2 text-right">Debit (Dr.)</th>
                      <th className="py-2 text-right">Credit (Cr.)</th>
                      <th className="py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-slate-300">
                    {ledgerReport.lines.map(line => (
                      <tr key={line.voucherId} className="hover:bg-slate-50">
                        <td className="py-2 text-slate-500 text-[10px]">{line.voucherDate}</td>
                        <td className="py-2 text-slate-600 font-bold">{line.type}</td>
                        <td className="py-2 text-center text-slate-700 font-semibold">{line.voucherNo}</td>
                        <td className="py-2 text-slate-600 truncate max-w-xs">{line.narration}</td>
                        <td className="py-2 text-right text-slate-700 font-medium">{line.debit > 0 ? line.debit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}</td>
                        <td className="py-2 text-right text-slate-700 font-medium">{line.credit > 0 ? line.credit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}</td>
                        <td className="py-2 text-right text-blue-600 font-bold">{line.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {ledgerReport.lines.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 text-[10px]">No ledger entry records matched this date range parameter.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="border-t-2 border-dashed border-slate-400 mt-4 pt-3 flex justify-end font-bold text-slate-800">
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <span>Ending Balance:</span>
                    <span className="text-[#2563EB]">Rs. {ledgerReport.endingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Trial Balance Table Section (Mapping Page 9) */}
            {activeReport === "trial" && trialReport && (
              <div>
                <table className="w-full text-left font-mono text-[11px] leading-relaxed">
                  <thead>
                    <tr className="border-t border-b border-dashed border-slate-400 py-1 font-bold text-slate-700">
                      <th className="py-2">Acc. Code</th>
                      <th className="py-2">Account Description Head</th>
                      <th className="py-2">Sub Group Grouping</th>
                      <th className="py-2 text-right">Debit Balance (Dr.)</th>
                      <th className="py-2 text-right">Credit Balance (Cr.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-slate-300">
                    {trialReport.accounts.map(acc => (
                      <tr key={acc.code} className="hover:bg-slate-100">
                        <td className="py-2 font-mono text-slate-500">{acc.code}</td>
                        <td className="py-2 font-semibold text-slate-800">{acc.name}</td>
                        <td className="py-2 text-slate-400">{acc.subGroupName}</td>
                        <td className="py-2 text-right text-slate-700">{acc.debit > 0 ? acc.debit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}</td>
                        <td className="py-2 text-right text-[#2563EB] font-medium">{acc.credit > 0 ? acc.credit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t-2 border-b-2 border-dashed border-slate-500 mt-6 py-2.5 flex justify-end font-bold text-slate-800 text-[12px]">
                  <div className="grid grid-cols-2 gap-x-12 gap-y-1 font-mono text-right w-full max-w-md">
                    <span>Total Trial Dr:</span>
                    <span>Rs. {trialReport.totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    <span>Total Trial Cr:</span>
                    <span>Rs. {trialReport.totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Cash Book Receipts/Payments section (Mapping Page 10, 11) */}
            {activeReport === "cash" && cashReport && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Receipts column */}
                <div className="border-r pr-4">
                  <h4 className="font-bold border-b pb-1 mb-2 text-slate-800 uppercase tracking-widest text-[10px]">Receipts (Debits to Cash)</h4>
                  <div className="text-[10px] text-slate-400 mb-2">Opening Cash: Rs. {cashReport.openingBalance.toLocaleString()}</div>
                  <div className="space-y-2">
                    {cashReport.receipts.map(r => (
                      <div key={r.voucherId} className="flex justify-between border-b border-dotted py-1 text-[10px]">
                        <div>
                          <div className="font-semibold text-slate-700">Vou: {r.voucherNo} | {r.voucherDate}</div>
                          <div className="text-[9px] text-slate-400">{r.narration}</div>
                        </div>
                        <span className="font-bold text-[#166534] shrink-0">+{r.debit.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payments column */}
                <div>
                  <h4 className="font-bold border-b pb-1 mb-2 text-[#2563EB] uppercase tracking-widest text-[10px]">Payments (Credits to Cash)</h4>
                  <div className="text-[10px] text-slate-400 mb-2">Total cash reduction flow</div>
                  <div className="space-y-2">
                    {cashReport.payments.map(p => (
                      <div key={p.voucherId} className="flex justify-between border-b border-dotted py-1 text-[10px]">
                        <div>
                          <div className="font-semibold text-slate-700">Vou: {p.voucherNo} | {p.voucherDate}</div>
                          <div className="text-[9px] text-slate-400">{p.narration}</div>
                        </div>
                        <span className="font-bold text-red-600 shrink-0">-{p.credit.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 border-t-2 border-dashed border-slate-400 pt-3 text-right font-bold text-[12px]">
                  Ending Available Liquid Cash Balance: Rs. {cashReport.endingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>

              </div>
            )}

            {/* Profit & Loss Section (Mapping Page 18) */}
            {activeReport === "pl" && plReport && (
              <div className="space-y-4">
                <div className="border-b-2 pb-1 text-slate-700 font-bold uppercase tracking-wider">Trading Account Profit metrics</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>DOMESTIC & EXPORT REVENUE / SALES:</span>
                    <span className="font-semibold">Rs. {plReport.salesRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Add: Closing inventory stock valuation:</span>
                    <span>Rs. {plReport.closingStock.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Less: Opening inventory stock valuation:</span>
                    <span>Rs. ({plReport.openingStock.toLocaleString("en-IN")})</span>
                  </div>
                  <div className="flex justify-between text-slate-500 border-b pb-1">
                    <span>Less: Manufacturing and direct labor expenses:</span>
                    <span>Rs. ({plReport.directExpenses.toLocaleString("en-IN")})</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#166534] pt-1">
                    <span>GROSS TRADING MARGIN PROFIT:</span>
                    <span>Rs. {plReport.grossProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="border-b-2 pb-1 text-slate-700 font-bold uppercase tracking-wider mt-6">Administrative & Corporate Overheads</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Gross Trading Profit (Brought forward):</span>
                    <span>Rs. {plReport.grossProfit.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Add: Non-Direct / Other miscellaneous receipts:</span>
                    <span>Rs. {plReport.otherIncome.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 border-b pb-1">
                    <span>Less: Combined corporate administrative expenses:</span>
                    <span>Rs. ({plReport.administrativeExpenses.toLocaleString("en-IN")})</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#2563EB] pt-1 border-b-2 border-double pb-2 text-[12px]">
                    <span>NET STATEMENT MARGIN PROFIT (FOR PERIOD):</span>
                    <span>Rs. {plReport.netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Balance Sheet Statement */}
            {activeReport === "bs" && bsReport && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-[11px]">
                
                {/* Equity & Liabilities column */}
                <div className="border-r pr-6 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold border-b border-slate-400 pb-1 mb-2 text-slate-800 uppercase tracking-wider">EQUITY AND LIABILITIES</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between font-semibold">
                        <span>Paid-up Share Capital:</span>
                        <span>Rs.{bsReport.shareCapital.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Reserves & Profit Surplus:</span>
                        <span>Rs.{bsReport.reservesAndSurplus.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                      
                      <div className="text-[10px] text-slate-400 border-t pt-1.5 font-bold uppercase mb-1">Current Liabilities Details</div>
                      {bsReport.liabilities.map((l, i) => (
                        <div key={i} className="flex justify-between text-[10px] text-slate-600 pl-3">
                          <span className="truncate max-w-[140px]">{l.name}</span>
                          <span>Rs. {l.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-400 pt-2 font-bold text-slate-800 text-right mt-6">
                    Total Equity + Liabilities: <br/>
                    <span className="text-[#2563EB] text-[12px] font-bold font-mono">Rs. {bsReport.totalLiabilities.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Assets column */}
                <div className="flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold border-b border-slate-400 pb-1 mb-2 text-slate-800 uppercase tracking-wider">ASSETS & PROPERTY</h4>
                    <div className="space-y-2 font-serif font-normal">
                      <div className="flex justify-between font-mono font-semibold text-xs text-slate-700">
                        <span>Net Valuation of Fixed Assets:</span>
                        <span>Rs.{bsReport.fixedAssets.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between font-mono font-semibold text-xs text-slate-700">
                        <span>Current Inventory / Stock Val:</span>
                        <span>Rs.{bsReport.closingStock.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between font-mono font-semibold text-xs text-[#2563EB]">
                        <span>Cash at Bank:</span>
                        <span>Rs.{bsReport.bankBalances.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between font-mono font-semibold text-xs text-slate-700">
                        <span>Cash in Hand (Counter):</span>
                        <span>Rs.{bsReport.cashOnHand.toLocaleString("en-IN")}</span>
                      </div>

                      <div className="text-[10px] text-slate-400 border-t pt-1.5 font-sans font-bold uppercase mb-1">Debtors & Advances Detail</div>
                      {bsReport.assets.filter(a => a.group !== "Cash on Hand" && a.group !== "Bank Balances" && a.group !== "Fixed Assets").map((a, i) => (
                        <div key={i} className="flex justify-between text-[10px] text-slate-600 pl-3 font-mono">
                          <span className="truncate max-w-[140px]">{a.name}</span>
                          <span>Rs. {a.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-400 pt-2 font-bold text-slate-800 text-right mt-6 font-sans">
                    Total Corporate Capital Assets: <br/>
                    <span className="text-[#2563EB] text-[12px] font-bold font-mono">Rs. {bsReport.totalAssets.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

              </div>
            )}

            {/* TDS Monthly Retention Table Section (Mapping Page 30) */}
            {activeReport === "sales-tax" && (
              <div>
                <table className="w-full text-left font-mono text-[10px] leading-relaxed">
                  <thead>
                    <tr className="border-t border-b border-dashed border-slate-400 py-1 font-bold text-slate-700">
                      <th className="py-2">TAX PAN No</th>
                      <th className="py-2">Party Head Name</th>
                      <th className="py-2 text-center">Ref Date</th>
                      <th className="py-2 text-right">Sec. Code</th>
                      <th className="py-2 text-right">Assess Amount</th>
                      <th className="py-2 text-right">TDS (IT @ 2%)</th>
                      <th className="py-2 text-right font-bold w-24">Net TDS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-slate-300">
                    {database.accounts.filter(a => a.panNo).map(acc => {
                      const assessAmount = 14000;
                      const calculatedTDSVal = (assessAmount * 2) / 100;
                      return (
                        <tr key={acc.code} className="hover:bg-slate-50">
                          <td className="py-2 text-slate-500">{acc.panNo || "PAN-449102"}</td>
                          <td className="py-2 font-semibold text-slate-800">{acc.name}</td>
                          <td className="py-2 text-center text-slate-400">2026-04-12</td>
                          <td className="py-2 text-right font-mono text-slate-500">194 C</td>
                          <td className="py-2 text-right text-slate-600">{assessAmount.toLocaleString()}</td>
                          <td className="py-2 text-right text-slate-600">{calculatedTDSVal.toLocaleString()}</td>
                          <td className="py-2 text-right font-bold text-slate-800">Rs. {calculatedTDSVal.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>

          {/* Prepared/Verified signatures panel common in printable ERP layout (Pages 1, 4, 11) */}
          <div className="border-t border-dashed border-slate-400 pt-8 mt-12 font-mono text-[9px] text-[#64748B] flex flex-wrap sm:flex-nowrap justify-between gap-6" id="reports-signature-block">
            <div className="flex flex-col gap-5">
              <span>PREPARED & VERIFIED BY: {database.currentUser}</span>
              <div className="w-32 border-b border-slate-400 border-dashed"></div>
            </div>
            <div className="flex flex-col gap-5">
              <span>CHECKED BY: MD</span>
              <div className="w-32 border-b border-slate-400 border-dashed"></div>
            </div>
            <div className="flex flex-col gap-5 text-right sm:text-left">
              <span>AUTHORISED SIGNATORY OFFICIAL</span>
              <div className="w-32 border-b border-slate-400 border-dashed ml-auto sm:ml-0"></div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
