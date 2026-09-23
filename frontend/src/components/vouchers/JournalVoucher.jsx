import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash, Check, AlertCircle, Printer, Edit2, X, RefreshCw, Download } from "lucide-react";

export default function JournalVoucher({ database, onSaveVoucher, onDeleteVoucher, onPrint }) {
  const [vouchersList, setVouchersList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Memoize account options for instant rendering with 5,000+ accounts
  const accountOptions = useMemo(() => {
    return (database.accounts || []).map(acc => (
      <option key={acc.code} value={acc.code}>
        {acc.name} ({acc.code})
      </option>
    ));
  }, [database.accounts]);
  
  // Active Voucher states
  const [voucherId, setVoucherId] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [billNo, setBillNo] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState("");
  
  const [tdsEnabled, setTdsEnabled] = useState(false);
  const [stEnabled, setStEnabled] = useState(false);
  const [seTaxEnabled, setSeTaxEnabled] = useState(false);
  const [tdsAmount, setTdsAmount] = useState("");
  const [sTaxAmount, setSTaxAmount] = useState("");
  const [mainGroup, setMainGroup] = useState("");
  const [subGroup, setSubGroup] = useState("");

  const [items, setItems] = useState([
    { id: "L1", accountCode: "", accountName: "", narration: "", debit: "", credit: "" }
  ]);

  // Load vouchers from state
  useEffect(() => {
    const jvs = (database.vouchers || []).filter(v => v.type === "JV");
    setVouchersList(jvs);
  }, [database]);

  // Keep preset worksheet accounts in template strictly aligned to dynamic database.accounts
  useEffect(() => {
    if (database.accounts && database.accounts.length > 0) {
      setItems(prevItems => {
        return prevItems.map(item => {
          if (!item.accountCode) return item;
          const exists = database.accounts.some(a => a.code === item.accountCode);
          if (!exists) {
            const match = database.accounts.find(a => a.name.toUpperCase().includes(item.accountName.toUpperCase().split(" ")[0]));
            if (match) {
              return { ...item, accountCode: match.code, accountName: match.name };
            }
            const firstAcc = database.accounts[0];
            return { ...item, accountCode: firstAcc.code, accountName: firstAcc.name };
          }
          return item;
        });
      });
    }
  }, [database.accounts]);

  // Handle Loading an existing Voucher to Edit
  const loadVoucher = (v) => {
    setVoucherId(v.id);
    setVoucherNo(v.voucherNo);
    setVoucherDate(v.voucherDate);
    setBillNo(v.billNo || "");
    setBillDate(v.billDate || v.voucherDate);
    setNarration(v.narration || "");
    setTdsEnabled(!!v.tdsEnabled);
    setStEnabled(!!v.stEnabled);
    setSeTaxEnabled(!!v.serviceTaxEnabled);
    setTdsAmount(v.tdsAmount || "");
    setSTaxAmount(v.sTaxAmount || "");
    setMainGroup(v.mainGroup || "");
    setSubGroup(v.subGroup || "");
    setItems(v.items ? v.items.map(it => ({
      ...it,
      debit: it.debit || "",
      credit: it.credit || ""
    })) : []);
    setIsModalOpen(true);
  };

  // Clear/Reset Form State
  const clearForm = () => {
    setVoucherId("");
    // auto increment voucher number
    const maxNo = vouchersList.reduce((max, current) => {
      const parsed = parseInt(current.voucherNo);
      return isNaN(parsed) ? max : Math.max(max, parsed);
    }, 0);
    setVoucherNo(String(maxNo + 1));
    setVoucherDate(new Date().toISOString().split('T')[0]);
    setBillNo("");
    setBillDate(new Date().toISOString().split('T')[0]);
    setNarration("");
    setTdsEnabled(false);
    setStEnabled(false);
    setSeTaxEnabled(false);
    setTdsAmount("");
    setSTaxAmount("");
    setMainGroup("");
    setSubGroup("");
    setItems([
      { id: "LINE_" + Date.now(), accountCode: "", accountName: "", narration: "", debit: "", credit: "" }
    ]);
  };

  const openNewVoucher = () => {
    clearForm();
    setIsModalOpen(true);
  };

  // Row Manipulation
  const addLineItem = () => {
    setItems([
      ...items,
      { id: "LINE_" + Date.now() + Math.random(), accountCode: "", accountName: "", narration: "", debit: "", credit: "" }
    ]);
  };

  const removeLineItem = (id) => {
    if (items.length <= 1) return;
    setItems(items.filter(it => it.id !== id));
  };

  const updateLineField = (id, field, value) => {
    setItems(prevItems => prevItems.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: value };
      if (field === "accountCode") {
        const found = database.accounts.find(a => a.code === value);
        updated.accountName = found ? found.name : "";
      }
      return updated;
    }));
  };

  // Totals Computing
  const totalDebit = items.reduce((sum, item) => sum + (parseFloat(item.debit) || 0), 0);
  const totalCredit = items.reduce((sum, item) => sum + (parseFloat(item.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;

  // Save Voucher Action
  const handleSave = () => {
    if (!voucherNo) {
      alert("Please enter a valid Voucher Number");
      return;
    }
    if (!isBalanced) {
      alert(`Voucher is imbalanced! Credits & Debits must match exactly. Difference: Rs. ${difference.toFixed(2)}`);
      return;
    }
    const filteredItems = items.filter(it => it.accountCode);
    if (filteredItems.length === 0) {
      alert("Please add at least one line item with a valid account.");
      return;
    }

    const payload = {
      id: voucherId || undefined,
      voucherNo,
      voucherDate,
      billNo,
      billDate,
      type: "JV",
      narration: narration || filteredItems[0]?.narration || "",
      tdsEnabled,
      stEnabled,
      serviceTaxEnabled: seTaxEnabled,
      tdsAmount: parseFloat(tdsAmount) || 0,
      sTaxAmount: parseFloat(sTaxAmount) || 0,
      mainGroup,
      subGroup,
      items: filteredItems.map(it => ({ ...it, debit: parseFloat(it.debit) || 0, credit: parseFloat(it.credit) || 0 })),
      totalAmount: totalDebit
    };

    const saved = onSaveVoucher(payload);
    setVoucherId(saved.id);
    alert(`Journal Voucher ${voucherNo} saved successfully!`);
    setIsModalOpen(false);
  };

  const triggerPrint = (id) => {
    const targetV = database.vouchers.find(v => v.id === id) || {
      voucherNo,
      voucherDate,
      billNo,
      billDate,
      narration,
      type: "JV",
      items,
      totalAmount: totalDebit,
      userName: database.currentUser
    };
    onPrint(targetV);
  };

  const handleDownloadVoucher = (v) => {
    const vNo = v.voucherNo || voucherNo;
    const vDate = v.voucherDate || voucherDate;
    const vNarration = v.narration || narration;
    const vItems = (v.items || items).filter(it => it.accountName);
    
    const tDebit = vItems.reduce((sum, item) => sum + (parseFloat(item.debit) || 0), 0);
    const tCredit = vItems.reduce((sum, item) => sum + (parseFloat(item.credit) || 0), 0);

    const itemsHtml = vItems.map(item => `
      <tr>
        <td style="padding: 5px 0;">
          ${parseFloat(item.credit) > 0 ? `&nbsp;&nbsp;To<br/>&nbsp;&nbsp;${item.accountName}` : item.accountName}
        </td>
        <td class="text-right">${parseFloat(item.debit) > 0 ? (parseFloat(item.debit) || 0).toFixed(2) : ''}</td>
        <td class="text-right">${parseFloat(item.credit) > 0 ? (parseFloat(item.credit) || 0).toFixed(2) : ''}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Bill Voucher - ${vNo}</title>
          <style>
            body { font-family: "Courier New", Courier, monospace; font-size: 14px; margin: 40px; color: #000; }
            .dashed-line { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { vertical-align: top; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .flex-between { display: flex; justify-content: space-between; }
            .mb-4 { margin-bottom: 20px; }
            .mt-4 { margin-top: 20px; }
            .signature-row { display: flex; justify-content: space-between; margin-top: 60px; font-weight: bold; }
            .payment-section { margin-top: 40px; }
            .payment-row { margin-bottom: 15px; display: flex; justify-content: space-between; }
            @media print { body { margin: 0; padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="dashed-line"></div>
          <div class="text-center" style="font-weight: bold; font-size: 18px; padding: 5px 0;">BILL VOUCHER</div>
          <div class="dashed-line"></div>
          <div class="flex-between mb-4">
            <span style="font-weight: bold;">Vou.No. ${vNo}</span>
            <span style="font-weight: bold;">Date : ${vDate}</span>
          </div>
          <div class="dashed-line"></div>
          <table>
            <thead>
              <tr>
                <th style="text-align:left; padding-bottom: 10px;">Description / Account Head</th>
                <th class="text-right" style="padding-bottom: 10px;">Debit</th>
                <th class="text-right" style="padding-bottom: 10px;">Credit</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colspan="3"><div class="dashed-line"></div></td></tr>
              ${itemsHtml}
              <tr><td colspan="3"><div class="dashed-line"></div></td></tr>
            </tbody>
            <tfoot>
              <tr>
                <td></td>
                <td class="text-right" style="font-weight: bold; padding: 5px 0;">${tDebit.toFixed(2)}</td>
                <td class="text-right" style="font-weight: bold; padding: 5px 0;">${tCredit.toFixed(2)}</td>
              </tr>
              <tr><td colspan="3"><div class="dashed-line"></div></td></tr>
            </tfoot>
          </table>
          <div class="mt-4 mb-4" style="white-space: pre-wrap;">${vNarration}</div>
          <div class="signature-row"><span>Prepared</span><span>Verified</span><span>Authorised Signatory</span></div>
          <div class="payment-section"><div class="dashed-line"></div><div class="text-center" style="font-weight: bold; font-size: 16px; padding: 5px 0;">Payment Particulars</div><div class="dashed-line"></div><div class="mt-4"><div class="payment-row"><span>Payment Vou.No. ____________</span><span>dt __/__/____</span></div><div class="payment-row"><span>Cash/Cheque/UTR No. ____________</span><span>dt __/__/____</span></div><div class="payment-row" style="justify-content: flex-start;"><span>Rs. ____________________</span></div><div class="payment-row" style="justify-content: flex-start;"><span>A/c.Head : ________________________________________</span></div><div class="text-center" style="margin-top: 80px; font-weight: bold;">Receiver Signature</div></div></div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC] min-h-0" id="jv-entry-viewport">
      <div className="p-6 bg-white border-b border-[#E2E8F0] flex items-center justify-between gap-4 shrink-0">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">Journal Voucher Register</h3>
          <p className="text-[10px] text-[#64748B] mt-1">Select a row to update it, or add a new voucher from the button.</p>
        </div>
        <button
          onClick={openNewVoucher}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Journal Voucher
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider sticky top-0 z-10">
                <th className="p-3 w-28 bg-slate-50">Short Desc</th>
                <th className="p-3 w-28 bg-slate-50">Voucher No</th>
                <th className="p-3 w-32 bg-slate-50">Voucher Date</th>
                <th className="p-3 bg-slate-50">Account Name</th>
                <th className="p-3 text-right w-32 bg-slate-50">Debit</th>
                <th className="p-3 w-28 bg-slate-50">UserName</th>
                <th className="p-3 text-center w-24 bg-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {vouchersList.map((v, index) => {
                const firstLine = v.items?.[0] || {};
                return (
                  <tr
                    key={v.id}
                    onClick={() => loadVoucher(v)}
                    className={`cursor-pointer ${index % 2 === 1 ? "bg-yellow-50" : "bg-white"} hover:bg-blue-50`}
                  >
                    <td className="p-3 font-semibold text-slate-700">JOURNAL</td>
                    <td className="p-3 font-mono text-[#2563EB] font-bold">{v.voucherNo}</td>
                    <td className="p-3 font-mono text-slate-600">{v.voucherDate}</td>
                    <td className="p-3 font-semibold text-slate-800">{firstLine.accountName || v.narration || "Journal Voucher"}</td>
                    <td className="p-3 text-right font-mono font-semibold text-slate-700">
                      {(v.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 font-bold text-slate-500">{v.userName || database.currentUser}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); loadVoucher(v); }} className="text-slate-500 hover:text-[#2563EB] cursor-pointer" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); triggerPrint(v.id); }} className="text-slate-500 hover:text-slate-800 cursor-pointer" title="Print">
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {vouchersList.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">No journal vouchers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* LEFT: Live Interactive Entry Board (Clean Minimalism styling) */}
      <div className={isModalOpen ? "fixed inset-0 z-50 bg-[#0F172A]/60 overflow-y-auto p-4" : "hidden"} id="jv-form-left">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div className="bg-white border border-[#E2E8F0] rounded-lg px-5 py-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#1E293B]">{voucherId ? "Update Journal Voucher" : "Add Journal Voucher"}</h3>
              <p className="text-[10px] text-[#64748B] mt-1">Enter debit and credit lines, then save to return to the register.</p>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        
        {/* Core Voucher Metadata Form */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-[#1E293B]">
            
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Voucher No</label>
              <input 
                type="text" 
                value={voucherNo} 
                onChange={(e) => setVoucherNo(e.target.value)}
                placeholder="e.g. 176"
                className="p-2 border border-[#E2E8F0] bg-[#F8FAFC] font-mono rounded outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Voucher Date</label>
              <input 
                type="date" 
                value={voucherDate} 
                onChange={(e) => {
                  setVoucherDate(e.target.value);
                  setBillDate(e.target.value);
                }}
                className="p-2 border border-[#E2E8F0] rounded font-mono outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Bill / Ref No</label>
              <input 
                type="text" 
                value={billNo} 
                onChange={(e) => setBillNo(e.target.value)}
                placeholder="e.g. REF-7"
                className="p-2 border border-[#E2E8F0] rounded outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Bill Date</label>
              <input 
                type="date" 
                value={billDate} 
                onChange={(e) => setBillDate(e.target.value)}
                className="p-2 border border-[#E2E8F0] font-mono rounded outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

          </div>

          {/* Core Checkboxes Section representing Page 1 parameters */}
          <div className="flex items-center gap-6 mt-4 pt-3 border-t border-slate-100" id="jv-tax-check-container">
            <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
              <input 
                type="checkbox" 
                checked={tdsEnabled} 
                onChange={(e) => setTdsEnabled(e.target.checked)}
                className="rounded text-[#2563EB] w-4 h-4 focus:ring-0"
              />
              <span>Apply TDS Ded.</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
              <input 
                type="checkbox" 
                checked={seTaxEnabled} 
                onChange={(e) => setSeTaxEnabled(e.target.checked)}
                className="rounded text-[#2563EB] w-4 h-4 focus:ring-0"
              />
              <span>Apply SERVICE TAX</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
              <input 
                type="checkbox" 
                checked={stEnabled} 
                onChange={(e) => setStEnabled(e.target.checked)}
                className="rounded text-[#2563EB] w-4 h-4 focus:ring-0"
              />
              <span>Apply S.T. (Sales)</span>
            </label>
          </div>
        </div>

        {/* Voucher Line Items list (recreating the grid exactly) */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm flex flex-col flex-1 min-h-[300px]">
          
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Debit & Credit Line Breakdown</h3>
            <button 
              onClick={addLineItem}
              className="border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> add ledger line
            </button>
          </div>

          <div className="flex-1 overflow-auto max-h-[380px]" id="jv-line-table">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[#64748B] font-semibold text-[10px] uppercase tracking-wider">
                  <th className="p-2">Account Head</th>
                  <th className="p-2">Narration</th>
                  <th className="p-2 text-right w-32">Debit (Dr.)</th>
                  <th className="p-2 text-right w-32">Credit (Cr.)</th>
                  <th className="p-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    
                    {/* Account selection drop */}
                    <td className="p-1.5">
                      <select 
                        value={item.accountCode}
                        onChange={(e) => updateLineField(item.id, "accountCode", e.target.value)}
                        className="w-full p-1.5 border border-[#E2E8F0] rounded text-xs font-mono select-none outline-none focus:ring-1 focus:ring-[#2563EB]"
                      >
                        <option value="">-- Choose Account --</option>
                        {accountOptions}
                      </select>
                    </td>

                    {/* Custom specific narration */}
                    <td className="p-1.5">
                      <input 
                        type="text"
                        value={item.narration}
                        onChange={(e) => updateLineField(item.id, "narration", e.target.value)}
                        placeholder="defaults to main header description"
                        className="w-full p-1.5 border border-[#E2E8F0] rounded text-xs outline-none focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </td>

                    {/* Debit entry */}
                    <td className="p-1.5">
                      <input 
                        type="number"
                        step="any"
                        value={item.debit}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateLineField(item.id, "debit", val);
                          if(parseFloat(val) > 0) updateLineField(item.id, "credit", "");
                        }}
                        onWheel={(e) => e.target.blur()}
                        className="w-full p-1.5 border border-[#E2E8F0] rounded text-xs font-mono text-right outline-none focus:ring-1 focus:ring-[#2563EB]"
                        placeholder="0.00"
                      />
                    </td>

                    {/* Credit entry */}
                    <td className="p-1.5">
                      <input 
                        type="number"
                        step="any"
                        value={item.credit}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateLineField(item.id, "credit", val);
                          if(parseFloat(val) > 0) updateLineField(item.id, "debit", "");
                        }}
                        onWheel={(e) => e.target.blur()}
                        className="w-full p-1.5 border border-[#E2E8F0] rounded text-xs font-mono text-right outline-none focus:ring-1 focus:ring-[#2563EB]"
                        placeholder="0.00"
                      />
                    </td>

                    {/* Remove Line */}
                    <td className="p-1.5 text-center">
                      <button 
                        onClick={() => removeLineItem(item.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Central Narration input */}
          <div className="mt-4 flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">General Voucher Narration / Memo Description</span>
            <textarea
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="Supply of Torch Light For Production Dept . Bill No 7/16.04.2026..."
              rows={2}
              className="w-full p-2 border border-[#E2E8F0] rounded text-xs outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          {/* Group and Tax fields below Narration */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-xs font-semibold text-[#1E293B]">
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Main Group</label>
              <select 
                value={mainGroup} 
                onChange={(e) => setMainGroup(e.target.value)}
                className="p-2 border border-[#E2E8F0] rounded outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="">-- Select Main Group --</option>
                {(database.groups || []).map(g => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Sub Group</label>
              <select 
                value={subGroup} 
                onChange={(e) => setSubGroup(e.target.value)}
                className="p-2 border border-[#E2E8F0] rounded outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="">-- Select Sub Group --</option>
                {(database.subGroups || []).map(sg => (
                  <option key={sg.id} value={sg.name}>{sg.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">TDS Amount</label>
              <input 
                type="number"
                step="any"
                value={tdsAmount} 
                onChange={(e) => setTdsAmount(e.target.value)}
                onWheel={(e) => e.target.blur()}
                className="p-2 border border-[#E2E8F0] rounded outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">S. Tax Amount</label>
              <input 
                type="number"
                step="any"
                value={sTaxAmount} 
                onChange={(e) => setSTaxAmount(e.target.value)}
                onWheel={(e) => e.target.blur()}
                className="p-2 border border-[#E2E8F0] rounded outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Total</label>
              <input 
                type="number" 
                value={totalDebit || ""} 
                readOnly
                className="p-2 border border-[#E2E8F0] bg-[#F8FAFC] font-mono rounded outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Accounting Balances and Submission tools */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            
            {/* Balance check labels */}
            <div className="flex items-center gap-6 text-right">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Debit</div>
                <div className="text-base font-bold font-mono text-slate-700">
                  {totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Credit</div>
                <div className="text-base font-bold font-mono text-[#2563EB]">
                  {totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="pl-4 border-l border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Status checks</div>
                {isBalanced ? (
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 font-bold text-[10px] px-2 py-0.5 rounded border border-green-200">
                    <Check className="w-3 h-3" /> BALANCED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-bold text-[10px] px-2 py-0.5 rounded border border-amber-200">
                    <AlertCircle className="w-3 h-3" /> DIFF: Rs.{difference.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>

            {/* General Actions */}
            <div className="flex items-center gap-2">
              <button 
                onClick={clearForm}
                className="bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-600 px-4 py-2 rounded text-xs font-semibold cursor-pointer"
              >
                Clear Form
              </button>
              <button 
                onClick={handleSave}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2 rounded text-xs font-semibold cursor-pointer"
              >
                Save Voucher
              </button>
              {voucherId && (
                <button 
                  onClick={() => triggerPrint(voucherId)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print
              </button>
            )}
            {voucherId && (
              <button 
                onClick={() => handleDownloadVoucher({ voucherNo, voucherDate, narration, items })}
                className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Voucher
                </button>
              )}
            </div>

          </div>

        </div>

        </div>
      </div>

      {/* RIGHT: Quick-Voucher Find Sidebar & Logs (reproducing Page 1 list view) */}
      <div className="hidden" id="jv-entry-vouchers-list">
        
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold text-[#1E293B] text-[11px] uppercase tracking-wider">
            Historic JVs ({vouchersList.length})
          </h4>
          <button onClick={clearForm} title="Reset Form for entry" className="text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {vouchersList.map(v => {
            const hasDraft = v.id === voucherId;
            return (
              <div 
                key={v.id} 
                onClick={() => loadVoucher(v)}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  hasDraft 
                    ? "bg-[#EFF6FF] border-[#2563EB]" 
                    : "bg-white hover:bg-[#F8FAFC] border-[#E2E8F0]"
                }`}
              >
                <div className="flex justify-between items-center mb-1.5 font-bold">
                  <span className="text-[#2563EB] font-serif">VouNo: {v.voucherNo}</span>
                  <span className="text-[#64748B] font-mono">{v.voucherDate}</span>
                </div>
                <div className="text-slate-600 font-medium line-clamp-2 leading-relaxed mb-2">
                  {v.narration || "No memo text available."}
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="bg-[#DCFCE7] text-[#166534] uppercase text-[9px] font-bold px-1.5 rounded">
                    Rs. {v.totalAmount.toLocaleString("en-IN")}
                  </span>
                  <span className="text-slate-400 font-bold uppercase">🧑 {v.userName}</span>
                </div>
                
                {/* Print button directly on item card */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); triggerPrint(v.id); }}
                    className="p-1 text-slate-400 hover:text-slate-700 flex items-center gap-1 font-bold text-[9px]"
                  >
                    <Printer className="w-3 h-3" /> PRINT BILL
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDownloadVoucher(v); }}
                    className="p-1 text-slate-400 hover:text-teal-600 flex items-center gap-1 font-bold text-[9px]"
                  >
                    <Download className="w-3 h-3" /> DL VOUCHER
                  </button>
                </div>
              </div>
            );
          })}

          {vouchersList.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No registered JV. Start entering above.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
