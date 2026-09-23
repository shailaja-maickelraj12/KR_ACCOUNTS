import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Check, X, Database, ListFilter } from 'lucide-react';
import AccountMaster from './masters/AccountMaster';
import GroupMaster from './masters/GroupMaster';
import SubGroupMaster from './masters/SubGroupMaster';
import TDSMaster from './masters/TDSMaster';

const BASE_URL = "http://localhost:5000";

export default function MastersSection({
  accounts, groups, subgroups, tdsMasters,
  setAccounts, setGroups, setSubgroups, setTdsMasters,
  logAudit, activeTab = 'accounts'
}) {
  const [activeSubTab, setActiveSubTab] = useState(activeTab);

  const handleSaveTds = async (item) => {
    try {
      const res = await fetch(`${BASE_URL}/api/tds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });
      const result = await res.json();
      
      if (result.success && result.data) {
        setTdsMasters(prev => {
          const idx = prev.findIndex(i => i.code === result.data.code);
          if (idx > -1) {
            const next = [...prev];
            next[idx] = result.data;
            return next;
          }
          return [...prev, result.data];
        });
      }
    } catch (err) {
      console.error("Failed to save TDS:", err);
    }
  };

  const handleDeleteTds = async (code) => {
    try {
      const res = await fetch(`${BASE_URL}/api/tds/${code}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        setTdsMasters(prev => prev.filter(i => i.code !== code));
      }
    } catch (err) {
      console.error("Failed to delete TDS:", err);
    }
  };

  const handleSaveSubGroup = async (item) => {
    try {
      const res = await fetch(`${BASE_URL}/api/subgroups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });
      const result = await res.json();
      
      if (result.success && result.data) {
        setSubgroups(prev => {
          const idx = prev.findIndex(i => i.id === result.data.id);
          if (idx > -1) {
            const next = [...prev];
            next[idx] = result.data;
            return next;
          }
          return [...prev, result.data];
        });
      }
    } catch (err) {
      console.error("Failed to save SubGroup:", err);
    }
  };

  const handleDeleteSubGroup = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/api/subgroups/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        setSubgroups(prev => prev.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete SubGroup:", err);
    }
  };

  const handleSaveGroup = async (item) => {
    try {
      const res = await fetch(`${BASE_URL}/api/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });
      const result = await res.json();
      if (result.success && result.data) {
        setGroups(prev => {
          const idx = prev.findIndex(i => i.id === result.data.id);
          if (idx > -1) {
            const next = [...prev];
            next[idx] = result.data;
            return next;
          }
          return [...prev, result.data];
        });
      }
    } catch (err) {
      console.error("Failed to save Group:", err);
    }
  };

  const handleDeleteGroup = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/api/groups/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        setGroups(prev => prev.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete Group:", err);
    }
  };

  const tabs = [
    { id: 'accounts', label: 'Accounts Master' },
    { id: 'groups', label: 'Group Master' },
    { id: 'subgroups', label: 'Sub Group Master' },
    { id: 'tds', label: 'TDS Master' }
  ];

  const fullDatabase = {
    accounts: accounts || [],
    groups: groups || [],
    subGroups: subgroups || [],
    tds: tdsMasters || []
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-6 pt-4 flex gap-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeSubTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeSubTab === 'accounts' && (
          <AccountMaster 
            database={fullDatabase}
            onSaveAccount={async (acc) => {
              setAccounts(prev => {
                const idx = prev.findIndex(a => a.code === acc.code);
                if (idx > -1) { const next = [...prev]; next[idx] = acc; return next; }
                return [...prev, acc];
              });
            }}
            onDeleteAccount={(code) => setAccounts(prev => prev.filter(a => a.code !== code))}
          />
        )}
        {activeSubTab === 'groups' && (
          <GroupMaster 
            database={fullDatabase}
            onSaveGroup={handleSaveGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        )}
        {activeSubTab === 'subgroups' && (
          <SubGroupMaster 
            database={fullDatabase}
            onSave={handleSaveSubGroup}
            onDelete={handleDeleteSubGroup}
          />
        )}
        {activeSubTab === 'tds' && (
          <TDSMaster 
            database={fullDatabase}
            onSave={handleSaveTds}
            onDelete={handleDeleteTds}
          />
        )}
      </div>
    </div>
  );
}
