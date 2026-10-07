import React, { useState, useEffect, useMemo } from "react";
import { 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Truck, 
  Search, 
  ExternalLink, 
  AlertCircle, 
  Eye, 
  X, 
  Zap, 
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ChevronRight
} from "lucide-react";
import { getExternalInvoices, syncExternalInvoice, syncAllExternalInvoices } from "../../database";

export default function ExternalInvoiceSync({ database, onNavigateToVoucher }) {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({ total: 0, posted: 0, pending: 0 });
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [batchSyncing, setBatchSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, PENDING, POSTED
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Load Invoices from Backend Integration Endpoint
  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await getExternalInvoices({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100
      });
      if (res && res.invoices) {
        setInvoices(res.invoices);
        setSummary(res.summary || {
          total: res.invoices.length,
          posted: res.invoices.filter(i => i.syncStatus === "POSTED").length,
          pending: res.invoices.filter(i => i.syncStatus === "PENDING").length
        });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to load external invoices: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [startDate, endDate]);

  // Sync a single invoice
  const handleSyncSingle = async (inv) => {
    setSyncingId(inv.id || inv.invoiceNo);
    setFeedback(null);
    try {
      const res = await syncExternalInvoice(inv);
      if (res.success) {
        setFeedback({ 
          type: "success", 
          message: res.message || `Invoice #${inv.invoiceNo} successfully posted as Journal Voucher ${res.voucher?.voucherNo || ""}` 
        });
        await loadInvoices();
      } else {
        setFeedback({ type: "error", message: res.message || "Failed to sync invoice" });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Sync error: " + err.message });
    } finally {
      setSyncingId(null);
    }
  };

  // Sync all pending invoices in batch
  const handleSyncAll = async () => {
    if (!confirm(`Are you sure you want to sync all ${summary.pending} pending invoices to Journal Vouchers?`)) return;
    setBatchSyncing(true);
    setFeedback(null);
    try {
      const res = await syncAllExternalInvoices();
      if (res.success) {
        setFeedback({ 
          type: "success", 
          message: res.message || `Successfully synced ${res.successCount} invoices!` 
        });
        await loadInvoices();
      } else {
        setFeedback({ type: "error", message: res.message || "Batch sync failed." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Batch sync error: " + err.message });
    } finally {
      setBatchSyncing(false);
    }
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Status filter
      if (statusFilter !== "ALL" && inv.syncStatus !== statusFilter) return false;
      
      // Search filter
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const buyerName = inv.buyer?.accountName?.toLowerCase() || "";
      const invNo = String(inv.invoiceNo || "").toLowerCase();
      const vehicle = inv.dispatchDetails?.vehicleNo?.toLowerCase() || "";
      const eway = inv.dispatchDetails?.ewayBillNo?.toLowerCase() || "";
      
      return buyerName.includes(term) || invNo.includes(term) || vehicle.includes(term) || eway.includes(term);
    });
  }, [invoices, statusFilter, searchTerm]);

  // Total Invoiced Value calculation
  const totalValue = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (parseFloat(inv.financials?.invoiceValue) || 0), 0);
  }, [invoices]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#F8FAFC] min-h-0" id="external-invoice-sync-root">
      
      {/* Top Header & Metrics Bar */}
      <div className="p-6 bg-white border-b border-[#E2E8F0] shrink-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-[#2563EB] rounded-lg">
                <Zap className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  External Sales Invoices Integration
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                    Live ERP Bridge
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  Automatically fetch Waste Sales invoices from Raw Material ERP and post double-entry Journal Vouchers.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadInvoices}
              disabled={loading || batchSyncing}
              className="p-2 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Refresh Invoices"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#2563EB]" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleSyncAll}
              disabled={batchSyncing || summary.pending === 0}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {batchSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Syncing All...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Sync All Pending ({summary.pending})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3 rounded-lg text-xs font-medium mb-4 flex items-center justify-between ${
            feedback.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Invoices</div>
            <div className="text-lg font-bold text-slate-800">{summary.total}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">₹{totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          </div>

          <div 
            onClick={() => setStatusFilter("POSTED")}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              statusFilter === "POSTED" ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20" : "bg-white border-slate-200 hover:border-emerald-200"
            }`}
          >
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Posted to JV
            </div>
            <div className="text-lg font-bold text-emerald-700">{summary.posted}</div>
            <div className="text-[10px] text-emerald-600/80 mt-0.5">Active in Ledger</div>
          </div>

          <div 
            onClick={() => setStatusFilter("PENDING")}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              statusFilter === "PENDING" ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500/20" : "bg-white border-slate-200 hover:border-amber-200"
            }`}
          >
            <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Sync
            </div>
            <div className="text-lg font-bold text-amber-700">{summary.pending}</div>
            <div className="text-[10px] text-amber-600/80 mt-0.5">Ready to Post</div>
          </div>

          <div 
            onClick={() => setStatusFilter("ALL")}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              statusFilter === "ALL" ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20" : "bg-white border-slate-200 hover:border-blue-200"
            }`}
          >
            <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Filter Status
            </div>
            <div className="text-xs font-bold text-blue-800 capitalize mt-1.5">{statusFilter.toLowerCase()} Invoices</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by Invoice No, Buyer, Vehicle, or E-Way Bill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:ring-1 focus:ring-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-1 border border-slate-200 rounded text-xs bg-white text-slate-700 outline-none"
            />
            <span className="text-slate-400">to</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-1 border border-slate-200 rounded text-xs bg-white text-slate-700 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Invoices Table Area */}
      <div className="flex-1 p-6 flex flex-col min-h-0 overflow-hidden" id="invoices-table-container">
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-xs flex-1 flex flex-col min-h-0">
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-[#E2E8F0]">
                <tr className="bg-slate-50 text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 bg-slate-50">Inv No & Date</th>
                  <th className="p-3.5 bg-slate-50">Buyer / Customer</th>
                  <th className="p-3.5 text-right bg-slate-50">Assessable (₹)</th>
                  <th className="p-3.5 text-right bg-slate-50">GST & TCS (₹)</th>
                  <th className="p-3.5 text-right bg-slate-50">Total Value (₹)</th>
                  <th className="p-3.5 bg-slate-50">Dispatch Details</th>
                  <th className="p-3.5 text-center bg-slate-50">Sync Status</th>
                  <th className="p-3.5 text-center bg-slate-50">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredInvoices.map((inv) => {
                  const isSyncing = syncingId === (inv.id || inv.invoiceNo);
                  const isPosted = inv.syncStatus === "POSTED";
                  const fin = inv.financials || {};
                  const dispatch = inv.dispatchDetails || {};
                  const buyer = inv.buyer || {};

                  return (
                    <tr key={inv.id || inv.invoiceNo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-[#2563EB] text-xs">#{inv.invoiceNo}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{inv.invoiceDate}</div>
                        <span className="inline-block mt-1 text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                          {inv.invoiceType || "WASTE SALE"}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{buyer.accountName || "Unknown Buyer"}</div>
                        <div className="text-[10px] text-slate-500">{buyer.address2 || buyer.address1 || "-"}</div>
                        {buyer.gstin && (
                          <div className="text-[9px] font-mono text-slate-400 mt-0.5">GST: {buyer.gstin}</div>
                        )}
                      </td>

                      <td className="p-3.5 text-right font-mono font-medium text-slate-700">
                        {parseFloat(fin.assessableValue || fin.subTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3.5 text-right font-mono text-[11px] text-slate-600">
                        <div>GST: ₹{parseFloat(fin.gstAmount || fin.igstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                        {parseFloat(fin.tcsRs || 0) > 0 && (
                          <div className="text-[10px] text-slate-400">TCS: ₹{parseFloat(fin.tcsRs).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                        )}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        ₹{parseFloat(fin.invoiceValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        {parseFloat(fin.roundOff || 0) !== 0 && (
                          <div className="text-[9px] text-slate-400 font-normal">R/O: {fin.roundOff}</div>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-600">
                        <div className="flex items-center gap-1 font-semibold text-[11px] text-slate-700">
                          <Truck className="w-3 h-3 text-slate-400" />
                          <span>{dispatch.vehicleNo || "Direct"}</span>
                        </div>
                        {dispatch.transport && <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{dispatch.transport}</div>}
                        {dispatch.ewayBillNo && <div className="text-[9px] font-mono text-blue-600 mt-0.5">E-Way: {dispatch.ewayBillNo}</div>}
                      </td>

                      <td className="p-3.5 text-center">
                        {isPosted ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> POSTED
                            </span>
                            {inv.localVoucherNo && (
                              <span className="font-mono text-[9px] text-slate-500 mt-0.5">{inv.localVoucherNo}</span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 border border-slate-200 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                            title="View Invoice Breakdown"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isPosted ? (
                            <button
                              onClick={() => {
                                if (onNavigateToVoucher) {
                                  onNavigateToVoucher(inv.localVoucherNo || `JV-INV-${inv.invoiceNo}`);
                                } else {
                                  alert(`Journal Voucher: ${inv.localVoucherNo || "JV-INV-" + inv.invoiceNo} is recorded in General Ledger.`);
                                }
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="View Journal Voucher"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> View JV
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSyncSingle(inv)}
                              disabled={isSyncing}
                              className="px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                            >
                              {isSyncing ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Zap className="w-3 h-3" />
                              )}
                              Post to JV
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredInvoices.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs">
                {loading ? "Fetching external invoices..." : "No external invoices found for the selected criteria."}
              </div>
            )}
          </div>

          {/* Table Footer Summary */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
            <div>
              Showing <span className="font-semibold text-slate-800">{filteredInvoices.length}</span> invoices
            </div>
            <div className="flex items-center gap-4 text-slate-500 text-[11px]">
              <span>Synced: <strong className="text-emerald-700">{summary.posted}</strong></span>
              <span>Pending: <strong className="text-amber-700">{summary.pending}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Details Dialog Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-[#1E293B]/40 flex items-center justify-center z-50 p-4" id="invoice-detail-modal">
          <div className="bg-white rounded-lg shadow-xl border border-[#E2E8F0] p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-4 border-b border-[#E2E8F0] mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>📄 Invoice #{selectedInvoice.invoiceNo}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    selectedInvoice.syncStatus === "POSTED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {selectedInvoice.syncStatus}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Date: {selectedInvoice.invoiceDate} | {selectedInvoice.invoiceType}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-red-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buyer & Dispatch Section */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" /> Buyer Information
                </div>
                <div className="font-semibold text-slate-900">{selectedInvoice.buyer?.accountName}</div>
                <div className="text-slate-500 mt-0.5">{selectedInvoice.buyer?.address1}, {selectedInvoice.buyer?.address2}</div>
                {selectedInvoice.buyer?.gstin && <div className="font-mono text-slate-600 mt-1">GSTIN: {selectedInvoice.buyer?.gstin}</div>}
                {selectedInvoice.buyer?.mobileNo && <div className="text-slate-500">📞 {selectedInvoice.buyer?.mobileNo}</div>}
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600" /> Dispatch & Transport
                </div>
                <div>Vehicle: <strong className="text-slate-800">{selectedInvoice.dispatchDetails?.vehicleNo || "N/A"}</strong></div>
                <div>Transport: <strong className="text-slate-800">{selectedInvoice.dispatchDetails?.transport || "N/A"}</strong></div>
                <div>LR No: <strong className="text-slate-800">{selectedInvoice.dispatchDetails?.lrNo || "N/A"}</strong></div>
                <div>E-Way Bill: <strong className="font-mono text-blue-600">{selectedInvoice.dispatchDetails?.ewayBillNo || "N/A"}</strong></div>
              </div>
            </div>

            {/* Bale Items List */}
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-700 mb-2">Bale Items & Weight Breakdown</div>
              <table className="w-full text-left text-xs border border-slate-200 rounded-md overflow-hidden">
                <thead className="bg-slate-100 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-2">Bale No</th>
                    <th className="p-2">Lot No</th>
                    <th className="p-2">Waste Description</th>
                    <th className="p-2 text-right">Net Wt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(selectedInvoice.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 font-mono text-blue-600">{item.baleNo}</td>
                      <td className="p-2">{item.lotNo}</td>
                      <td className="p-2 font-medium text-slate-800">{item.wasteName}</td>
                      <td className="p-2 text-right font-mono">{item.netWt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="p-3.5 bg-blue-50/50 rounded-lg border border-blue-100 text-xs">
              <div className="font-bold text-slate-800 mb-2">Financials & Double-Entry Accounting Matrix</div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Assessable Sales Value (Credit Waste Sales):</span>
                  <span className="font-mono font-semibold">₹{parseFloat(selectedInvoice.financials?.assessableValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Output GST Tax (Credit GST Liability):</span>
                  <span className="font-mono font-semibold">₹{parseFloat(selectedInvoice.financials?.gstAmount || selectedInvoice.financials?.igstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                {parseFloat(selectedInvoice.financials?.tcsRs || 0) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>TCS on Sales (Credit TCS Liability):</span>
                    <span className="font-mono font-semibold">₹{parseFloat(selectedInvoice.financials?.tcsRs).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {parseFloat(selectedInvoice.financials?.roundOff || 0) !== 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Round Off:</span>
                    <span className="font-mono font-semibold">₹{selectedInvoice.financials?.roundOff}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-blue-200 flex justify-between text-slate-900 font-bold text-sm">
                  <span>Total Invoice Receivable (Debit Buyer):</span>
                  <span className="font-mono text-[#2563EB]">₹{parseFloat(selectedInvoice.financials?.invoiceValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 mt-5">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 border rounded text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>

              {selectedInvoice.syncStatus === "PENDING" && (
                <button
                  type="button"
                  onClick={() => {
                    handleSyncSingle(selectedInvoice);
                    setSelectedInvoice(null);
                  }}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Zap className="w-4 h-4" /> Post to Journal Voucher
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
