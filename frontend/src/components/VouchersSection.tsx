import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Printer, Check, X, ShieldCheck, HelpCircle } from 'lucide-react';
import { Voucher, VoucherItem, Account, ReverseBillEntryItem } from '../types';

interface VouchersSectionProps {
  vouchers: Voucher[];
  setVouchers: React.Dispatch<React.SetStateAction<Voucher[]>>;
  accounts: Account[];
  logAudit: (action: string, details: string) => void;
  triggerPrint: (voucher: Voucher | null, reportData: any | null) => void;
}

type SelectedType = 'JV' | 'CP' | 'BP' | 'CR' | 'BR' | 'CONTRA' | 'PROVISION' | 'DN' | 'CN' | 'REVERSE_BILL';

export default function VouchersSection({ vouchers, setVouchers, accounts, logAudit, triggerPrint }: VouchersSectionProps) {
  const [selectedType, setSelectedType] = useState<SelectedType>('JV');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Voucher Form State
  const [voucherNo, setVoucherNo] = useState('');
  const [voucherDate, setVoucherDate] = useState('2026-04-17');
  const [billNo, setBillNo] = useState('');
  const [billDate, setBillDate] = useState('2026-04-17');
  const [chequeNo, setChequeNo] = useState('');
  const [chequeDate, setChequeDate] = useState('2026-04-17');
  const [chequeName, setChequeName] = useState('');
  const [cashAccount, setCashAccount] = useState('CASH - MILL');
  const [bankAccount, setBankAccount] = useState('IOB K.R.NAGAR A/C 10035');
  const [ledgerType, setLedgerType] = useState('GENERAL LEDGER');
  const [category, setCategory] = useState('');
  const [overallNarration, setOverallNarration] = useState('');

  // S.T. / TDS / Service tax togglers
  const [tdsEnabled, setTdsEnabled] = useState(false);
  const [stEnabled, setStEnabled] = useState(false); // S.T.
  const [serviceTaxEnabled, setServiceTaxEnabled] = useState(false);

  // Line items state
  const [lineItems, setLineItems] = useState<VoucherItem[]>([
    { id: '1', accountCode: '5114170', accountName: 'KUMAR NOVELTIES', narration: 'Supply of Torch Light For Production Dept.', debit: 0, credit: 350 },
    { id: '2', accountCode: '5114174', accountName: 'REPAIRS & MAINTENANCE', narration: 'Purchase of lights', debit: 350, credit: 0 }
  ]);

  // Editing a captured historical voucher holder
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);

  // Calculations for active worksheet
  const runningTotals = useMemo(() => {
    let debits = 0;
    let credits = 0;
    lineItems.forEach(itm => {
      debits += Number(itm.debit || 0);
      credits += Number(itm.credit || 0);
    });

    // Auto calculate dynamic taxes if checked
    let tdsVal = tdsEnabled ? debits * 0.02 : 0;
    let stVal = stEnabled ? debits * 0.04 : 0; // S.T.

    return { debits, credits, tdsVal, stVal, total: Math.max(debits, credits) + stVal - tdsVal };
  }, [lineItems, tdsEnabled, stEnabled]);

  // Clean form handlers
  const handleResetForm = () => {
    setEditingVoucherId(null);
    setVoucherNo('VOU-' + Math.floor(100 + Math.random() * 900));
    setVoucherDate('2026-04-17');
    setBillNo('');
    setBillDate('2026-04-17');
    setChequeNo('');
    setChequeDate('2026-04-17');
    setChequeName('');
    setOverallNarration('');
    setTdsEnabled(false);
    setStEnabled(false);
    setServiceTaxEnabled(false);
    setLineItems([
      { id: '1', accountCode: '5114183', accountName: 'CASH - MILL', narration: 'Initial debit line', debit: 1000, credit: 0 },
      { id: '2', accountCode: '5114174', accountName: 'REPAIRS & MAINTENANCE', narration: 'Balancing credit line', debit: 0, credit: 1000 }
    ]);
  };

  const handleAddLineItem = () => {
    const defaultAcc = accounts[0] || { code: 'OP', name: 'PRE-LOADING ACCOUNT' };
    setLineItems(prev => [
      ...prev,
      {
        id: String(Date.now()),
        accountCode: defaultAcc.code,
        accountName: defaultAcc.name,
        narration: '',
        debit: 0,
        credit: 0
      }
    ]);
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(prev => prev.filter(itm => itm.id !== id));
  };

  const handleUpdateLine = (id: string, fields: Partial<VoucherItem>) => {
    setLineItems(prev => prev.map(itm => {
      if (itm.id === id) {
        // If updating accountCode, lookup and fill matching name
        let extra = {};
        if (fields.accountCode) {
          const acc = accounts.find(a => a.code === fields.accountCode);
          if (acc) {
            extra = { accountName: acc.name };
          }
        }
        return { ...itm, ...fields, ...extra };
      }
      return itm;
    }));
  };

  // Select historical record to edit
  const handleSelectVoucherToEdit = (v: Voucher) => {
    setEditingVoucherId(v.id);
    setSelectedType(v.type);
    setVoucherNo(v.voucherNo);
    setVoucherDate(v.voucherDate);
    setBillNo(v.billNo);
    setBillDate(v.billDate);
    setChequeNo(v.chequeNo || '');
    setChequeDate(v.chequeDate || '2026-04-17');
    setChequeName(v.chequeName || '');
    setCashAccount(v.cashAccount || 'CASH - MILL');
    setBankAccount(v.bankAccount || 'IOB K.R.NAGAR A/C 10035');
    setLedgerType(v.ledgerType || 'GENERAL LEDGER');
    setCategory(v.category || '');
    setOverallNarration(v.narration);
    setTdsEnabled(v.tdsEnabled || false);
    setStEnabled(v.stEnabled || false);
    setServiceTaxEnabled(v.serviceTaxEnabled || false);
    setLineItems([...v.items]);
  };

  const handleSaveVoucher = (e: React.FormEvent) => {
    e.preventDefault();

    // Verification check for double-entry matching rules
    if (selectedType === 'JV' && runningTotals.debits !== runningTotals.credits) {
      if (!confirm("Your overall Debits do not match Credits for this Journal Voucher. Would you like to save this discrepancy anyway for adjustment?")) {
        return;
      }
    }

    const compiled: Voucher = {
      id: editingVoucherId || 'VOU-' + Date.now(),
      voucherNo: voucherNo || 'VOU-' + Math.floor(100 + Math.random() * 900),
      voucherDate,
      billNo,
      billDate,
      chequeNo,
      chequeDate,
      chequeName,
      cashAccount,
      bankAccount,
      ledgerType,
      category,
      type: selectedType,
      narration: overallNarration || 'Adjusting operational journals',
      tdsEnabled,
      stEnabled,
      serviceTaxEnabled,
      tdsAmount: runningTotals.tdsVal,
      stAmount: runningTotals.stVal,
      totalAmount: runningTotals.total,
      items: lineItems,
      userName: editingVoucherId ? 'power-modifier' : 'SIVA',
      createdAt: new Date().toISOString()
    };

    if (editingVoucherId) {
      setVouchers(prev => prev.map(v => v.id === editingVoucherId ? compiled : v));
      logAudit("Save Journal Voucher", `Modified historical ${selectedType} voucher ${compiled.voucherNo}`);
    } else {
      setVouchers(prev => [compiled, ...prev]);
      logAudit("Add Journal Voucher", `Created brand new transaction entry ${compiled.voucherNo} of type ${selectedType}`);
    }

    alert("Double-entry accounting voucher cataloged successfully!");
    handleResetForm();
  };

  const handleDeleteVoucher = (id: string) => {
    if (!confirm("Are you sure you want to permanently reverse and delete this bookkeeping transaction?")) return;
    setVouchers(prev => prev.filter(v => v.id !== id));
    logAudit("Reversed Transaction", `Reversed and erased voucher ID ${id}`);
  };

  // Pre-filter records to display matching selected category or lookup query
  const filteredVouchersList = useMemo(() => {
    return vouchers.filter(v => {
      const matchType = v.type === selectedType;
      const matchQuery = v.voucherNo.includes(searchQuery) || v.narration.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && (searchQuery === '' || matchQuery);
    });
  }, [vouchers, selectedType, searchQuery]);

  const categories: { key: SelectedType; label: string }[] = [
    { key: 'JV', label: 'Journal Voucher' },
    { key: 'CP', label: 'Cash Payment' },
    { key: 'BP', label: 'Bank Payment' },
    { key: 'CR', label: 'Cash Receipt' },
    { key: 'BR', label: 'Bank Receipt' },
    { key: 'CONTRA', label: 'Contra Entry' },
    { key: 'PROVISION', label: 'Provisions Entry' },
    { key: 'REVERSE_BILL', label: 'Reverse Bill' },
    { key: 'DN', label: 'Debit Note' },
    { key: 'CN', label: 'Credit Note' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full p-4 overflow-hidden">
      
      {/* Category selector left sidebar */}
      <div className="w-full lg:w-64 bg-white border border-slate-200 rounded-lg shadow-xs p-2 flex flex-col gap-1 overflow-y-auto">
        <div className="p-3 font-semibold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-2">
          VOUCHERS DIRECTORY
        </div>
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => {
              setSelectedType(cat.key);
              setSearchQuery('');
              handleResetForm();
            }}
            className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-150 flex items-center justify-between ${
              selectedType === cat.key
                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Form Worksheets */}
      <form onSubmit={handleSaveVoucher} className="flex-1 bg-white border border-slate-200 rounded-lg shadow-xs p-6 flex flex-col justify-between overflow-hidden">
        
        {/* Workspace Header */}
        <div className="border-b border-slate-100 pb-4 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5 uppercase">
              <ShieldCheck className="w-5 h-5 text-blue-600" /> {categories.find(c => c.key === selectedType)?.label} Entry
            </h2>
            <p className="text-xs text-slate-400">Record double-entry ledger listings inside Kayaar Exports books.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded text-xs transition-all"
            >
              Reset Sheet
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shadow-xs transition-all"
            >
              Save Transaction
            </button>
          </div>
        </div>

        {/* Dynamic Fields Form Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-lg border border-slate-150 mb-4 text-xs">
          
          {/* Voucher metadata */}
          <div>
            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Voucher No</label>
            <input
              type="text"
              required
              placeholder="Auto-numbered"
              value={voucherNo}
              onChange={e => setVoucherNo(e.target.value)}
              className="w-full border border-slate-200 bg-white rounded p-1.5 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Voucher Date</label>
            <input
              type="date"
              required
              value={voucherDate}
              onChange={e => setVoucherDate(e.target.value)}
              className="w-full border border-slate-200 bg-white rounded p-1.5"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Bill / Invoice Reference No</label>
            <input
              type="text"
              placeholder="e.g. 176"
              value={billNo}
              onChange={e => setBillNo(e.target.value)}
              className="w-full border border-slate-200 bg-white rounded p-1.5"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Bill Reference Date</label>
            <input
              type="date"
              value={billDate}
              onChange={e => setBillDate(e.target.value)}
              className="w-full border border-slate-200 bg-white rounded p-1.5"
            />
          </div>

          {/* Type specific fields like cashPayment cashAccount or bankPayment bankAccount */}
          {['CP', 'CR', 'CONTRA'].includes(selectedType) && (
            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Cash Account Head</label>
              <select
                value={cashAccount}
                onChange={e => setCashAccount(e.target.value)}
                className="w-full border border-slate-200 bg-white rounded p-1.5 font-bold"
              >
                <option value="CASH - MILL">CASH - MILL</option>
                <option value="CASH - HEAD OFFICE">CASH - HEAD OFFICE</option>
                <option value="CASH - STORES">CASH - STORES</option>
              </select>
            </div>
          )}

          {['BP', 'BR', 'CONTRA'].includes(selectedType) && (
            <>
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Bank Account</label>
                <select
                  value={bankAccount}
                  onChange={e => setBankAccount(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded p-1.5 font-bold text-blue-700"
                >
                  <option value="IOB K.R.NAGAR A/C 10035">IOB K.R.NAGAR A/C 10035</option>
                  <option value="CASH - STORES">SBI OVERDRAFT A/C 49911</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Cheque Number</label>
                <input
                  type="text"
                  placeholder="e.g. 953919"
                  value={chequeNo}
                  onChange={e => setChequeNo(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded p-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Cheque Name Tag</label>
                <input
                  type="text"
                  placeholder="e.g. KAYAAR EXPORTS"
                  value={chequeName}
                  onChange={e => setChequeName(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded p-1.5"
                />
              </div>
            </>
          )}

          {/* Tax selections triggers */}
          <div className="col-span-2 lg:col-span-4 flex gap-4 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-1.5 font-bold text-slate-500 uppercase cursor-pointer select-none">
              <input
                type="checkbox"
                checked={tdsEnabled}
                onChange={e => setTdsEnabled(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-1"
              />
              TDS Entry Enabled (2%)
            </label>
            <label className="flex items-center gap-1.5 font-bold text-slate-500 uppercase cursor-pointer select-none">
              <input
                type="checkbox"
                checked={stEnabled}
                onChange={e => setStEnabled(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-1"
              />
              S.T. / Service Tax Enabled (4%)
            </label>
          </div>

        </div>

        {/* Core Double Entry Ledger Grid */}
        <div className="flex-1 overflow-y-auto mb-4 border border-slate-150 rounded-lg">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-slate-500 font-bold uppercase w-12 text-center">Row</th>
                <th className="p-3 text-slate-500 font-bold uppercase w-64">Account Head Name</th>
                <th className="p-3 text-slate-500 font-bold uppercase">Line Narration Description</th>
                <th className="p-3 text-slate-500 font-bold uppercase w-32 text-right">Debit (Rs)</th>
                <th className="p-3 text-slate-500 font-bold uppercase w-32 text-right">Credit (Rs)</th>
                <th className="p-3 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineItems.map((itm, index) => (
                <tr key={itm.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 text-slate-400 font-mono text-center">{index + 1}</td>
                  <td className="p-2">
                    <select
                      value={itm.accountCode}
                      onChange={e => handleUpdateLine(itm.id, { accountCode: e.target.value })}
                      className="w-full border border-slate-200 bg-white rounded p-1 font-sans text-xs font-semibold"
                    >
                      {accounts.map(acc => (
                        <option key={acc.code} value={acc.code}>{acc.name} ({acc.code})</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Specify optional line details..."
                      value={itm.narration}
                      onChange={e => handleUpdateLine(itm.id, { narration: e.target.value })}
                      className="w-full border border-slate-150 bg-white rounded p-1 text-xs outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={itm.debit || ''}
                      onChange={e => handleUpdateLine(itm.id, { debit: Number(e.target.value), credit: 0 })}
                      className="w-full border border-slate-200 bg-white rounded p-1 font-mono text-right text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={itm.credit || ''}
                      onChange={e => handleUpdateLine(itm.id, { credit: Number(e.target.value), debit: 0 })}
                      className="w-full border border-slate-200 bg-white rounded p-1 font-mono text-right text-xs"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(itm.id)}
                      className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Quick Line Creator */}
          <div className="p-3 bg-slate-50 border-t border-slate-150 flex justify-between items-center">
            <button
              type="button"
              onClick={handleAddLineItem}
              className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline"
            >
              + Add Voucher Line Item
            </button>
            <span className="text-[10px] text-slate-400">Pressing Enter within fields preserves calculations.</span>
          </div>
        </div>

        {/* Global Voucher Notes & Matching summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start border-t border-slate-100 pt-4 text-xs">
          <div>
            <label className="block text-slate-400 font-bold uppercase mb-1">Global Voucher Narration</label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Supply of Torch Light For Production Dept . Bill No 7/16.04.2026. ..."
              value={overallNarration}
              onChange={e => setOverallNarration(e.target.value)}
              className="w-full border border-slate-200 bg-white rounded p-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg font-bold flex flex-col justify-between self-stretch text-right font-mono">
            <div className="flex justify-between border-b pb-1 text-slate-500">
              <span className="font-sans font-normal">Active Debits Sum:</span>
              <span>Rs {runningTotals.debits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-b pb-1 mt-1 text-slate-500">
              <span className="font-sans font-normal">Active Credits Sum:</span>
              <span>Rs {runningTotals.credits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {tdsEnabled && (
              <div className="flex justify-between text-orange-600 border-b pb-1 mt-1 text-[11px]">
                <span className="font-sans font-normal">Auto Deduct TDS Carry (2%):</span>
                <span>- Rs {runningTotals.tdsVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-blue-600 text-sm mt-2">
              <span className="font-sans">NET BALANCING AMOUNT:</span>
              <span className="text-base">Rs {runningTotals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Active Vouchers Category List Picker */}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Recorded {categories.find(c => c.key === selectedType)?.label} Transactions
            </h4>
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded text-xs"
              />
            </div>
          </div>

          <div className="max-h-[160px] overflow-y-auto border border-slate-100 rounded text-xs font-mono">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50 font-sans">
                <tr>
                  <th className="p-2 text-slate-500 font-bold uppercase">No / ID</th>
                  <th className="p-2 text-slate-500 font-bold uppercase">Date</th>
                  <th className="p-2 text-slate-500 font-bold uppercase">Narration</th>
                  <th className="p-2 text-slate-500 font-bold uppercase text-right">Sum</th>
                  <th className="p-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchersList.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="p-2 font-bold text-indigo-600">{v.voucherNo}</td>
                    <td className="p-2 text-slate-500">{v.voucherDate}</td>
                    <td className="p-2 text-slate-600 font-sans italic truncate max-w-xs">{v.narration}</td>
                    <td className="p-2 text-right font-bold text-blue-700">{v.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-2 text-right">
                      <div className="flex justify-end gap-1.5 font-sans">
                        <button
                          type="button"
                          onClick={() => triggerPrint(v, null)}
                          className="px-2 py-0.5 border border-slate-200 text-slate-500 text-[10px] rounded hover:bg-slate-100 flex items-center gap-0.5 font-semibold"
                        >
                          <Printer className="w-3 h-3" /> Ledger Print
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectVoucherToEdit(v)}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded hover:bg-blue-100 font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVoucher(v.id)}
                          className="p-1 hover:bg-red-50 text-red-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredVouchersList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center font-sans text-slate-400">
                      No recorded vouchers of this category. Fill dynamic sheets above to insert a row.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </form>
    </div>
  );
}
