import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Check, X, Database, ListFilter } from 'lucide-react';

export default function MastersSection({
  accounts, groups, subgroups, tdsMasters, serviceTaxMasters,
  plSettings, bsMainGroups, bsGroups, billWiseOpenings, reverseTypes,
  setAccounts, setGroups, setSubgroups, setTdsMasters, setServiceTaxMasters,
  setPlSettings, setBsMainGroups, setBsGroups, setBillWiseOpenings, setReverseTypes,
  logAudit
}) {
  
  const [activeTab, setActiveTab] = useState('accounts');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states depending on what is being edited
  const [formAccount, setFormAccount] = useState({});
  const [formGroup, setFormGroup] = useState({});
  const [formSubgroup, setFormSubgroup] = useState({});
  const [formTds, setFormTds] = useState({});
  const [formSeviceTax, setFormServiceTax] = useState({});
  const [formPlSetting, setFormPlSetting] = useState({});
  const [formBsMain, setFormBsMain] = useState({});
  const [formBsGroup, setFormBsGroup] = useState({});
  const [formBillOpening, setFormBillOpening] = useState({});
  const [formReverseType, setFormReverseType] = useState({});

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormAccount({});
    setFormGroup({ id: 'GRP-' + Date.now() });
    setFormSubgroup({ id: 'SUB-' + Date.now() });
    setFormTds({ code: 'TDS-' + Math.floor(Math.random() * 100) });
    setFormServiceTax({ code: 'ST-' + Math.floor(Math.random() * 100) });
    setFormPlSetting({ id: 'PL-' + Date.now() });
    setFormBsMain({});
    setFormBsGroup({ defaultType: 'Debit' });
    setFormBillOpening({ id: 'BWO-' + Date.now(), billDate: new Date().toISOString().split('T')[0] });
    setFormReverseType({ purchaseType: '', gstWithFF: false });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    if (activeTab === 'accounts') setFormAccount({ ...item });
    else if (activeTab === 'group') setFormGroup({ ...item });
    else if (activeTab === 'subgroup') setFormSubgroup({ ...item });
    else if (activeTab === 'tds') setFormTds({ ...item });
    else if (activeTab === 'servicetax') setFormServiceTax({ ...item });
    else if (activeTab === 'plsettings') setFormPlSetting({ ...item });
    else if (activeTab === 'bsmain') setFormBsMain({ ...item });
    else if (activeTab === 'bsgroup') setFormBsGroup({ ...item });
    else if (activeTab === 'billwise') setFormBillOpening({ ...item });
    else if (activeTab === 'reverse') setFormReverseType({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (activeTab === 'accounts') {
      const acc = formAccount;
      if (!acc.code || !acc.name) return alert("Code and Name are required");
      if (editingItem) {
        setAccounts(prev => prev.map(a => a.code === editingItem.code ? acc : a));
        logAudit("Edit Account Master", `Updated account ${acc.code} - ${acc.name}`);
      } else {
        if (accounts.some(a => a.code === acc.code)) return alert("Code already exists");
        setAccounts(prev => [...prev, acc]);
        logAudit("Add Account Master", `Created account ${acc.code} - ${acc.name}`);
      }
    } else if (activeTab === 'group') {
      const grp = formGroup;
      if (!grp.name || !grp.mainDescription) return alert("Name and Main description required");
      if (editingItem) {
        setGroups(prev => prev.map(g => g.id === editingItem.id ? grp : g));
        logAudit("Edit Group", `Updated Group ${grp.name}`);
      } else {
        setGroups(prev => [...prev, grp]);
        logAudit("Add Group", `Created Group ${grp.name}`);
      }
    } else if (activeTab === 'subgroup') {
      const sub = formSubgroup;
      if (!sub.name || !sub.groupName) return alert("Name and parent Group are required");
      if (editingItem) {
        setSubgroups(prev => prev.map(s => s.id === editingItem.id ? sub : s));
        logAudit("Edit Subgroup", `Updated Subgroup ${sub.name}`);
      } else {
        setSubgroups(prev => [...prev, sub]);
        logAudit("Add Subgroup", `Created Subgroup ${sub.name}`);
      }
    } else if (activeTab === 'tds') {
      const tds = formTds;
      if (!tds.code || !tds.name) return alert("Code and Name are required");
      if (editingItem) {
        setTdsMasters(prev => prev.map(t => t.code === editingItem.code ? tds : t));
        logAudit("Edit TDS Master", `Updated TDS configuration ${tds.name}`);
      } else {
        setTdsMasters(prev => [...prev, tds]);
        logAudit("Add TDS Master", `Created TDS configuration ${tds.name}`);
      }
    } else if (activeTab === 'servicetax') {
      const st = formSeviceTax;
      if (!st.code || !st.name) return alert("Code and Name are required");
      if (editingItem) {
        setServiceTaxMasters(prev => prev.map(s => s.code === editingItem.code ? st : s));
        logAudit("Edit Service Tax Master", `Updated Service Tax ${st.name}`);
      } else {
        setServiceTaxMasters(prev => [...prev, st]);
        logAudit("Add Service Tax Master", `Created Service Tax ${st.name}`);
      }
    } else if (activeTab === 'plsettings') {
      const pl = formPlSetting;
      if (!pl.desc || !pl.accDesc) return alert("Description and Account description required");
      if (editingItem) {
        setPlSettings(prev => prev.map(p => p.id === editingItem.id ? pl : p));
        logAudit("Edit PL Settings", `Updated code ${pl.id}`);
      } else {
        setPlSettings(prev => [...prev, pl]);
        logAudit("Add PL Settings", `Created code ${pl.id}`);
      }
    } else if (activeTab === 'bsmain') {
      const bsm = formBsMain;
      if (!bsm.code || !bsm.description) return alert("Code and Description required");
      if (editingItem) {
        setBsMainGroups(prev => prev.map(b => b.code === editingItem.code ? bsm : b));
        logAudit("Edit BS Main Group", `Updated code ${bsm.code}`);
      } else {
        setBsMainGroups(prev => [...prev, bsm]);
        logAudit("Add BS Main Group", `Created code ${bsm.code}`);
      }
    } else if (activeTab === 'bsgroup') {
      const bsg = formBsGroup;
      if (!bsg.code || !bsg.bsGroup) return alert("Code and BS Group name required");
      if (editingItem) {
        setBsGroups(prev => prev.map(b => b.code === editingItem.code ? bsg : b));
        logAudit("Edit BS Group", `Updated code ${bsg.code}`);
      } else {
        setBsGroups(prev => [...prev, bsg]);
        logAudit("Add BS Group", `Created code ${bsg.code}`);
      }
    } else if (activeTab === 'billwise') {
      const bwo = formBillOpening;
      if (!bwo.partyName || !bwo.billNo) return alert("Party Name and Bill No required");
      if (editingItem) {
        setBillWiseOpenings(prev => prev.map(b => b.id === editingItem.id ? bwo : b));
        logAudit("Edit Bill-Wise Opening", `Updated bill ${bwo.billNo}`);
      } else {
        setBillWiseOpenings(prev => [...prev, bwo]);
        logAudit("Add Bill-Wise Opening", `Created bill ${bwo.billNo}`);
      }
    } else if (activeTab === 'reverse') {
      const rt = formReverseType;
      if (!rt.code || !rt.name) return alert("Code and Type Name required");
      if (editingItem) {
        setReverseTypes(prev => prev.map(r => r.code === editingItem.code ? rt : r));
        logAudit("Edit Reverse Type", `Updated reverse type ${rt.name}`);
      } else {
        setReverseTypes(prev => [...prev, rt]);
        logAudit("Add Reverse Type", `Created reverse type ${rt.name}`);
      }
    }
    setIsModalOpen(false);
  };

  const handleDelete = (item) => {
    if (!confirm("Are you sure you want to delete this master definition?")) return;

    if (activeTab === 'accounts') {
      setAccounts(prev => prev.filter(a => a.code !== item.code));
      logAudit("Delete Account Master", `Deleted Account ${item.code}`);
    } else if (activeTab === 'group') {
      setGroups(prev => prev.filter(g => g.id !== item.id));
      logAudit("Delete Group", `Deleted Group ${item.name}`);
    } else if (activeTab === 'subgroup') {
      setSubgroups(prev => prev.filter(s => s.id !== item.id));
      logAudit("Delete Subgroup", `Deleted Subgroup ${item.name}`);
    } else if (activeTab === 'tds') {
      setTdsMasters(prev => prev.filter(t => t.code !== item.code));
      logAudit("Delete TDS Master", `Deleted TDS ${item.name}`);
    } else if (activeTab === 'servicetax') {
      setServiceTaxMasters(prev => prev.filter(s => s.code !== item.code));
      logAudit("Delete Service Tax Master", `Deleted ST ${item.name}`);
    } else if (activeTab === 'plsettings') {
      setPlSettings(prev => prev.filter(p => p.id !== item.id));
    } else if (activeTab === 'bsmain') {
      setBsMainGroups(prev => prev.filter(b => b.code !== item.code));
    } else if (activeTab === 'bsgroup') {
      setBsGroups(prev => prev.filter(b => b.code !== item.code));
    } else if (activeTab === 'billwise') {
      setBillWiseOpenings(prev => prev.filter(b => b.id !== item.id));
    } else if (activeTab === 'reverse') {
      setReverseTypes(prev => prev.filter(r => r.code !== item.code));
    }
  };

  const tabs = [
    { key: 'accounts', label: 'Accounts Master' },
    { key: 'group', label: 'Group Master' },
    { key: 'subgroup', label: 'Sub Group Master' },
    { key: 'tds', label: 'TDS Master' },
    { key: 'servicetax', label: 'Service Tax Master' },
    { key: 'plsettings', label: 'P & L Settings' },
    { key: 'bsmain', label: 'B S Main Group' },
    { key: 'bsgroup', label: 'B S Group' },
    { key: 'billwise', label: 'Bill-Wise Opening' },
    { key: 'reverse', label: 'Reverse Type' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full p-4 overflow-hidden">
      {/* Tab sidebar */}
      <div className="w-full md:w-64 bg-white border border-slate-200 rounded-lg shadow-xs p-2 flex flex-col gap-1 overflow-y-auto">
        <div className="p-3 font-semibold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center gap-1.5 mb-2">
          <Database className="w-4 h-4 text-slate-500" /> Database Masters
        </div>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setSearchQuery(''); }}
            className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-150 flex items-center justify-between ${
              activeTab === t.key
                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
            }`}
          >
            {t.label}
            {activeTab === t.key && <Check className="w-4 h-4 text-blue-600" />}
          </button>
        ))}
      </div>

      {/* Main Master Workspace */}
      <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-xs p-6 flex flex-col overflow-hidden">
        
        {/* Workspace Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-100 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {tabs.find(t => t.key === activeTab)?.label}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure database records and ledger assignments for the accounting workspace.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Record
          </button>
        </div>

        {/* Search controls */}
        <div className="mb-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search records across keys..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
          />
        </div>

        {/* Listing content depending on chosen Tab */}
        <div className="flex-1 overflow-x-auto overflow-y-auto border border-slate-100 rounded-md text-sm">
          {activeTab === 'accounts' && (
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase">Code</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase">Account Name</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase">Sub Group</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase">Place</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase text-right">Debit</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase text-right">Credit</th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.code.includes(searchQuery)).map(a => (
                  <tr key={a.code} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-mono font-semibold text-xs text-indigo-600">{a.code}</td>
                    <td className="p-3 font-medium text-slate-800">{a.name}</td>
                    <td className="p-3 text-slate-500 text-xs">{a.subGroupName || '-'}</td>
                    <td className="p-3 text-slate-500">{a.place}</td>
                    <td className="p-3 text-right font-mono text-xs font-semibold text-emerald-600">{a.openingDebit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono text-xs font-semibold text-orange-600">{a.openingCredit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleOpenEditModal(a)} className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(a)} className="p-1 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'group' && (
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase">Group Description</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase">Main Group Category</th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())).map(g => (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{g.name}</td>
                    <td className="p-3 text-blue-600 font-medium text-xs uppercase">{g.mainDescription}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleOpenEditModal(g)} className="p-1 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(g)} className="p-1 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'subgroup' && (
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase">Sub Group</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase">Parent Group</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase">Ledger Type</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase text-right">TB SlNo</th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subgroups.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{s.name}</td>
                    <td className="p-3 text-slate-500">{s.groupName}</td>
                    <td className="p-3 text-xs"><span className={`px-2 py-0.5 rounded font-bold ${s.ledgerType === 'SUB LEDGER' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-slate-50 text-slate-600'}`}>{s.ledgerType}</span></td>
                    <td className="p-3 text-right font-mono text-slate-600">{s.tbSlNo}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleOpenEditModal(s)} className="p-1 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(s)} className="p-1 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'tds' && (
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase">Code</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase">TDS Name</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase text-right">TDS %</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase text-right">S.C. %</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase">Account Head</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase">Section</th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tdsMasters.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map(t => (
                  <tr key={t.code} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs">{t.code}</td>
                    <td className="p-3 font-bold text-slate-800">{t.name}</td>
                    <td className="p-3 text-right font-mono font-semibold text-blue-600">{t.tdsPercentage}%</td>
                    <td className="p-3 text-right font-mono text-slate-500">{t.scPercentage}%</td>
                    <td className="p-3 text-slate-600 text-xs">{t.accountHeadName}</td>
                    <td className="p-3 font-mono text-xs text-orange-600">{t.sectionCode}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleOpenEditModal(t)} className="p-1 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(t)} className="p-1 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'servicetax' && (
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase">Code</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase">Tax Name</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase text-right">Tax Rate %</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase text-right">S.C %</th>
                  <th className="p-3 text-slate-500 font-bold text-xs uppercase text-right">Chess %</th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceTaxMasters.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
                  <tr key={s.code} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs">{s.code}</td>
                    <td className="p-3 font-bold text-slate-800">{s.name}</td>
                    <td className="p-3 text-right font-mono font-semibold text-indigo-600">{s.taxPercentage}%</td>
                    <td className="p-3 text-right font-mono text-slate-500">{s.scPercentage}%</td>
                    <td className="p-3 text-right font-mono text-slate-500">{s.chessPercentage}%</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleOpenEditModal(s)} className="p-1 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(s)} className="p-1 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Simple fallback lists for other nested configurations */}
          {['plsettings', 'bsmain', 'bsgroup', 'billwise', 'reverse'].includes(activeTab) && (
            <div className="p-4 bg-slate-50/40 text-slate-600 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="max-w-md w-full">
                <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 mb-1">Advanced Master Fields Loaded</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Showing active system rows linked directly with balance calculators, tax formulations, and report generation engines.
                </p>
                <div className="text-left bg-white p-3 rounded border border-slate-200 text-xs font-mono max-h-[160px] overflow-y-auto">
                  {activeTab === 'plsettings' && plSettings.map(p => <div key={p.id} className="py-1 border-b border-slate-100 flex justify-between"><span>{p.desc} ➜ {p.accDesc}</span><span className="text-slate-400 font-bold">{p.slNo}</span></div>)}
                  {activeTab === 'bsmain' && bsMainGroups.map(p => <div key={p.code} className="py-1 border-b border-slate-100 flex justify-between"><span>{p.description}</span><span className="text-slate-400 font-bold">{p.code}</span></div>)}
                  {activeTab === 'bsgroup' && bsGroups.map(p => <div key={p.code} className="py-1 border-b border-slate-100 flex justify-between"><span>{p.bsGroup} / {p.accGroup}</span><span className="text-slate-400 font-bold">{p.defaultType}</span></div>)}
                  {activeTab === 'billwise' && billWiseOpenings.map(p => <div key={p.id} className="py-1 border-b border-slate-100 flex justify-between"><span>{p.partyName} (Bill {p.billNo})</span><span className="text-slate-400 font-bold">{p.debit > 0 ? `Dr ${p.debit}` : `Cr ${p.credit}`}</span></div>)}
                  {activeTab === 'reverse' && reverseTypes.map(p => <div key={p.code} className="py-1 border-b border-slate-100 flex justify-between"><span>{p.name}</span><button onClick={() => handleDelete(p)} className="text-red-500 text-[10px]">Delete</button></div>)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Add Record Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full flex flex-col p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6Shared">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingItem ? 'Edit Master Record' : 'Create New Master Record'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-4 max-h-[70vh] pr-1">
              {activeTab === 'accounts' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Code</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingItem}
                      value={formAccount.code || ''}
                      onChange={e => setFormAccount(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Name</label>
                    <input
                      type="text"
                      required
                      value={formAccount.name || ''}
                      onChange={e => setFormAccount(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-slate-200 rounded p-2 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parent Sub Group</label>
                    <select
                      value={formAccount.subGroupName || ''}
                      onChange={e => setFormAccount(prev => ({ ...prev, subGroupName: e.target.value }))}
                      className="w-full border border-slate-200 rounded p-2 text-sm focus:border-blue-500 outline-none"
                    >
                      <option value="">-- Choose Subgroup --</option>
                      {subgroups.map(s => <option key={s.id} value={s.name}>{s.name} ({s.groupName})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Place / City</label>
                      <input
                        type="text"
                        value={formAccount.place || ''}
                        onChange={e => setFormAccount(prev => ({ ...prev, place: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-2 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Person</label>
                      <input
                        type="text"
                        value={formAccount.contactPerson || ''}
                        onChange={e => setFormAccount(prev => ({ ...prev, contactPerson: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Opening Debit (Rs)</label>
                      <input
                        type="number"
                        min="0"
                        value={formAccount.openingDebit || 0}
                        onChange={e => setFormAccount(prev => ({ ...prev, openingDebit: Number(e.target.value) }))}
                        className="w-full border border-slate-200 rounded p-2 text-sm font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Opening Credit (Rs)</label>
                      <input
                        type="number"
                        min="0"
                        value={formAccount.openingCredit || 0}
                        onChange={e => setFormAccount(prev => ({ ...prev, openingCredit: Number(e.target.value) }))}
                        className="w-full border border-slate-200 rounded p-2 text-sm font-mono outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'group' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Group Description</label>
                    <input
                      type="text"
                      required
                      value={formGroup.name || ''}
                      onChange={e => setFormGroup(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-slate-200 rounded p-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Main Group Type / Category</label>
                    <select
                      value={formGroup.mainDescription || ''}
                      onChange={e => setFormGroup(prev => ({ ...prev, mainDescription: e.target.value }))}
                      className="w-full border border-slate-200 rounded p-2 text-sm outline-none"
                    >
                      <option value="">Select Main Category</option>
                      <option value="Assets">Assets</option>
                      <option value="Liabilities">Liabilities</option>
                      <option value="Incomes">Incomes</option>
                      <option value="Expenses">Expenses</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'subgroup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sub Group Description</label>
                    <input
                      type="text"
                      required
                      value={formSubgroup.name || ''}
                      onChange={e => setFormSubgroup(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-slate-200 rounded p-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parent Group Description</label>
                    <select
                      value={formSubgroup.groupName || ''}
                      onChange={e => setFormSubgroup(prev => ({ ...prev, groupName: e.target.value }))}
                      className="w-full border border-slate-200 rounded p-2 text-sm outline-none"
                    >
                      <option value="">Select Group</option>
                      {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ledger Assignment Type</label>
                    <select
                      value={formSubgroup.ledgerType || ''}
                      onChange={e => setFormSubgroup(prev => ({ ...prev, ledgerType: e.target.value }))}
                      className="w-full border border-slate-200 rounded p-2 text-sm outline-none"
                    >
                      <option value="GENERAL LEDGER">GENERAL LEDGER</option>
                      <option value="SUB LEDGER">SUB LEDGER</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'tds' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">TDS Identifier Code</label>
                    <input
                      type="text"
                      required
                      value={formTds.code || ''}
                      onChange={e => setFormTds(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full border border-slate-200 rounded p-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">TDS Name</label>
                    <input
                      type="text"
                      required
                      value={formTds.name || ''}
                      onChange={e => setFormTds(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-slate-200 rounded p-2 text-sm outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">TDS Rate %</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formTds.tdsPercentage || ''}
                        onChange={e => setFormTds(prev => ({ ...prev, tdsPercentage: Number(e.target.value) }))}
                        className="w-full border border-slate-200 rounded p-2 text-sm font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Surcharges Rate %</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formTds.scPercentage || 0}
                        onChange={e => setFormTds(prev => ({ ...prev, scPercentage: Number(e.target.value) }))}
                        className="w-full border border-slate-200 rounded p-2 text-sm font-mono outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Head Name / Code</label>
                    <input
                      type="text"
                      placeholder="e.g. TDS ON CONTRACTORS 2%"
                      value={formTds.accountHeadName || ''}
                      onChange={e => setFormTds(prev => ({ ...prev, accountHeadName: e.target.value }))}
                      className="w-full border border-slate-200 rounded p-2 text-sm outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'servicetax' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Service Tax Code</label>
                    <input
                      type="text"
                      required
                      value={formSeviceTax.code || ''}
                      onChange={e => setFormServiceTax(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full border border-slate-200 rounded p-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tax Name</label>
                    <input
                      type="text"
                      required
                      value={formSeviceTax.name || ''}
                      onChange={e => setFormServiceTax(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-slate-200 rounded p-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tax Percentage %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formSeviceTax.taxPercentage || 15}
                      onChange={e => setFormServiceTax(prev => ({ ...prev, taxPercentage: Number(e.target.value) }))}
                      className="w-full border border-slate-200 rounded p-2 text-sm outline-none"
                    />
                  </div>
                </>
              )}

              {/* Minimal placeholders for general advanced master popups */}
              {!['accounts', 'group', 'subgroup', 'tds', 'servicetax'].includes(activeTab) && (
                <div className="py-4 bg-slate-50 p-4 rounded text-center text-xs text-slate-500">
                  Advanced relational schema. Form entry can be completed below or rows will utilize system defaults.
                  <input
                    type="text"
                    required
                    placeholder="Enter identifying tag or label"
                    className="w-full border border-slate-200 rounded p-2 mt-4 text-xs font-mono"
                    onChange={e => {
                      if (activeTab === 'plsettings') setFormPlSetting(p => ({ ...p, desc: e.target.value, accDesc: e.target.value }));
                      if (activeTab === 'bsmain') setFormBsMain(p => ({ ...p, description: e.target.value }));
                      if (activeTab === 'bsgroup') setFormBsGroup(p => ({ ...p, bsGroup: e.target.value, accGroup: 'SYSTEM' }));
                      if (activeTab === 'billwise') setFormBillOpening(p => ({ ...p, partyName: e.target.value, billNo: 'B-' + Math.floor(Math.random() * 9999) }));
                      if (activeTab === 'reverse') setFormReverseType(p => ({ ...p, name: e.target.value }));
                    }}
                  />
                </div>
              )}

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded text-sm hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold shadow-xs"
                >
                  {activeTab === 'accounts' ? 'Update' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
