import React, { useState, useEffect, useMemo } from "react";
import { 
  Send, 
  Server, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  FileText, 
  Check, 
  Clock, 
  Building2,
  Filter,
  UserCheck
} from "lucide-react";
import { getTallyStatus, postToTally } from "../../api/voucherApi.js";
import { getVoucherShortDesc } from "../../utils/voucherNumbering.js";

export default function TallyPosting({ database, onSaveVoucher, currentUser }) {
  // Current date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Date filtering states
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [filterMode, setFilterMode] = useState("single"); // "single" | "all"
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoucherIds, setSelectedVoucherIds] = useState([]);
  
  // Department prefix
  const [department, setDepartment] = useState("Production");

  // Tally Prime connection state
  const [tallyStatus, setTallyStatus] = useState({
    loading: false,
    reachable: false,
    company: null,
    error: null
  });

  // Posting runtime status
  const [isPosting, setIsPosting] = useState(false);
  const [activePostingVoucher, setActivePostingVoucher] = useState(null);
  const [lastPostingResult, setLastPostingResult] = useState(null);

  // Active operator name
  const operatorName = currentUser || "Authorized Operator";

  // Check Tally Prime connection on mount
  const checkTallyConnection = async () => {
    setTallyStatus({ loading: true, reachable: false, company: null, error: null });
    try {
      const res = await getTallyStatus();
      const data = res.data || res;
      setTallyStatus({
        loading: false,
        reachable: !!data.reachable,
        company: data.company || null,
        error: data.error || null
      });
    } catch (err) {
      setTallyStatus({
        loading: false,
        reachable: false,
        company: null,
        error: err.response?.data?.error || err.message || "Cannot connect to Tally Prime on port 9000"
      });
    }
  };

  useEffect(() => {
    checkTallyConnection();
  }, []);

  // Filter Journal Vouchers based on selected date and search term
  const filteredVouchers = useMemo(() => {
    const list = (database?.vouchers || []).filter(v => v.type === "JV");

    return list.filter(v => {
      // Date filter
      if (filterMode === "single" && selectedDate) {
        if (v.voucherDate !== selectedDate) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const no = String(v.voucherNo || "").toLowerCase();
        const narr = String(v.narration || "").toLowerCase();
        const shortDesc = String(v.shortDesc || "").toLowerCase();
        const hasAccount = (v.items || []).some(it => 
          String(it.accountName || "").toLowerCase().includes(q) ||
          String(it.accountCode || "").toLowerCase().includes(q)
        );
        if (!no.includes(q) && !narr.includes(q) && !shortDesc.includes(q) && !hasAccount) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.voucherDate || 0) - new Date(a.voucherDate || 0));
  }, [database?.vouchers, selectedDate, filterMode, searchTerm]);

  // Toggle selection
  const handleToggleSelect = (id) => {
    setSelectedVoucherIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedVoucherIds.length === filteredVouchers.length) {
      setSelectedVoucherIds([]);
    } else {
      setSelectedVoucherIds(filteredVouchers.map(v => v.id));
    }
  };

  // Post single voucher to Tally
  const postSingleVoucher = async (voucher) => {
    setIsPosting(true);
    setActivePostingVoucher(voucher.voucherNo);
    setLastPostingResult(null);

    try {
      const res = await postToTally({
        voucher,
        department
      });
      const data = res.data || res;

      if (data.success) {
        // Update local voucher record with posting stamp
        const updatedVoucher = {
          ...voucher,
          tallyPosted: true,
          tallyPostedBy: operatorName,
          tallyPostedAt: new Date().toLocaleTimeString() + ", " + new Date().toLocaleDateString(),
          payload: {
            ...(voucher.payload || {}),
            tallyStatus: "POSTED",
            tallyPostedBy: operatorName,
            tallyPostedAt: new Date().toISOString()
          }
        };
        if (onSaveVoucher) {
          await onSaveVoucher(updatedVoucher);
        }

        setLastPostingResult({
          success: true,
          voucherNo: voucher.voucherNo,
          operator: operatorName,
          message: data.message || `Voucher ${voucher.voucherNo} posted successfully!`,
          createdLedgers: data.createdLedgers || []
        });
      } else {
        setLastPostingResult({
          success: false,
          voucherNo: voucher.voucherNo,
          operator: operatorName,
          error: data.error || "Tally returned an error while posting"
        });
      }
    } catch (err) {
      setLastPostingResult({
        success: false,
        voucherNo: voucher.voucherNo,
        operator: operatorName,
        error: err.response?.data?.error || err.message || "Failed to communicate with Tally"
      });
    } finally {
      setIsPosting(false);
      setActivePostingVoucher(null);
    }
  };

  // Batch post all selected vouchers
  const postSelectedVouchers = async () => {
    const toPost = filteredVouchers.filter(v => selectedVoucherIds.includes(v.id));
    if (toPost.length === 0) return;

    for (const voucher of toPost) {
      await postSingleVoucher(voucher);
    }
    setSelectedVoucherIds([]);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      
      {/* Top Header */}
      <div className="p-6 bg-white border-b border-slate-200 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Send className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Tally Prime ERP Posting</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select a date to fetch approved Journal Vouchers and post directly to Tally Prime.
            </p>
          </div>

          {/* Right Status Indicators: Operator + Tally Connection */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Operator Badge ("Who is Posting") */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
              <span className="text-base">👔</span>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none">
                  Posting Operator
                </span>
                <span className="text-xs font-extrabold text-slate-800">
                  {operatorName}
                </span>
              </div>
            </div>

            {/* Tally Reachability Card */}
            <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-semibold ${
              tallyStatus.loading ? "bg-slate-50 border-slate-200 text-slate-600" :
              tallyStatus.reachable ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
              "bg-rose-50 border-rose-200 text-rose-800"
            }`}>
              <div className="flex items-center gap-1.5">
                <Server className="w-4 h-4" />
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider block leading-none">Tally Prime (Port 9000)</span>
                  <span className="text-xs font-bold truncate max-w-[170px] block">
                    {tallyStatus.loading ? "Checking status..." :
                     tallyStatus.reachable ? (tallyStatus.company || "Connected") : "Disconnected"}
                  </span>
                </div>
              </div>
              <button 
                onClick={checkTallyConnection} 
                disabled={tallyStatus.loading}
                className="ml-1 p-1 hover:bg-white/60 rounded-md transition-all cursor-pointer" 
                title="Refresh Tally Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${tallyStatus.loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Live Operator Posting Banner */}
        {isPosting && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-bold flex items-center gap-2.5 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Posting voucher <b>{activePostingVoucher}</b> to Tally Prime by operator: <b>{operatorName}</b>...</span>
          </div>
        )}

        {/* Last Posting Result Notification */}
        {lastPostingResult && !isPosting && (
          <div className={`mt-4 p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
            lastPostingResult.success 
              ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}>
            <div className="flex items-start gap-2">
              {lastPostingResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold">
                  {lastPostingResult.success 
                    ? `Voucher ${lastPostingResult.voucherNo} posted to Tally by ${lastPostingResult.operator}!`
                    : `Failed to post voucher ${lastPostingResult.voucherNo}: ${lastPostingResult.error}`}
                </div>
                {lastPostingResult.createdLedgers?.length > 0 && (
                  <div className="mt-1 text-[11px] opacity-80">
                    Ledgers: {lastPostingResult.createdLedgers.join(", ")}
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => setLastPostingResult(null)}
              className="text-slate-400 hover:text-slate-600 font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Date Filter & Control Bar */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Left: Date Selector */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" /> Date:
          </span>

          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setFilterMode("single");
            }}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white outline-none focus:border-blue-600"
          />

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button 
              type="button"
              onClick={() => {
                setSelectedDate(todayStr);
                setFilterMode("single");
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                filterMode === "single" && selectedDate === todayStr 
                  ? "bg-white text-blue-600 shadow-xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button 
              type="button"
              onClick={() => {
                const yest = new Date();
                yest.setDate(yest.getDate() - 1);
                setSelectedDate(yest.toISOString().split("T")[0]);
                setFilterMode("single");
              }}
              className="px-2.5 py-1 rounded text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Yesterday
            </button>
            <button 
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                filterMode === "all" 
                  ? "bg-white text-blue-600 shadow-xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Dates
            </button>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Dept Prefix:</span>
            <input 
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Production"
              className="w-24 border border-slate-200 rounded px-2 py-1 text-[11px] bg-slate-50"
            />
          </div>
        </div>

        {/* Right: Search & Batch Action Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search voucher or buyer..."
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none w-48"
            />
          </div>

          {selectedVoucherIds.length > 0 && (
            <button
              onClick={postSelectedVouchers}
              disabled={isPosting || !tallyStatus.reachable}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                isPosting || !tallyStatus.reachable
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Post Selected ({selectedVoucherIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Main Vouchers Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input 
                    type="checkbox"
                    checked={filteredVouchers.length > 0 && selectedVoucherIds.length === filteredVouchers.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="p-3">Voucher No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Type / Category</th>
                <th className="p-3">Narration / Account Head</th>
                <th className="p-3 text-right">Debit (₹)</th>
                <th className="p-3 text-right">Credit (₹)</th>
                <th className="p-3 text-center">Tally Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVouchers.map((voucher) => {
                const isSelected = selectedVoucherIds.includes(voucher.id);
                const shortDesc = getVoucherShortDesc(voucher);
                const isPosted = voucher.tallyPosted || voucher.payload?.tallyStatus === "POSTED";
                const postedBy = voucher.tallyPostedBy || voucher.payload?.tallyPostedBy;
                const postedAt = voucher.tallyPostedAt || voucher.payload?.tallyPostedAt;

                const totalDebit = (voucher.items || []).reduce((sum, it) => sum + (parseFloat(it.debit) || 0), 0);
                const totalCredit = (voucher.items || []).reduce((sum, it) => sum + (parseFloat(it.credit) || 0), 0);

                return (
                  <tr key={voucher.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}>
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(voucher.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {voucher.voucherNo}
                    </td>
                    <td className="p-3 font-semibold text-slate-600">
                      {voucher.voucherDate}
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                        shortDesc === "WASTE SALE" ? "bg-emerald-100 text-emerald-800" :
                        shortDesc === "TDS ADJ" ? "bg-purple-100 text-purple-800" :
                        shortDesc === "TAX ADJ" ? "bg-amber-100 text-amber-800" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {shortDesc}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs truncate" title={voucher.narration}>
                      {voucher.narration || "General Journal Entry"}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800">
                      {totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800">
                      {totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      {isPosted ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> POSTED
                          </span>
                          {postedBy && (
                            <span className="text-[9px] text-slate-400 mt-0.5">by {postedBy}</span>
                          )}
                        </div>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                          READY TO POST
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => postSingleVoucher(voucher)}
                        disabled={isPosting || !tallyStatus.reachable}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1 shadow-xs transition-all ${
                          isPosting || !tallyStatus.reachable
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        }`}
                        title={tallyStatus.reachable ? "Send XML voucher to Tally Prime" : "Tally Prime is not reachable"}
                      >
                        <Send className="w-3 h-3" />
                        {isPosted ? "Repost" : "Post to Tally"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredVouchers.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <span>No Journal Vouchers found for {filterMode === "single" ? `date ${selectedDate}` : "selected criteria"}.</span>
                      <span className="text-xs text-slate-400">Change the date above or create a new Journal Voucher.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
