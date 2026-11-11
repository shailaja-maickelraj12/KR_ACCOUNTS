import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash, Printer, Edit2, X, RefreshCw } from "lucide-react";
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
  let str = '';
  let cr = Math.floor(num / 10000000); num %= 10000000;
  let lk = Math.floor(num / 100000); num %= 100000;
  let th = Math.floor(num / 1000); num %= 1000;
  if (cr > 0) str += formatGroup(cr) + 'CRORE ';
  if (lk > 0) str += formatGroup(lk) + 'LAKH ';
  if (th > 0) str += formatGroup(th) + 'THOUSAND ';
  if (num > 0) str += formatGroup(Math.floor(num));
  return str.trim() + ' ONLY.';
}

export default function CashPayment({ 
  database, 
  mode = "CP", // CP (Cash payment), BP (Bank payment), CR (Cash receipt), BR (Bank receipt), CONTRA
  onSaveVoucher, 
  onDeleteVoucher, 
  onPrint 
}) {
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
  const [narration, setNarration] = useState("");
  
  // Specific payment parameters
  const [cashAccount, setCashAccount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [category, setCategory] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState(new Date().toISOString().split('T')[0]);
  const [chequeName, setChequeName] = useState("");

  const [tdsEnabled, setTdsEnabled] = useState(false);
  const [stEnabled, setStEnabled] = useState(false);
  const [seTaxEnabled, setSeTaxEnabled] = useState(false);
  const [tdsAmount, setTdsAmount] = useState("");
  const [sTaxAmount, setSTaxAmount] = useState("");
  const [ledgerType, setLedgerType] = useState("");

  // Line items for target debit/credit heads
  const [items, setItems] = useState([
    { id: "L1", accountCode: "", accountName: "", narration: "", amount: "" }
  ]);

  useEffect(() => {
    const list = (database.vouchers || []).filter(v => v.type === mode);
    setVouchersList(list);
  }, [database, mode]);

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

  // Load selected voucher
  const loadVoucher = (v) => {
    setVoucherId(v.id);
    setVoucherNo(v.voucherNo);
    setVoucherDate(v.voucherDate);
    setBillNo(v.billNo || "");
    setBillDate(v.billDate || v.voucherDate);
    setNarration(v.narration || "");
    setCashAccount(v.cashAccount || "CASH - MILL");
    setBankAccount(v.bankAccount || "IOB, K.R.NAGAR A/C 10035");
    setCategory(v.category || "GENERAL LEDGER");
    setChequeNo(v.chequeNo || "");
    setChequeDate(v.chequeDate || v.voucherDate);
    setChequeName(v.chequeName || "");
    setTdsEnabled(!!v.tdsEnabled);
    setStEnabled(!!v.stEnabled);
    setSeTaxEnabled(!!v.serviceTaxEnabled);
    setTdsAmount(v.tdsAmount || "");
    setSTaxAmount(v.sTaxAmount || "");
    setLedgerType(v.ledgerType || "GENERAL LEDGER");

    // reconstruct row entries
    if (v.items && v.items.length) {
      const displayLines = v.items
        .filter(item => {
          // filters out the cash counter-entry row to show only the line heads
          if (mode === "CP" || mode === "BP" || mode === "CONTRA") {
            return item.debit > 0;
          } else {
            return item.credit > 0;
          }
        })
        .map(item => ({
          id: item.id,
          accountCode: item.accountCode,
          accountName: item.accountName,
          narration: item.narration,
          amount: item.debit || item.credit || ""
        }));

      setItems(displayLines.length ? displayLines : [{ id: "L1", accountCode: "", accountName: "", narration: "", amount: "" }]);
    }
    setIsModalOpen(true);
  };

  // Reset form
  const clearForm = () => {
    setVoucherId("");
    // Option 1 Standard: prefix + 5-digit number
    setVoucherNo(generateNextVoucherNo(mode, database.vouchers || []));
    setVoucherDate(new Date().toISOString().split('T')[0]);
    setBillNo("");
    setBillDate(new Date().toISOString().split('T')[0]);
    setNarration("");
    setCategory("");
    setChequeNo("");
    setChequeName("");
    setTdsEnabled(false);
    setStEnabled(false);
    setSeTaxEnabled(false);
    setTdsAmount("");
    setSTaxAmount("");
    setLedgerType("");
    
    // Setting defaults depending on context
    setItems([{ id: "L1", accountCode: "", accountName: "", narration: "", amount: "" }]);
  };

  const openNewVoucher = () => {
    clearForm();
    setIsModalOpen(true);
  };

  const addLine = () => {
    setItems([...items, { id: "LINE_" + Date.now() + Math.random(), accountCode: "", accountName: "", narration: "", amount: "" }]);
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

  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  // Compute Read-Only Cash Opening Balance dynamically
  const cashOpening = (() => {
    const acc = database.accounts?.find(a => a.name === ((mode === "CP" || mode === "CR" || mode === "CONTRA") ? cashAccount : bankAccount));
    if (!acc) return 0;
    return (parseFloat(acc.openingDebit) || 0) - (parseFloat(acc.openingCredit) || 0);
  })();

  // Custom native print window format for Cash / Bank Vouchers
  const handlePrintVoucher = (v) => {
    const vNo = v.voucherNo || voucherNo;
    const vDate = v.voucherDate || voucherDate;
    const vCashAccount = v.cashAccount || cashAccount || v.bankAccount || bankAccount;
    
    // Filter out internal double-entry system counter rows
    const vItems = (v.items || items).filter(it => 
      it.accountName && 
      !String(it.id).startsWith("COUNTER") && 
      it.accountName !== vCashAccount
    );
    
    const firstItem = vItems[0] || {};
    const accCode = firstItem.accountCode || "";
    const payTo = firstItem.accountName || "";
    const tAmount = v.totalAmount || totalAmount || 0;
    
    const inWords = numberToWords(tAmount);

    let title = "VOUCHER";
    if (mode === "CP") title = "CASH PAYMENT VOUCHER";
    else if (mode === "CR") title = "CASH RECEIPT VOUCHER";
    else if (mode === "BP") title = "BANK PAYMENT VOUCHER";
    else if (mode === "BR") title = "BANK RECEIPT VOUCHER";
    else if (mode === "CONTRA") title = "CONTRA VOUCHER";

    const itemsHtml = vItems.map((item, idx) => `
      <tr>
        <td class="col-sl">${idx + 1}</td>
        <td class="col-desc" style="white-space: pre-wrap;">${item.narration || v.narration || narration || item.accountName}</td>
        <td class="col-amt">${parseFloat(item.amount || item.debit || item.credit || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>${title} - ${vNo}</title>
          <style>
            body { font-family: "Courier New", Courier, monospace; font-size: 14px; margin: 40px; color: #000; }
            .print-wrapper { border: 1px solid #000; width: 100%; max-width: 800px; margin: 0 auto; }
            .header-title { text-align: center; font-weight: bold; font-size: 16px; padding: 10px; border-bottom: 1px solid #000; }
            .meta-section { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #000; }
            .meta-left div, .meta-right div { margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 4px 8px; vertical-align: top; }
            th { border-bottom: 1px solid #000; text-align: left; }
            .col-sl { width: 50px; border-right: 1px solid #000; text-align: center; }
            .col-desc { border-right: 1px solid #000; }
            .col-amt { width: 120px; text-align: right; }
            .total-row { border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: bold; }
            .footer-section { padding: 10px; }
            .words-label { margin-bottom: 5px; }
            .words-value { font-weight: bold; margin-bottom: 40px; text-transform: uppercase; }
            .signatures { display: flex; justify-content: space-between; font-weight: bold; padding: 0 20px 20px 20px; }
            .no-print { margin-bottom: 20px; text-align: right; max-width: 800px; margin-left: auto; margin-right: auto; }
            .print-btn { padding: 8px 16px; font-size: 14px; cursor: pointer; background: #2563EB; color: white; border: none; border-radius: 4px; font-weight: bold; font-family: sans-serif; }
            @media print { 
              body { margin: 0; padding: 10px; } 
              .print-wrapper { border: none; } 
              .no-print { display: none; } 
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button class="print-btn" onclick="window.print()">🖨️ Print Voucher</button>
          </div>
          <div class="print-wrapper">
            <div class="header-title">${title}</div>
            <div class="meta-section">
              <div class="meta-left">
                <div>Through : ${vCashAccount}</div>
                <div>A/c Code : ${accCode}</div>
                <div>Pay To : ${payTo}</div>
              </div>
              <div class="meta-right" style="text-align: right;">
                <div>Vou. No. : ${vNo}</div>
                <div>Date : ${vDate}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th class="col-sl" style="text-align:center;">Sl. No.</th>
                  <th class="col-desc text-center">Description / Account Head</th>
                  <th class="col-amt text-center">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr class="total-row">
                  <td colspan="2" class="col-desc" style="text-align: right; padding-right: 15px;">Total :</td>
                  <td class="col-amt">${parseFloat(tAmount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <div class="footer-section">
              <div class="words-label">Amount (In words) :</div>
              <div class="words-value">${inWords}</div>
              <div class="signatures">
                <span>Receiver's Signature</span>
                <span>Authorised Signatory</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  };

  // Write actual double entry voucher bookkeeping rows
  const handleSave = () => {
    if(!voucherNo) {
      alert("Please specify a valid voucher number");
      return;
    }
    const validLines = items.filter(it => it.accountCode && it.amount > 0);
    if(validLines.length === 0) {
      alert("Please enter at least one transaction row with a positive amount.");
      return;
    }

    // Construct Double Entry System Array
    const doubleEntryLines = [];
    const sourceAccountHead = (mode === "CP" || mode === "CR") ? cashAccount : bankAccount;
    const sourceAccObj = database.accounts.find(a => a.name === sourceAccountHead) || { code: "1001007", name: "CASH - MILL" };

    validLines.forEach(line => {
      if (mode === "CP" || mode === "BP") {
        // Debits the account, Credits Cash/Bank
        doubleEntryLines.push({
          id: line.id + "_db",
          accountCode: line.accountCode,
          accountName: line.accountName,
          narration: line.narration || narration || `Debit payment to ${line.accountName}`,
          debit: line.amount,
          credit: 0
        });
      } else if (mode === "CR" || mode === "BR") {
        // Credits the account, Debits Cash/Bank
        doubleEntryLines.push({
          id: line.id + "_cr",
          accountCode: line.accountCode,
          accountName: line.accountName,
          narration: line.narration || narration || `Credit receipt from ${line.accountName}`,
          debit: 0,
          credit: line.amount
        });
      } else if (mode === "CONTRA") {
        // Contra: Debits target, Credits Source
        doubleEntryLines.push({
          id: line.id + "_db",
          accountCode: line.accountCode,
          accountName: line.accountName,
          narration: line.narration || narration || "Contra Cash Transfer",
          debit: line.amount,
          credit: 0
        });
      }
    });

    // Add corresponding Counter Postings
    if (mode === "CP" || mode === "BP") {
      doubleEntryLines.push({
        id: "COUNTER_" + Date.now(),
        accountCode: sourceAccObj.code,
        accountName: sourceAccObj.name,
        narration: narration || `Cash payment counter posting`,
        debit: 0,
        credit: totalAmount
      });
    } else if (mode === "CR" || mode === "BR") {
      doubleEntryLines.push({
        id: "COUNTER_" + Date.now(),
        accountCode: sourceAccObj.code,
        accountName: sourceAccObj.name,
        narration: narration || `Cash receipt counter posting`,
        debit: totalAmount,
        credit: 0
      });
    } else if (mode === "CONTRA") {
      // Bank credits, Cash debits
      const bankAccObj = database.accounts.find(a => a.name === bankAccount) || { code: "1001008", name: "IOB, K.R.NAGAR A/C 10035" };
      doubleEntryLines.push({
        id: "COUNTER_" + Date.now(),
        accountCode: bankAccObj.code,
        accountName: bankAccObj.name,
        narration: narration || `Contra bank withdrawal`,
        debit: 0,
        credit: totalAmount
      });
    }

    const payload = {
      id: voucherId || undefined,
      voucherNo,
      voucherDate,
      billNo,
      billDate,
      type: mode,
      cashAccount,
      bankAccount,
      category,
      chequeNo: (mode === "BP" || mode === "CONTRA") ? chequeNo : undefined,
      chequeDate: (mode === "BP" || mode === "CONTRA") ? chequeDate : undefined,
      chequeName: (mode === "BP" || mode === "CONTRA") ? chequeName : undefined,
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
    alert(`Success: saved ${mode} No. ${voucherNo}`);
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC] min-h-0" id="cash-payment-viewport">
      <div className="p-6 bg-white border-b border-[#E2E8F0] flex items-center justify-between gap-4 shrink-0">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">{mode} Voucher Register</h3>
          <p className="text-[10px] text-[#64748B] mt-1">Important voucher fields are shown in columns. Select a row to update.</p>
        </div>
        <button
          onClick={openNewVoucher}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add {mode} Voucher
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
                const firstLine = v.items?.find(item => item.accountName !== v.cashAccount && item.accountName !== v.bankAccount) || v.items?.[0] || {};
                return (
                  <tr
                    key={v.id}
                    onClick={() => loadVoucher(v)}
                    className={`cursor-pointer ${index % 2 === 1 ? "bg-yellow-50" : "bg-white"} hover:bg-blue-50`}
                  >
                    <td className="p-3 font-semibold text-slate-700">{mode}</td>
                    <td className="p-3 font-mono text-[#2563EB] font-bold">{v.voucherNo}</td>
                    <td className="p-3 font-mono text-slate-600">{v.voucherDate}</td>
                    <td className="p-3 font-semibold text-slate-800">{firstLine.accountName || v.narration || "Voucher Entry"}</td>
                    <td className="p-3 text-right font-mono font-semibold text-slate-700">
                      {(v.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 font-bold text-slate-500">{v.userName || database.currentUser}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); loadVoucher(v); }} className="text-slate-500 hover:text-[#2563EB] cursor-pointer" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handlePrintVoucher(v); }} className="text-slate-500 hover:text-slate-800 cursor-pointer" title="Print">
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {vouchersList.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">No registered records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Active Form */}
      <div className={isModalOpen ? "fixed inset-0 z-50 bg-[#0F172A]/60 overflow-y-auto p-4" : "hidden"} id="payment-workspace">
        <div className="max-w-4xl mx-auto bg-white border border-[#E2E8F0] rounded-lg shadow-xl p-6 flex flex-col gap-4">
          
          {/* Header Area & Second Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 grid grid-cols-2 gap-4 text-xs font-semibold text-[#1E293B]">
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Voucher No</label>
                <input type="text" value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} className="p-2 border border-[#E2E8F0] bg-[#F8FAFC] font-mono rounded outline-none" />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Voucher Date</label>
                <input type="date" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} className="p-2 border border-[#E2E8F0] rounded font-mono outline-none" />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Bill No.</label>
                <input type="text" value={billNo} onChange={(e) => setBillNo(e.target.value)} className="p-2 border border-[#E2E8F0] rounded outline-none" />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Bill Date</label>
                <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className="p-2 border border-[#E2E8F0] rounded font-mono outline-none" />
              </div>
            </div>

            {/* Top Right Panel */}
            <div className="col-span-1 flex flex-col justify-between bg-slate-50 p-4 rounded border border-[#E2E8F0]">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                <span className="text-[10px] font-bold uppercase text-[#64748B]">Cash Opening</span>
                <span className="font-mono font-bold text-slate-800">{cashOpening.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={tdsEnabled} onChange={(e) => setTdsEnabled(e.target.checked)} className="rounded text-[#2563EB]" /> TDS
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={seTaxEnabled} onChange={(e) => setSeTaxEnabled(e.target.checked)} className="rounded text-[#2563EB]" /> SERVICE TAX
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={stEnabled} onChange={(e) => setStEnabled(e.target.checked)} className="rounded text-[#2563EB]" /> S.T.
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 my-1"></div>

          {/* Rows 3, 4, 5 */}
          <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-[#1E293B]">
            <div className="flex flex-col col-span-2 md:col-span-1">
              <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">
                {(mode === "CP" || mode === "CR" || mode === "CONTRA") ? "Cash Account" : "Bank Account"}
              </label>
              <select 
                value={(mode === "CP" || mode === "CR" || mode === "CONTRA") ? cashAccount : bankAccount} 
                onChange={(e) => (mode === "CP" || mode === "CR" || mode === "CONTRA") ? setCashAccount(e.target.value) : setBankAccount(e.target.value)}
                className="p-2 border border-[#E2E8F0] rounded outline-none"
              >
                {(mode === "CP" || mode === "CR" || mode === "CONTRA") ? (
                  <>
                    <option value="">-- Select Cash Account --</option>
                    <option value="CASH - MILL">CASH - MILL</option>
                    <option value="SARADHA MANDAPAM">SARADHA MANDAPAM</option>
                    <option value="CASH - HEAD OFFICE">CASH - HEAD OFFICE</option>
                  </>
                ) : (
                  <>
                    <option value="">-- Select Bank Account --</option>
                    <option value="IOB, K.R.NAGAR A/C 10035">IOB, K.R.NAGAR A/C 10035</option>
                    <option value="SBI Operating A/c">SBI Operating A/c</option>
                    <option value="HDFC Operating A/c">HDFC Operating A/c</option>
                  </>
                )}
              </select>
            </div>
            <div className="hidden md:block"></div>

            <div className="flex flex-col col-span-2 md:col-span-1">
              <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Ledger Type</label>
              <select value={ledgerType} onChange={(e) => setLedgerType(e.target.value)} className="p-2 border border-[#E2E8F0] rounded outline-none">
                <option value="">-- Select Ledger Type --</option>
                <option value="GENERAL LEDGER">GENERAL LEDGER</option>
                <option value="SUB LEDGER">SUB LEDGER</option>
              </select>
            </div>
            <div className="hidden md:block"></div>

            <div className="flex flex-col col-span-2 md:col-span-1">
              <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-2 border border-[#E2E8F0] rounded outline-none">
                <option value="">-- Select Category --</option>
                <option value="GENERAL LEDGER">GENERAL LEDGER</option>
                <option value="SUB LEDGER">SUB LEDGER</option>
                <option value="TDS MASTER">TDS EXCLUSIVES</option>
              </select>
            </div>
            <div className="col-span-2 md:col-span-1 flex items-end md:justify-start pb-2">
              <button className="text-blue-600 font-bold text-xs hover:underline cursor-pointer">F1 - To add new ledger</button>
            </div>
          </div>

          {/* Conditional Cheque specifications for complex bank withdrawals & contra transactions */}
          {(mode === "BP" || mode === "CONTRA") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-[#1E293B] mt-2">
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Cheque / UT No</label>
                <input type="text" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} placeholder="e.g. 953919" className="p-2 border border-[#E2E8F0] font-mono rounded outline-none" />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Cheque Date</label>
                <input type="date" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} className="p-2 border border-[#E2E8F0] font-mono rounded outline-none" />
              </div>
              <div className="flex flex-col col-span-1">
                <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Pay-to Cheque Name</label>
                <input type="text" value={chequeName} onChange={(e) => setChequeName(e.target.value)} placeholder="e.g. MECGROWTHS TEXMACH PVT LTD" className="p-2 border border-[#E2E8F0] rounded outline-none" />
              </div>
            </div>
          )}

          {/* Grid Section */}
          <div className="border border-[#E2E8F0] rounded overflow-hidden mt-2">
            <table className="w-full text-xs text-left border-collapse bg-white">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                  <th className="p-2 font-bold text-slate-600 uppercase tracking-wider">Description</th>
                  <th className="p-2 font-bold text-slate-600 uppercase tracking-wider text-right w-44">Debit</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-1.5">
                      <select 
                        value={item.accountCode}
                        onChange={(e) => updateLine(item.id, "accountCode", e.target.value)}
                        className="w-full p-2 outline-none border rounded font-mono"
                      >
                        <option value="">-- Choose Account --</option>
                        {accountOptions}
                      </select>
                    </td>
                    <td className="p-1.5">
                      <input 
                        type="number" 
                        step="any"
                        value={item.amount}
                        onChange={(e) => updateLine(item.id, "amount", e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        className="w-full p-2 outline-none border rounded font-mono text-right"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <button onClick={() => removeLine(item.id)} className="text-slate-400 hover:text-red-500 cursor-pointer">
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-slate-50 p-2 border-t border-slate-100 flex justify-start">
               <button onClick={addLine} className="text-xs text-blue-600 font-bold px-2 py-1 hover:underline cursor-pointer">+ Add Row</button>
            </div>
          </div>

          {/* Calculations Section */}
          <div className="grid grid-cols-3 gap-4 border-t border-[#E2E8F0] pt-4 mt-2">
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">TDS Amount</label>
              <input type="number" step="any" value={tdsAmount} onChange={(e) => setTdsAmount(e.target.value)} onWheel={(e) => e.target.blur()} className="p-2 border border-[#E2E8F0] rounded font-mono outline-none" />
            </div>
            <div className="flex flex-col text-center">
              <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Service Tax Amount</label>
              <input type="number" step="any" value={sTaxAmount} onChange={(e) => setSTaxAmount(e.target.value)} onWheel={(e) => e.target.blur()} className="p-2 border border-[#E2E8F0] rounded font-mono outline-none text-center" />
            </div>
            <div className="flex flex-col text-right">
              <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Total</label>
              <input type="number" value={totalAmount || ""} readOnly className="p-2 border border-[#E2E8F0] rounded font-mono bg-slate-50 font-bold outline-none text-right" />
            </div>
          </div>

          {/* Narration */}
          <div className="flex flex-col mt-2">
            <label className="text-[10px] uppercase font-bold text-[#64748B] mb-1">Narration</label>
            <textarea 
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              rows={3}
              placeholder="Cooly to 33 K.V Line Tree Cutting Work and Tea Expenses for 5 Persons"
              className="p-3 border border-[#E2E8F0] rounded text-xs outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center border-t border-[#E2E8F0] pt-4 mt-2">
            <button 
              onClick={() => voucherId ? handlePrintVoucher(database.vouchers.find(v => v.id === voucherId)) : alert("Please save voucher first to preview report.")} 
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-6 py-2 rounded text-xs font-bold transition-colors cursor-pointer"
            >
              Report
            </button>
            <div className="flex gap-3">
              <button 
                onClick={handleSave} 
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-2 rounded text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Update
              </button>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-600 px-6 py-2 rounded text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Selector Side panel (historic lookup list) */}
      <div className="hidden" id="payments-history-list">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">
            Saved Vouchers ({vouchersList.length})
          </h4>
          <button onClick={clearForm} className="text-blue-600 hover:text-blue-800 cursor-pointer">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {vouchersList.map(v => (
            <div 
              key={v.id} 
              onClick={() => loadVoucher(v)}
              className={`p-3 rounded-md border text-xs cursor-pointer transition-all ${
                v.id === voucherId ? "bg-blue-50 border-blue-500" : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex justify-between items-center font-bold mb-1 col-span-2">
                <span className="text-blue-600 font-mono">No. {v.voucherNo}</span>
                <span className="text-slate-400">{v.voucherDate}</span>
              </div>
              <p className="text-slate-600 font-medium mb-2 leading-relaxed truncate">{v.narration || "Cash Book Transaction"}</p>
              
              <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-100">
                <span className="font-bold text-[#166534] bg-green-50 px-2 py-0.5 rounded">Rs. {v.totalAmount.toLocaleString()}</span>
                <span className="text-slate-400 font-bold uppercase">🧑 {v.userName}</span>
              </div>
              
              <div className="flex justify-end mt-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePrintVoucher(v); }}
                  className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <Printer className="w-3 h-3" /> PRINT VOUCHER
                </button>
              </div>
            </div>
          ))}
          {vouchersList.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No registered records found.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
