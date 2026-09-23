import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Database, 
  BarChart3, 
  FileText, 
  Users, 
  Activity, 
  FileCheck2, 
  ChevronRight, 
  UserCheck 
} from 'lucide-react';

import VouchersSection from './components/VouchersSection';
import MastersSection from './components/MastersSection';
import ReportsSection from './components/ReportsSection';
import PrintViewer from './components/PrintViewer';

import { Group, SubGroup, Account, TDSMaster, ServiceTaxMaster, PLSetting, BSMainGroup, BSGroup, BillWiseOpening, ReverseType, Voucher, AuditLog } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vouchers' | 'masters' | 'reports' | 'audit'>('dashboard');

  // PRINT DRAWER POPUPS GLOBAL TRIGGER
  const [printVoucher, setPrintVoucher] = useState<Voucher | null>(null);
  const [printReportData, setPrintReportData] = useState<any | null>(null);
  const [isPrintViewerOpen, setIsPrintViewerOpen] = useState(false);

  // Standard state definitions managed dynamically via the separates backend Express server API
  const [groups, setGroupsState] = useState<Group[]>([]);
  const [subgroups, setSubgroupsState] = useState<SubGroup[]>([]);
  const [accounts, setAccountsState] = useState<Account[]>([]);
  const [tdsMasters, setTdsMastersState] = useState<TDSMaster[]>([]);
  const [serviceTaxMasters, setServiceTaxMastersState] = useState<ServiceTaxMaster[]>([]);
  const [plSettings, setPlSettingsState] = useState<PLSetting[]>([]);
  const [bsMainGroups, setBsMainGroupsState] = useState<BSMainGroup[]>([]);
  const [bsGroups, setBsGroupsState] = useState<BSGroup[]>([]);
  const [billWiseOpenings, setBillWiseOpeningsState] = useState<BillWiseOpening[]>([]);
  const [reverseTypes, setReverseTypesState] = useState<ReverseType[]>([]);
  const [vouchers, setVouchersState] = useState<Voucher[]>([]);
  const [auditLogs, setAuditLogsState] = useState<AuditLog[]>([]);

  // Simple Action audits logging helper
  const logAudit = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: 'AUD-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      timestamp: new Date().toLocaleString(),
      userName: 'SIVA',
      action,
      details
    };
    setAuditLogsState(prev => [newLog, ...prev]);
    fetch('/ams/audit', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, details })
    });
  };

  // Load database state directly from Express backend API, eliminating hardcoded seeds
  const fetchDatabaseState = async () => {
    try {
      const response = await fetch('/ams/db');
      if (response.ok) {
        const data = await response.json();
        setGroupsState(data.groups || []);
        setSubgroupsState(data.subGroups || []);
        setAccountsState(data.accounts || []);
        setTdsMastersState(data.tds || []);
        setServiceTaxMastersState(data.serviceTax || []);
        setPlSettingsState(data.plSettings || []);
        setBsMainGroupsState(data.bsMainGroups || []);
        setBsGroupsState(data.bsGroups || []);
        setBillWiseOpeningsState(data.billWiseOpenings || []);
        setReverseTypesState(data.reverseTypes || []);
        setVouchersState(data.vouchers || []);
        setAuditLogsState(data.auditLogs || []);
      }
    } catch (e) {
      console.error("Failed to load ERP database from server", e);
    }
  };

  useEffect(() => {
    fetchDatabaseState();
  }, []);

  // Sync setter factories to map client actions cleanly to individual REST resource paths
  const createSyncSetter = <T extends { id?: string; code?: string }>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    endpoint: string,
    idField: 'id' | 'code' = 'id'
  ) => {
    return (action: React.SetStateAction<T[]>) => {
      setter(prev => {
        const next = typeof action === 'function' ? (action as Function)(prev) : action;
        
        if (next.length > prev.length) {
          const added = next.find((n: any) => !prev.some((p: any) => p[idField] === n[idField]));
          if (added) {
            fetch(`/ams/${endpoint}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(added)
            }).then(() => fetchDatabaseState());
          }
        } else if (next.length < prev.length) {
          const deleted = prev.find((p: any) => !next.some((n: any) => n[idField] === p[idField]));
          if (deleted) {
            const delValue = deleted[idField];
            fetch(`/ams/${endpoint}/${delValue}`, {
              method: 'DELETE'
            }).then(() => fetchDatabaseState());
          }
        } else {
          const modified = next.find((n: any) => {
            const p = prev.find((item: any) => item[idField] === n[idField]);
            return p && JSON.stringify(p) !== JSON.stringify(n);
          });
          if (modified) {
            fetch(`/ams/${endpoint}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(modified)
            }).then(() => fetchDatabaseState());
          }
        }
        return next;
      });
    };
  };

  const setGroups = createSyncSetter<Group>(setGroupsState, 'groups', 'id');
  const setSubgroups = createSyncSetter<SubGroup>(setSubgroupsState, 'subgroups', 'id');
  const setAccounts = createSyncSetter<Account>(setAccountsState, 'accounts', 'code');
  const setTdsMasters = createSyncSetter<TDSMaster>(setTdsMastersState, 'tds', 'code');
  const setServiceTaxMasters = createSyncSetter<ServiceTaxMaster>(setServiceTaxMastersState, 'servicetax', 'code');
  const setPlSettings = createSyncSetter<PLSetting>(setPlSettingsState, 'plsettings', 'id');
  const setBsMainGroups = setBsMainGroupsState;
  const setBsGroups = createSyncSetter<BSGroup>(setBsGroupsState, 'bsgroups', 'code');
  const setBillWiseOpenings = createSyncSetter<BillWiseOpening>(setBillWiseOpeningsState, 'bill-wise-openings', 'id');
  const setReverseTypes = createSyncSetter<ReverseType>(setReverseTypesState, 'reverse-charges', 'code');
  const setVouchers = createSyncSetter<Voucher>(setVouchersState, 'vouchers', 'id');
  const setAuditLogs = setAuditLogsState;

  // Global Dynamic KPIs for Home / Dashboard screen
  const dashboardStats = useMemo(() => {
    const totalTransactions = vouchers.length;
    let totalDebitTurnover = 0;
    vouchers.forEach(v => {
      totalDebitTurnover += v.totalAmount;
    });

    const activeAcs = accounts.length;
    return {
      totalTransactions,
      totalDebitTurnover,
      activeAcs,
      tdsLiabilitiesCount: vouchers.filter(v => v.tdsEnabled).length
    };
  }, [vouchers, accounts]);

  // Handle loading print layout overlays
  const triggerPrint = (voucher: Voucher | null, reportData: any | null) => {
    setPrintVoucher(voucher);
    setPrintReportData(reportData);
    setIsPrintViewerOpen(true);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 text-slate-800 antialiased">
      
      {/* Top Banner & Company Header (Clean Minimalist Branding) */}
      <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shadow-xs shrink-0 select-none no-print">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-lg shadow-sm">
            K
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-900 tracking-tight uppercase">KAYAAR EXPORTS PRIVATE LIMITED</h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider font-mono">FINANCIAL WORKSPACE [ 2026 - 2027 ]</p>
          </div>
        </div>

        {/* User context metadata */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" /> SIVA (POWER ADMIN)
            </span>
            <span className="text-[9px] text-slate-400 font-mono">WORKSPACE LIVE: LOCAL</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shadow-inner">
            SI
          </div>
        </div>
      </header>

      {/* Main Body Layout splits Sidebar & Screens Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 select-none no-print">
          <div className="p-3 space-y-1">
            <div className="px-3.5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-2">
              Accounting Ledger
            </div>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-4 py-2.5 rounded text-xs font-semibold tracking-wide flex items-center gap-2.5 transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-50 text-blue-700 shadow-3xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600" /> Executive Dashboard
            </button>

            <button
              onClick={() => setActiveTab('vouchers')}
              className={`w-full text-left px-4 py-2.5 rounded text-xs font-semibold tracking-wide flex items-center gap-2.5 transition-all ${
                activeTab === 'vouchers' 
                  ? 'bg-blue-50 text-blue-700 shadow-3xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Voucher Entry Center
            </button>

            <button
              onClick={() => setActiveTab('masters')}
              className={`w-full text-left px-4 py-2.5 rounded text-xs font-semibold tracking-wide flex items-center gap-2.5 transition-all ${
                activeTab === 'masters' 
                  ? 'bg-blue-50 text-blue-700 shadow-3xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Database className="w-4 h-4 text-indigo-600" /> Database Masters
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full text-left px-4 py-2.5 rounded text-xs font-semibold tracking-wide flex items-center gap-2.5 transition-all ${
                activeTab === 'reports' 
                  ? 'bg-blue-50 text-blue-700 shadow-3xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-pink-600" /> Financial Reports
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full text-left px-4 py-2.5 rounded text-xs font-semibold tracking-wide flex items-center gap-2.5 transition-all ${
                activeTab === 'audit' 
                  ? 'bg-blue-50 text-blue-700 shadow-3xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4 text-orange-600" /> System Audit Logs
            </button>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="p-2 border border-blue-100 bg-blue-50/20 text-blue-800 text-[10px] rounded leading-relaxed">
              <span className="font-bold uppercase block text-blue-900 mb-1">Clean Minimalism Activated</span>
              This design enforces deep high-contrast Slate interfaces with zero tech larping or margin noise.
            </div>
          </div>
        </aside>

        {/* Dynamic Center Work Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative flex flex-col">
          
          {/* Main active category content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <div className="p-6 space-y-6">
                
                {/* Dashboard Header */}
                <div>
                  <h1 className="text-xl font-bold text-slate-800 tracking-tight">Executive Dashboard Summary</h1>
                  <p className="text-xs text-slate-400 mt-1">Real-time metrics calculated dynamically relative to active journal voucher ledgers.</p>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-white p-5 rounded-lg border border-slate-200/80 shadow-3xs flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Debit Turnover</span>
                      <span className="font-mono text-lg font-bold text-slate-800">Rs {dashboardStats.totalDebitTurnover.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center font-bold text-blue-600">Rs</div>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-slate-200/80 shadow-3xs flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sync Ledger Vouchers</span>
                      <span className="font-mono text-lg font-bold text-slate-800">{dashboardStats.totalTransactions} Sheets</span>
                    </div>
                    <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center font-bold text-emerald-600">✓</div>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-slate-200/80 shadow-3xs flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Active Accounts Master</span>
                      <span className="font-mono text-lg font-bold text-slate-800">{dashboardStats.activeAcs} Heads</span>
                    </div>
                    <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center font-bold text-indigo-600">DB</div>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-slate-200/80 shadow-3xs flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">TDS Liabilities Listed</span>
                      <span className="font-mono text-lg font-bold text-slate-800">{dashboardStats.tdsLiabilitiesCount} Bills</span>
                    </div>
                    <div className="w-8 h-8 rounded bg-orange-50 flex items-center justify-center font-bold text-orange-600">%</div>
                  </div>
                </div>

                {/* Lower sections: Quick Links & Recent Audits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Quick operational navigation help */}
                  <div className="bg-white p-6 rounded-lg border border-slate-200/80 shadow-3xs flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-2 border-b pb-2">Quick Navigation Shortcuts</h4>
                      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                        Access designated ERP modules directly. All inserts instantly reflect within cash books and dual balance calculations.
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <button onClick={() => { setActiveTab('vouchers'); }} className="p-3 bg-slate-50 border hover:bg-slate-100 rounded text-left font-bold transition-all flex items-center justify-between">Record Journal Voucher <ChevronRight className="w-4 h-4" /></button>
                        <button onClick={() => { setActiveTab('reports'); }} className="p-3 bg-slate-50 border hover:bg-slate-100 rounded text-left font-bold transition-all flex items-center justify-between">View Trial Balance <ChevronRight className="w-4 h-4" /></button>
                        <button onClick={() => { setActiveTab('masters'); }} className="p-3 bg-slate-50 border hover:bg-slate-100 rounded text-left font-bold transition-all flex items-center justify-between">Edit Account Master <ChevronRight className="w-4 h-4" /></button>
                        <button onClick={() => { setActiveTab('audit'); }} className="p-3 bg-slate-50 border hover:bg-slate-100 rounded text-left font-bold transition-all flex items-center justify-between">Audit Events Log <ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t text-[11px] text-slate-400 font-medium">
                      Operating Fiscal Ledger Cycle: <span className="font-mono select-all">01/04/2026</span> to <span className="font-mono select-all">31/03/2027</span>
                    </div>
                  </div>

                  {/* System chronological security audit trail */}
                  <div className="bg-white p-6 rounded-lg border border-slate-200/80 shadow-3xs flex flex-col">
                    <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-2 border-b pb-2 flex justify-between items-center">
                      <span>Recent Security Audits Log</span>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 text-slate-500 rounded font-mono font-bold">Active</span>
                    </h4>
                    
                    <div className="flex-1 overflow-y-auto max-h-[190px] text-xs font-mono division bg-slate-50/50 p-2 rounded">
                      {auditLogs.slice(0, 5).map(log => (
                        <div key={log.id} className="py-1.5 border-b border-slate-100 last:border-0 flex flex-col gap-0.5">
                          <div className="flex justify-between font-bold text-[10px]">
                            <span className="text-blue-600">{log.action}</span>
                            <span className="text-slate-400">{log.timestamp}</span>
                          </div>
                          <span className="text-slate-500 text-[10px] leading-relaxed">{log.details}</span>
                        </div>
                      ))}
                    </div>
                    
                    <button onClick={() => setActiveTab('audit')} className="text-xs text-blue-600 font-bold hover:underline text-left mt-3">
                      View all comprehensive audit registers ➜
                    </button>
                  </div>

                </div>

              </div>
            )}

            {activeTab === 'vouchers' && (
              <VouchersSection
                vouchers={vouchers}
                setVouchers={setVouchers}
                accounts={accounts}
                logAudit={logAudit}
                triggerPrint={triggerPrint}
              />
            )}

            {activeTab === 'masters' && (
              <MastersSection
                accounts={accounts}
                groups={groups}
                subgroups={subgroups}
                tdsMasters={tdsMasters}
                serviceTaxMasters={serviceTaxMasters}
                plSettings={plSettings}
                bsMainGroups={bsMainGroups}
                bsGroups={bsGroups}
                billWiseOpenings={billWiseOpenings}
                reverseTypes={reverseTypes}
                setAccounts={setAccounts}
                setGroups={setGroups}
                setSubgroups={setSubgroups}
                setTdsMasters={setTdsMasters}
                setServiceTaxMasters={setServiceTaxMasters}
                setPlSettings={setPlSettings}
                setBsMainGroups={setBsMainGroups}
                setBsGroups={setBsGroups}
                setBillWiseOpenings={setBillWiseOpenings}
                setReverseTypes={setReverseTypes}
                logAudit={logAudit}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsSection
                vouchers={vouchers}
                accounts={accounts}
                subgroups={subgroups}
                groups={groups}
                triggerPrint={triggerPrint}
              />
            )}

            {activeTab === 'audit' && (
              <div className="p-6 space-y-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-800 tracking-tight">System Security & Operation Audits Log</h1>
                  <p className="text-xs text-slate-400 mt-1">Complete immutable chronicle logs tracking master creations, modifications, and reversal operations.</p>
                </div>

                <div className="bg-white border rounded-lg shadow-3xs overflow-hidden">
                  <table className="min-w-full divide-y text-xs text-left font-mono">
                    <thead className="bg-slate-50 font-sans">
                      <tr>
                        <th className="p-3 text-slate-400 font-bold uppercase tracking-wider">Timestamp</th>
                        <th className="p-3 text-slate-400 font-bold uppercase tracking-wider">Auditor Operator</th>
                        <th className="p-3 text-slate-400 font-bold uppercase tracking-wider">Action Category</th>
                        <th className="p-3 text-slate-400 font-bold uppercase tracking-wider">Detailed Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-400 font-bold">{log.timestamp}</td>
                          <td className="p-3 font-semibold text-slate-700 font-sans">{log.userName}</td>
                          <td className="p-3 text-blue-600 font-bold text-[11px] uppercase">{log.action}</td>
                          <td className="p-3 font-sans text-slate-600 leading-relaxed">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>

      </div>

      {/* Global Printing View Portal */}
      {isPrintViewerOpen && (
        <PrintViewer
          voucher={printVoucher}
          reportData={printReportData}
          onClose={() => {
            setIsPrintViewerOpen(false);
            setPrintVoucher(null);
            setPrintReportData(null);
          }}
        />
      )}

    </div>
  );
}
