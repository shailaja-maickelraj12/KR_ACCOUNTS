import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, FileText, Check, AlertCircle } from "lucide-react";

export default function CreditNote({ database, onSaveVoucher, onDeleteVoucher, onPrint }) {
  const [vouchersList, setVouchersList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Header State
  const [voucherId, setVoucherId] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [billNo, setBillNo] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Grid State
  const [items, setItems] = useState([
    { id: "L1", accountCode: "", accountName: "", narration: "", credit: 0, debit: 0 }
  ]);

  // Load and filter notes
  useEffect(() => {
    const list = (database.vouchers || []).filter(v => v.type === "CN");
    setVouchersList(list);
  }, [database]);

  const loadVoucher = (v) => {
    setVoucherId(v.id);
    setVoucherNo(v.voucherNo);
    setVoucherDate(v.voucherDate);
    setBillNo(v.billNo || "");
    setBillDate(v.billDate || v.voucherDate);
    
    if (v.items && v.items.length > 0) {
      setItems(v.items.map(it => ({
        id: it.id,
        accountCode: it.accountCode,
        accountName: it.accountName,
        narration: it.narration || "",
        credit: parseFloat(it.credit) || 0,
        debit: parseFloat(it.debit) || 0
      })));
    } else {
      setItems([{ id: "L1", accountCode: "", accountName: "", narration: "", credit: 0, debit: 0 }]);
    }
    setIsModalOpen(true);
  };

  const clearForm = () => {
    setVoucherId("");
    const maxNo = vouchersList.reduce((max, current) => {
      const parsed = parseInt(current.voucherNo);
      return isNaN(parsed) ? max : Math.max(max, parsed);
    }, 0);
    setVoucherNo(String(maxNo + 1));
    setVoucherDate(new Date().toISOString().split('T')[0]);
    setBillNo("");
    setBillDate(new Date().toISOString().split('T')[0]);
    setItems([{ id: "L1", accountCode: "", accountName: "", narration: "", credit: 0, debit: 0 }]);
  };

  const openNewVoucher = () => {
    clearForm();
    setIsModalOpen(true);
  };

  const addLine = () => {
    setItems([...items, { id: "LINE_" + Date.now(), accountCode: "", accountName: "", narration: "", credit: 0, debit: 0 }]);
  };

  const removeLine = (id) => {
    if (items.length <= 1) return;
    setItems(items.filter(it => it.id !== id));
  };

  const updateLine = (id, field, value) => {
    setItems(prevItems => prevItems.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: value };
      
      if (field === "accountCode") {
        const acc = database.accounts.find(a => a.code === value);
        if (acc) updated.accountName = acc.name;
      }
      return updated;
    }));
  };

  const totalCredit = items.reduce((sum, it) => sum + (parseFloat(it.credit) || 0), 0);
  const totalDebit = items.reduce((sum, it) => sum + (parseFloat(it.debit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSave = () => {
    if (!voucherNo) return alert("Please specify a Voucher Number.");
    if (!isBalanced) return alert("Total Debit must equal Total Credit.");
    
    const validLines = items.filter(it => (it.accountCode || it.accountName) && (it.debit > 0 || it.credit > 0));
    if (validLines.length === 0) return alert("Please enter at least one valid line item.");

    const payload = {
      id: voucherId || undefined,
      voucherNo,
      voucherDate,
      billNo,
      billDate,
      type: "CN",
      narration: validLines[0]?.narration || "Credit Note Entry",
      items: validLines,
      totalAmount: totalDebit
    };

    onSaveVoucher(payload);
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC] min-h-0">
      
      <div className="p-6 bg-white border-b border-[#E2E8F0] flex items-center justify-between gap-4 shrink-0">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">Credit Note Register</h3>
          <p className="text-[10px] text-[#64748B] mt-1">Manage sales returns, discount adjustments, and credit corrections.</p>
        </div>
        <button onClick={openNewVoucher} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer">
          <Plus className="w-4 h-4" /> Add Credit Note
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-[#E2E8F0] sticky top-0 z-10">
              <tr className="text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3 w-32 bg-slate-50">Voucher No</th>
                <th className="p-3 w-32 bg-slate-50">Date</th>
                <th className="p-3 bg-slate-50">Reference Bill No</th>
                <th className="p-3 text-right w-32 bg-slate-50">Amount</th>
                <th className="p-3 text-center w-24 bg-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {vouchersList.map((v, idx) => (
                <tr key={v.id} onClick={() => loadVoucher(v)} className={`cursor-pointer hover:bg-teal-50 ${idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}>
                  <td className="p-3 font-mono font-bold text-teal-600">{v.voucherNo}</td>
                  <td className="p-3 font-mono text-slate-600">{v.voucherDate}</td>
                  <td className="p-3 text-slate-800 font-semibold">{v.billNo || "-"}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-700">{(v.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); loadVoucher(v); }} className="text-slate-400 hover:text-teal-600"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteVoucher(v.id); }} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {vouchersList.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">No Credit Notes found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/60 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white border border-[#E2E8F0] rounded-lg shadow-xl flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center rounded-t-lg">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{voucherId ? "Edit Credit Note" : "New Credit Note"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              
              {/* Section 1: Header */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-[#1E293B]">
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Voucher No</label>
                  <input type="text" value={voucherNo} onChange={e => setVoucherNo(e.target.value)} className="p-2 border border-slate-200 bg-slate-50 rounded font-mono outline-none focus:border-teal-500" />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Date</label>
                  <input type="date" value={voucherDate} onChange={e => { setVoucherDate(e.target.value); setBillDate(e.target.value); }} className="p-2 border border-slate-200 rounded font-mono outline-none focus:border-teal-500" />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Bill No</label>
                  <input type="text" value={billNo} onChange={e => setBillNo(e.target.value)} className="p-2 border border-slate-200 rounded outline-none focus:border-teal-500" />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Date</label>
                  <input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="p-2 border border-slate-200 font-mono rounded outline-none focus:border-teal-500" />
                </div>
                <div className="col-span-2 md:col-span-4 flex justify-end">
                  <button className="text-[10px] text-blue-600 font-bold hover:underline">F1 - To add new ledger</button>
                </div>
              </div>

              {/* Section 2: Grid */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs text-left bg-white border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-2 border-r">Acc. Description</th>
                      <th className="p-2 border-r">Narration</th>
                      <th className="p-2 text-right w-32 border-r">Credit</th>
                      <th className="p-2 text-right w-32">Debit</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => (
                      <tr key={it.id} className="hover:bg-slate-50">
                        <td className="p-1 border-r">
                          <select value={it.accountCode} onChange={e => updateLine(it.id, "accountCode", e.target.value)} className="w-full p-1.5 border border-transparent hover:border-slate-200 rounded outline-none focus:border-teal-500 bg-transparent font-semibold">
                            <option value="">-- Select Ledger --</option>
                            {database.accounts.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                          </select>
                        </td>
                        <td className="p-1 border-r"><input type="text" value={it.narration} onChange={e => updateLine(it.id, "narration", e.target.value)} className="w-full p-1.5 border border-transparent hover:border-slate-200 rounded outline-none focus:border-teal-500 bg-transparent" placeholder="Particulars..." /></td>
                        <td className="p-1 border-r"><input type="number" step="any" value={it.credit || ""} onChange={e => { updateLine(it.id, "credit", e.target.value); if(parseFloat(e.target.value) > 0) updateLine(it.id, "debit", 0); }} className="w-full p-1.5 border border-transparent hover:border-slate-200 rounded font-mono text-right outline-none focus:border-teal-500 bg-transparent text-orange-600 font-bold" /></td>
                        <td className="p-1"><input type="number" step="any" value={it.debit || ""} onChange={e => { updateLine(it.id, "debit", e.target.value); if(parseFloat(e.target.value) > 0) updateLine(it.id, "credit", 0); }} className="w-full p-1.5 border border-transparent hover:border-slate-200 rounded font-mono text-right outline-none focus:border-teal-500 bg-transparent text-emerald-600 font-bold" /></td>
                        <td className="p-1 text-center"><button onClick={() => removeLine(it.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-slate-50 p-1.5 border-t border-slate-200 flex items-center justify-between">
                  <button onClick={addLine} className="text-[11px] text-teal-600 font-bold hover:underline ml-2">+ Add Row</button>
                </div>
              </div>

              {/* Section 3: Totals */}
              <div className="flex justify-end items-center text-xs font-semibold">
                <div className="flex items-center gap-4">
                  <span className="uppercase text-[10px] text-slate-500 font-bold tracking-widest mr-2">Total</span>
                  <input type="number" value={totalCredit} readOnly className="w-32 p-2 border border-slate-200 bg-slate-50 rounded font-mono text-right font-bold text-orange-600" />
                  <input type="number" value={totalDebit} readOnly className="w-32 p-2 border border-slate-200 bg-slate-50 rounded font-mono text-right font-bold text-emerald-600" />
                </div>
              </div>
            </div>
            
            {/* Section 4: Actions */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center rounded-b-lg">
              <button type="button" onClick={() => voucherId ? onPrint(database.vouchers.find(v => v.id === voucherId)) : alert("Please save first.")} className="bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded text-xs font-bold flex items-center gap-1 shadow-sm"><FileText className="w-3.5 h-3.5" /> Report</button>
              <div className="flex gap-2">
                <button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-2 rounded text-xs font-bold shadow-sm transition-colors">Save</button>
                <button onClick={() => setIsModalOpen(false)} className="bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded text-xs font-bold transition-colors hover:bg-slate-50">Cancel</button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
