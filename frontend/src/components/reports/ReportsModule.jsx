import React, { useState } from "react";

// --- SPECIFICATION CONFIGURATIONS ---
const CATEGORIES = [
  "Voucher",
  "Books",
  "Ledger",
  "Trial Balance",
  "Profit & Loss",
  "Final Accounts",
  "Sales Tax",
  "TDS & TCS",
  "Others"
];

const REPORT_TYPES = {
  "Voucher": ["Cash", "Bank", "Journal Voucher", "Contra Entry", "Debit Note", "Credit Note"],
  "Books": ["Cash Book", "Bank Book", "Day Book", "Journal Book"],
  "Ledger": ["General Ledger", "Sub Ledger", "Ledger Summary", "Ledger Group Summary"],
  "Trial Balance": ["Trial Balance", "Day Book"],
  "Profit & Loss": ["Profit & Loss"],
  "Final Accounts": ["Trading Account", "Profit & Loss Account", "Balance Sheet"],
  "Sales Tax": ["C Form", "F Form", "H Form", "E1 Form", "C Form Purchase"],
  "TDS & TCS": ["TDS Register", "TDS Summary", "TDS Payable", "TCS Summary"],
  "Others": ["Outstanding Bills", "Reverse Bill Entries", "Account Summary", "Missing Entries", "Audit Reports"]
};

export default function ReportsModule({ database, onPrint }) {
  // State: Filters
  const [activeCategory, setActiveCategory] = useState("Ledger");
  const [activeReportType, setActiveReportType] = useState("General Ledger");

  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2026-04-30");
  const [searchAll, setSearchAll] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const [excelExport, setExcelExport] = useState(false);

  // State: Specific Filters
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedMultiAccounts, setSelectedMultiAccounts] = useState([]);

  // Handle Category Change
  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setActiveReportType(REPORT_TYPES[cat][0]); 
  };

  const handleMultiAccountChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedMultiAccounts(selected);
  };

  const handleOk = () => {
    if (activeCategory === "Ledger") {
      if (!activeReportType) {
        return alert("Please select a Report Type.");
      }
      if (!searchAll) {
        if (!selectedGroup) return alert("Please select a Ledger Group.");
        if (!selectedAccount) return alert("Please select a Ledger.");
      }
    }

    if (onPrint) {
      // Submits filter configuration to trigger separate report viewer
      onPrint({
        type: "REPORT",
        reportCategory: activeCategory,
        reportType: activeReportType,
        fromDate,
        toDate,
        selectedAccount,
        selectedGroup,
        selectedMultiAccounts,
        searchAll,
        excelExport,
        condensed
      });
    }
  };

  return (
    <div className="flex-1 p-6 bg-[#F8FAFC] overflow-y-auto min-h-0">
      <div className="max-w-4xl mx-auto bg-white border-2 border-slate-300 shadow-md p-6 font-sans text-sm text-slate-800 rounded-sm">
        
        {/* Top: Dates */}
        <div className="flex items-center gap-8 mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <label className="font-bold text-slate-700 uppercase tracking-wide text-xs">From Date:</label>
            <input 
              type="date" 
              value={fromDate} 
              onChange={e => setFromDate(e.target.value)} 
              className="border border-slate-300 p-1.5 rounded focus:border-blue-500 outline-none" 
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="font-bold text-slate-700 uppercase tracking-wide text-xs">To Date:</label>
            <input 
              type="date" 
              value={toDate} 
              onChange={e => setToDate(e.target.value)} 
              className="border border-slate-300 p-1.5 rounded focus:border-blue-500 outline-none" 
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Middle Left: Category Radios */}
          <fieldset className="border border-slate-300 p-4 md:w-1/3 rounded-sm bg-slate-50/50">
            <legend className="px-2 font-bold text-blue-800 text-xs tracking-wider">Report Category</legend>
            <div className="flex flex-col gap-3 mt-2">
              {CATEGORIES.map(cat => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold hover:text-blue-700">
                  <input 
                    type="radio" 
                    name="reportCategory" 
                    value={cat} 
                    checked={activeCategory === cat}
                    onChange={() => handleCategoryChange(cat)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  {cat}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Middle Right: Configuration */}
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Report Type Selector */}
            <fieldset className="border border-slate-300 p-4 rounded-sm">
              <legend className="px-2 font-bold text-blue-800 text-xs tracking-wider">Report Type</legend>
              <select 
                value={activeReportType} 
                onChange={e => setActiveReportType(e.target.value)}
                className="w-full border border-slate-300 p-2 rounded bg-white outline-none focus:border-blue-500 font-semibold"
              >
                {REPORT_TYPES[activeCategory].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </fieldset>

            {/* Dynamic Filters & Options */}
            <fieldset className="border border-slate-300 p-4 rounded-sm flex-1">
              <legend className="px-2 font-bold text-blue-800 text-xs tracking-wider">Filters & Options</legend>
              
              <div className="flex flex-col gap-4 mt-2">
                
                {/* Dynamic: Single Ledger Account */}
                {(["General Ledger", "Sub Ledger", "From To Party General Ledger", "From To Party Sub Ledger", "Tally Missing Entry"].includes(activeReportType)) && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Account / Ledger Head:</label>
                    <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="border border-slate-300 p-2 rounded bg-white outline-none focus:border-blue-500">
                      <option value="">-- Select Ledger Account --</option>
                      {database?.accounts?.map(a => (
                        <option key={a.code} value={a.code}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Dynamic: Multi Ledger Account (e.g., Cash Book) */}
                {(activeReportType === "Cash Book" || activeReportType === "Bank Book") && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Select Accounts (Multi-Select):</label>
                    <select multiple value={selectedMultiAccounts} onChange={handleMultiAccountChange} className="border border-slate-300 p-2 rounded bg-white outline-none focus:border-blue-500 h-28 text-xs">
                      {database?.accounts?.filter(a => activeReportType === "Cash Book" ? a.name.toUpperCase().includes("CASH") : a.name.toUpperCase().includes("BANK")).map(a => (
                        <option key={a.code} value={a.code}>{a.name}</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 italic">Hold Ctrl/Cmd to select multiple accounts.</span>
                  </div>
                )}

                {/* Dynamic: Sub Group */}
                {(activeReportType === "Sub Ledger" || activeReportType === "Sub Ledger All") && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Ledger Group:</label>
                    <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="border border-slate-300 p-2 rounded bg-white outline-none focus:border-blue-500">
                      <option value="">-- Select Group --</option>
                      {database?.subGroups?.map(g => (
                        <option key={g.id} value={g.name}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Common: Search */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-xs font-bold text-slate-600">Search All (Text):</label>
                  <input 
                    type="text" 
                    value={searchAll} 
                    onChange={e => setSearchAll(e.target.value)} 
                    className="border border-slate-300 p-2 rounded bg-white outline-none focus:border-blue-500" 
                    placeholder="Search by keywords..." 
                  />
                </div>

                {/* Common: Checkboxes */}
                <div className="flex items-center gap-6 mt-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={excelExport} 
                      onChange={e => setExcelExport(e.target.checked)} 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Excel Export
                  </label>
                  
                  {activeCategory === "Ledger" && (
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={condensed} 
                        onChange={e => setCondensed(e.target.checked)} 
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Condensed Report
                    </label>
                  )}
                </div>

              </div>
            </fieldset>
          </div>

        </div>

        {/* Bottom Actions */}
        <div className="flex justify-end items-center gap-4 mt-8 pt-5 border-t border-slate-200">
          <button 
            onClick={() => window.alert("Navigation exited / reset.")} 
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-8 py-2.5 rounded font-bold shadow-sm transition-colors text-sm"
          >
            Exit
          </button>
          <button 
            onClick={handleOk} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-2.5 rounded font-bold shadow-md transition-colors text-sm"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}