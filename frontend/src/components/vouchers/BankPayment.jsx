import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash, Printer, Edit2, X, RefreshCw, Mail, FileText, Send } from "lucide-react";
import { generateNextVoucherNo } from "../../utils/voucherNumbering";

function numberToWords(num) {
  if (num === 0) return "ZERO ONLY";
  const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const formatGroup = (n) => {
    let str = '';
    if (n > 99) { str += a[Math.floor(n / 100)] + 'HUNDRED '; n %= 100; }
    if (n > 19) { str += b[Math.floor(n / 10)] + ' '; n %= 10; }
    if (n > 0) { str += a[n]; }
    return str;
  };
  
  let integerPart = Math.floor(num);
  let decimalPart = Math.round((num - integerPart) * 100);

  let str = '';
  let cr = Math.floor(integerPart / 10000000); integerPart %= 10000000;
  let lk = Math.floor(integerPart / 100000); integerPart %= 100000;
  let th = Math.floor(integerPart / 1000); integerPart %= 1000;
  if (cr > 0) str += formatGroup(cr) + 'CRORE ';
  if (lk > 0) str += formatGroup(lk) + 'LAKH ';
  if (th > 0) str += formatGroup(th) + 'THOUSAND ';
  if (integerPart > 0) str += formatGroup(integerPart);
  
  let res = str.trim();
  if (res === '') res = 'ZERO';

  if (decimalPart > 0) {
    res += ' AND PAISE ' + formatGroup(decimalPart).trim();
  }
  return res + ' ONLY.';
}

export default function BankPayment({ database, onSaveVoucher, onDeleteVoucher }) {
  const mode = "BP";
  const [vouchersList, setVouchersList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Memoize account options for instant rendering with 5,000+ accounts
  const accountOptions = useMemo(() => {
    return (database.accounts || []).map(acc => (
      <option key={acc.code} value={acc.code}>{acc.name} ({acc.code})</option>
    ));
  }, [database.accounts]);
  
  // Active Voucher states
  const [voucherId, setVoucherId] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [billNo, setBillNo] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [bankAccount, setBankAccount] = useState("");
  const [ledgerType, setLedgerType] = useState("");
  const [category, setCategory] = useState("");
  const [narration, setNarration] = useState("");
  
  const [chequeName, setChequeName] = useState("");
  const [toMail, setToMail] = useState("");

  const [tdsEnabled, setTdsEnabled] = useState(false);
  const [seTaxEnabled, setSeTaxEnabled] = useState(false);
  const [stEnabled, setStEnabled] = useState(false);
  
  const [tdsAmount, setTdsAmount] = useState("");
  const [sTaxAmount, setSTaxAmount] = useState("");

  // Line items for target debit heads
  const [items, setItems] = useState([
    { id: "L1", accountCode: "", accountName: "", debit: "" }
  ]);

  useEffect(() => {
    const list = (database.vouchers || []).filter(v => v.type === mode);
    setVouchersList(list);
  }, [database]);

  useEffect(() => {
    if (database.accounts && database.accounts.length > 0) {
      setItems(prevItems => {
        return prevItems.map(item => {
          if (!item.accountCode) return item;
          const exists = database.accounts.some(a => a.code === item.accountCode);
          if (!exists) {
            const match = database.accounts.find(a => a.name.toUpperCase().includes(item.accountName.toUpperCase().split(" ")[0]));
            if (match) return { ...item, accountCode: match.code, accountName: match.name };
          }
          return item;
        });
      });
    }
  }, [database.accounts]);

  const loadVoucher = (v) => {
    setVoucherId(v.id);
    setVoucherNo(v.voucherNo);
    setVoucherDate(v.voucherDate);
    setBillNo(v.billNo || "");
    setBillDate(v.billDate || v.voucherDate);
    setChequeNo(v.chequeNo || "");
    setChequeDate(v.chequeDate || v.voucherDate);
    setBankAccount(v.bankAccount || "IOB.K.R.NAGAR A/C 10035");
    setLedgerType(v.ledgerType || "GENERAL LEDGER");
    setCategory(v.category || "GENERAL LEDGER");
    setNarration(v.narration || "");
    setChequeName(v.chequeName || "");
    setToMail(v.toMail || "");
    setTdsEnabled(!!v.tdsEnabled);
    setSeTaxEnabled(!!v.serviceTaxEnabled);
    setStEnabled(!!v.stEnabled);
    setTdsAmount(v.tdsAmount || "");
    setSTaxAmount(v.sTaxAmount || "");

    if (v.items && v.items.length) {
      const displayLines = v.items
        .filter(item => item.debit > 0)
        .map(item => ({
          id: item.id,
          accountCode: item.accountCode,
          accountName: item.accountName,
          debit: item.debit || ""
        }));
      setItems(displayLines.length ? displayLines : [{ id: "L1", accountCode: "", accountName: "", debit: "" }]);
    }
    setIsModalOpen(true);
  };

  const clearForm = () => {
    setVoucherId("");
    // Option 1 Standard: BP-00001, BP-00002
    setVoucherNo(generateNextVoucherNo("BP", database.vouchers || []));
    setVoucherDate(new Date().toISOString().split('T')[0]);
    setBillNo("");
    setBillDate(new Date().toISOString().split('T')[0]);
    setChequeNo("");
    setChequeDate(new Date().toISOString().split('T')[0]);
    setLedgerType("");
    setCategory("");
    setNarration("");
    setChequeName("");
    setToMail("");
    setTdsEnabled(false);
    setSeTaxEnabled(false);
    setStEnabled(false);
    setTdsAmount("");
    setSTaxAmount("");
    setItems([{ id: "L1", accountCode: "", accountName: "", debit: "" }]);
  };

  const openNewVoucher = () => {
    clearForm();
    setIsModalOpen(true);
  };

  const addLine = () => {
    setItems([...items, { id: "LINE_" + Date.now(), accountCode: "", accountName: "", debit: "" }]);
  };

  const removeLine = (id) => {
    if (items.length <= 1) return;
    setItems(items.filter(it => it.id !== id));
  };

  const updateLine = (id, field, value) => {
    setItems(items.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: value };
      if (field === "accountCode") {
        const found = database.accounts.find(a => a.code === value);
        updated.accountName = found ? found.name : "";
      }
      return updated;
    }));
  };

  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.debit) || 0), 0);

  const handlePrintVoucher = (v) => {
    const vNo = v.voucherNo || voucherNo;
    const vDate = v.voucherDate || voucherDate;
    const vBankAccount = v.bankAccount || bankAccount;
    const vNarration = v.narration || narration;
    
    const vItems = (v.items || items).filter(it => it.accountName && it.accountName !== vBankAccount && (it.debit > 0 || it.amount > 0));
    const payTo = vItems.length > 0 ? vItems[0].accountName : "";
    const tAmount = v.totalAmount || totalAmount || 0;
    const inWords = numberToWords(tAmount);

    const htmlContent = `
      <html>
        <head>
          <title>Payment Voucher - ${vNo}</title>
          <style>
            body { font-family: "Courier New", Courier, monospace; font-size: 14px; margin: 40px; color: #000; }
            .print-wrapper { width: 100%; max-width: 800px; margin: 0 auto; }
            .header-title { text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 20px; }
            .meta-section { display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: bold; }
            .dashed-line { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 5px; vertical-align: top; }
            th { text-align: left; }
            .amt-col { text-align: right; width: 150px; }
            .detail-block { margin-bottom: 15px; }
            .detail-block strong { display: block; margin-bottom: 5px; font-weight: bold; }
            .detail-block span { display: block; padding-left: 2px; }
            .footer-sig { text-align: right; margin-top: 50px; font-weight: bold; padding-right: 20px; }
            .no-print { margin-bottom: 20px; text-align: right; max-width: 800px; margin-left: auto; margin-right: auto; }
            .print-btn { padding: 8px 16px; font-size: 14px; cursor: pointer; background: #2563EB; color: white; border: none; border-radius: 4px; font-weight: bold; }
            @media print { 
              body { margin: 0; padding: 20px; } 
              .no-print { display: none; } 
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button class="print-btn" onclick="window.print()">🖨️ Print Voucher</button>
          </div>
          <div class="print-wrapper">
            <div class="header-title">PAYMENT VOUCHER</div>
            <div class="meta-section">
              <div>No : ${vNo}</div>
              <div>Date : ${vDate}</div>
            </div>
            
            <div class="dashed-line"></div>
            <table>
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th class="amt-col">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="2"><div class="dashed-line"></div></td></tr>
                <tr>
                  <td>
                    <div class="detail-block">
                      <strong>Account :</strong>
                      <span>${payTo}</span>
                    </div>
                    <div class="detail-block">
                      <strong>Through :</strong>
                      <span>${vBankAccount}</span>
                    </div>
                    <div class="detail-block">
                      <strong>On Account of :</strong>
                      <span style="white-space: pre-wrap;">${vNarration}</span>
                    </div>
                    <div class="detail-block" style="margin-top: 30px;">
                      <strong>Amount (In words) :</strong>
                      <span style="text-transform: uppercase;">${inWords}</span>
                    </div>
                  </td>
                  <td class="amt-col">
                    <div style="margin-top: 25px;">${tAmount.toFixed(2)}</div>
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td class="amt-col" style="padding-top: 30px;">
                    <span style="display:inline-block; border-bottom: 2px solid #000; border-top: 1px solid #000; padding: 2px 0;">${tAmount.toFixed(2)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="footer-sig">Authorised Signatory</div>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  };

  const handleSave = () => {
    if(!voucherNo) return alert("Please specify a valid voucher number");
    
    const validLines = items.filter(it => it.accountCode && it.debit > 0);
    if(validLines.length === 0) return alert("Please enter at least one transaction row with a positive debit amount.");

    const doubleEntryLines = [];
    const sourceAccObj = database.accounts.find(a => a.name === bankAccount) || { code: "1001008", name: "IOB.K.R.NAGAR A/C 10035" };

    validLines.forEach(line => {
      doubleEntryLines.push({
        id: line.id + "_db",
        accountCode: line.accountCode,
        accountName: line.accountName,
        narration: narration || `Debit payment to ${line.accountName}`,
        debit: line.debit,
        credit: 0
      });
    });

    doubleEntryLines.push({
      id: "COUNTER_" + Date.now(),
      accountCode: sourceAccObj.code,
      accountName: sourceAccObj.name,
      narration: narration || `Bank payment counter posting`,
      debit: 0,
      credit: totalAmount
    });

    const payload = {
      id: voucherId || undefined,
      voucherNo,
      voucherDate,
      billNo,
      billDate,
      type: mode,
      bankAccount,
      category,
      chequeNo,
      chequeDate,
      chequeName,
      toMail,
      narration: narration || validLines[0]?.narration || "",
      tdsEnabled,
      stEnabled,
      serviceTaxEnabled: seTaxEnabled,
      tdsAmount: parseFloat(tdsAmount) || 0,
      sTaxAmount: parseFloat(sTaxAmount) || 0,
      ledgerType,
      items: doubleEntryLines,
      totalAmount
    };

    const saved = onSaveVoucher(payload);
    setVoucherId(saved.id);
    alert(`Success: saved Bank Payment No. ${voucherNo}`);
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC] min-h-0" id="bank-payment-viewport">
      <div className="p-6 bg-white border-b border-[#E2E8F0] flex items-center justify-between gap-4 shrink-0">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">Bank Payment Register</h3>
          <p className="text-[10px] text-[#64748B] mt-1">Manage and print specialized bank payment vouchers.</p>
        </div>
        <button onClick={openNewVoucher} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
          <Plus className="w-4 h-4" /> Add Payment
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider sticky top-0 z-10">
                <th className="p-3 w-28 bg-slate-50">Voucher No</th>
                <th className="p-3 w-32 bg-slate-50">Date</th>
                <th className="p-3 bg-slate-50">Pay To Account</th>
                <th className="p-3 w-32 bg-slate-50">Cheque No</th>
                <th className="p-3 text-right w-32 bg-slate-50">Amount</th>
                <th className="p-3 text-center w-24 bg-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {vouchersList.map((v, index) => {
                const firstLine = v.items?.find(item => item.debit > 0) || {};
                return (
                  <tr key={v.id} onClick={() => loadVoucher(v)} className={`cursor-pointer ${index % 2 === 1 ? "bg-slate-50" : "bg-white"} hover:bg-blue-50`}>
                    <td className="p-3 font-mono text-[#2563EB] font-bold">{v.voucherNo}</td>
                    <td className="p-3 font-mono text-slate-600">{v.voucherDate}</td>
                    <td className="p-3 font-semibold text-slate-800">{firstLine.accountName || "Bank Payment"}</td>
                    <td className="p-3 font-mono text-slate-600">{v.chequeNo || "-"}</td>
                    <td className="p-3 text-right font-mono font-semibold text-slate-700">{(v.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); loadVoucher(v); }} className="text-slate-500 hover:text-[#2563EB]" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handlePrintVoucher(v); }} className="text-slate-500 hover:text-slate-800" title="Print"><Printer className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal Overlay Form */}
      <div className={isModalOpen ? "fixed inset-0 z-50 bg-[#0F172A]/60 overflow-y-auto p-4 flex items-center justify-center" : "hidden"}>
        <div className="w-full max-w-3xl bg-white border border-[#E2E8F0] rounded-lg shadow-xl flex flex-col">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center rounded-t-lg">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Payment Bank</span>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Bank Payment Voucher</h2>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5"/></button>
          </div>
          
          <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
            {/* Headers Rows */}
            <div className="grid grid-cols-12 gap-x-4 gap-y-3 text-xs font-semibold text-[#1E293B] items-end">
              <div className="col-span-3 flex flex-col"><label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Voucher No</label><input type="text" value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} className="p-2 border border-[#E2E8F0] rounded outline-none" /></div>
              <div className="col-span-3 flex flex-col"><label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Date</label><input type="date" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} className="p-2 border border-[#E2E8F0] rounded font-mono outline-none" /></div>
              <div className="col-span-6 flex justify-end pb-2"><button className="text-blue-600 hover:underline">F1 - To add new ledger</button></div>

              <div className="col-span-3 flex flex-col"><label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Bill No</label><input type="text" value={billNo} onChange={(e) => setBillNo(e.target.value)} className="p-2 border border-[#E2E8F0] rounded outline-none" /></div>
              <div className="col-span-3 flex flex-col"><label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Date</label><input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className="p-2 border border-[#E2E8F0] rounded font-mono outline-none" /></div>
              <div className="col-span-6"></div>

              <div className="col-span-3 flex flex-col"><label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Cheque No</label><input type="text" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} placeholder="953919" className="p-2 border border-[#E2E8F0] rounded font-mono outline-none" /></div>
              <div className="col-span-3 flex flex-col"><label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Date</label><input type="date" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} className="p-2 border border-[#E2E8F0] rounded font-mono outline-none" /></div>
              <div className="col-span-6"></div>

              <div className="col-span-6 flex flex-col">
                <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Bank Account</label>
                <select value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="p-2 border border-[#E2E8F0] rounded outline-none">
                  <option value="">-- Select Bank Account --</option>
                  <option value="IOB.K.R.NAGAR A/C 10035">IOB.K.R.NAGAR A/C 10035</option>
                  <option value="SBI Operating A/c">SBI Operating A/c</option>
                </select>
              </div>
              <div className="col-span-6 flex flex-col gap-2 pb-1 justify-end items-end pr-4">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={tdsEnabled} onChange={(e) => setTdsEnabled(e.target.checked)} className="rounded" /> TDS</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={seTaxEnabled} onChange={(e) => setSeTaxEnabled(e.target.checked)} className="rounded" /> SERVICE TAX</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={stEnabled} onChange={(e) => setStEnabled(e.target.checked)} className="rounded" /> S.T.</label>
              </div>

              <div className="col-span-6 flex flex-col"><label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Ledger Type</label><select value={ledgerType} onChange={(e) => setLedgerType(e.target.value)} className="p-2 border border-[#E2E8F0] rounded outline-none"><option value="">-- Select Ledger Type --</option><option value="GENERAL LEDGER">GENERAL LEDGER</option><option value="SUB LEDGER">SUB LEDGER</option></select></div>
              <div className="col-span-6"></div>
              <div className="col-span-6 flex flex-col"><label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Category</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="p-2 border border-[#E2E8F0] rounded outline-none"><option value="">-- Select Category --</option><option value="GENERAL LEDGER">GENERAL LEDGER</option></select></div>
            </div>

            {/* Description Grid */}
            <div className="border border-[#E2E8F0] rounded mt-2">
              <table className="w-full text-xs text-left bg-white">
                <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                  <tr>
                    <th className="p-2 font-bold uppercase text-slate-600">Description</th>
                    <th className="p-2 font-bold uppercase text-slate-600 text-right w-44">Debit</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-1.5">
                        <select value={item.accountCode} onChange={(e) => updateLine(item.id, "accountCode", e.target.value)} className="w-full p-2 border rounded font-mono outline-none">
                          <option value="">-- Select Party / Account --</option>
                          {accountOptions}
                        </select>
                      </td>
                      <td className="p-1.5"><input type="number" value={item.debit || ""} onChange={(e) => updateLine(item.id, "debit", parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded font-mono text-right outline-none" /></td>
                      <td className="p-1.5 text-center"><button onClick={() => removeLine(item.id)} className="text-slate-400 hover:text-red-500"><Trash className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-slate-50 p-2 border-t border-[#E2E8F0]"><button onClick={addLine} className="text-xs text-blue-600 font-bold hover:underline">+ Add Row</button></div>
            </div>

            {/* Tax & Total */}
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="flex flex-col"><label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">TDS Amount</label><input type="number" step="any" value={tdsAmount} onChange={(e) => setTdsAmount(e.target.value)} onWheel={(e) => e.target.blur()} className="p-2 border border-[#E2E8F0] rounded font-mono outline-none" /></div>
              <div className="flex flex-col"><label className="text-[10px] uppercase font-bold text-[#64748B] mb-1 text-center">Service Tax Amount</label><input type="number" step="any" value={sTaxAmount} onChange={(e) => setSTaxAmount(e.target.value)} onWheel={(e) => e.target.blur()} className="p-2 border border-[#E2E8F0] rounded font-mono outline-none text-center" /></div>
              <div className="flex flex-col"><label className="text-[10px] uppercase font-bold text-[#64748B] mb-1 text-right">Total</label><input type="number" value={totalAmount || ""} readOnly className="p-2 border border-[#E2E8F0] bg-slate-50 rounded font-mono text-right font-bold outline-none" /></div>
            </div>

            {/* Narration & Cheque Print Details */}
            <div className="flex flex-col"><label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Narration</label><textarea value={narration} onChange={(e) => setNarration(e.target.value)} rows={2} className="p-2 border border-[#E2E8F0] rounded text-xs outline-none" /></div>
            <div className="grid grid-cols-2 gap-4 text-xs mt-2">
              <div className="flex flex-col"><label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Cheque Name</label><input type="text" value={chequeName} onChange={(e) => setChequeName(e.target.value)} placeholder="** MECGROWTHS TEXMACH PVT LTD **" className="p-2 border border-[#E2E8F0] rounded font-mono outline-none" /></div>
              <div className="flex flex-col"><label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">To Mail</label><input type="email" value={toMail} onChange={(e) => setToMail(e.target.value)} placeholder="vendor@example.com" className="p-2 border border-[#E2E8F0] rounded outline-none" /></div>
            </div>

          </div>
          
          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-[#E2E8F0] bg-slate-50 rounded-b-lg flex justify-between items-center">
            <div className="flex gap-2">
              <button className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2 rounded text-xs font-bold flex items-center gap-1"><Mail className="w-3.5 h-3.5"/> Mail</button>
              <button onClick={() => voucherId ? handlePrintVoucher(database.vouchers.find(v => v.id === voucherId)) : alert("Please save first.")} className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2 rounded text-xs font-bold flex items-center gap-1"><FileText className="w-3.5 h-3.5"/> Report</button>
              <button className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2 rounded text-xs font-bold flex items-center gap-1"><Printer className="w-3.5 h-3.5"/> Pay Advice</button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-xs font-bold shadow-sm">Update</button>
              <button onClick={() => setIsModalOpen(false)} className="bg-white hover:bg-slate-100 border border-[#E2E8F0] text-slate-600 px-6 py-2 rounded text-xs font-bold">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
