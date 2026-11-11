import React from "react";
import { 
  Layers, 
  FileText, 
  Settings, 
  Users, 
  Receipt,
  FileCheck,
  Percent,
  ListRestart,
  CreditCard,
  FileSpreadsheet,
  Send
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, currentUser, setCurrentUser }) {
  const menuItems = [
    { id: "cash-payment", label: "Cash Payment", icon: Receipt, category: "Payment" },
    { id: "bank-payment", label: "Bank Payment", icon: CreditCard, category: "Payment" },

    { id: "cash-receipt", label: "Cash Receipt", icon: FileCheck, category: "Receipt" },
    { id: "bank-receipt", label: "Bank Receipt", icon: FileCheck, category: "Receipt" },

    { id: "journal-voucher", label: "Journal Voucher", icon: FileText, category: "Journal Voucher" },

    { id: "tally-posting", label: "Tally Posting", icon: Send, category: "Tally" },

    { id: "contra-entry", label: "Contra Entry", icon: ListRestart, category: "Contra Entry" },

    { id: "debit-note", label: "Debit Note", icon: FileText, category: "Debit Note" },
    { id: "credit-note", label: "Credit Note", icon: FileText, category: "Credit Note" },

    { id: "group-master", label: "Group Master", icon: Layers, category: "Masters" },
    { id: "subgroup-master", label: "Sub Group Master", icon: Layers, category: "Masters" },
    { id: "accounts-master", label: "Account Master", icon: Users, category: "Masters" },
    { id: "tds-master", label: "TDS Master", icon: Percent, category: "Masters" },

    { id: "reports-module", label: "Reports Module", icon: FileSpreadsheet, category: "Reports" },

    { id: "audit-logs", label: "Audit Trial Logs", icon: Settings, category: "System" }
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col h-screen select-none shrink-0" id="sidebar-container">
      {/* Platform Branding */}
      <div className="p-6 border-b border-[#E2E8F0] flex items-center gap-3" id="sidebar-logo">
        <div className="w-8 h-8 bg-[#2563EB] rounded flex items-center justify-center text-white font-bold text-sm">
          KF
        </div>
        <div>
          <h1 className="font-bold text-[#1E293B] text-base leading-none">AccuFlow ERP</h1>
          <span className="text-[10px] text-[#2563EB] font-bold tracking-wider uppercase">Kayaar Exports</span>
        </div>
      </div>

      {/* Acting User Selecter */}
      <div className="p-3.5 bg-slate-50 border-b border-[#E2E8F0] text-xs" id="sidebar-user-selector">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
            Active User
          </label>
          {String(currentUser || "").toLowerCase().includes("sir") && (
            <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              Executive
            </span>
          )}
        </div>
        <div className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl p-2 shadow-xs">
          <span className="font-bold text-[#1E293B] truncate flex items-center gap-1.5">
            {String(currentUser || "").toLowerCase().includes("sir") ? "👔" : "🧑‍💻"} {currentUser}
          </span>
          <button 
            onClick={() => setCurrentUser(null)} 
            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-0.5 rounded-md font-bold text-[11px] cursor-pointer transition-all"
            title="Sign out of current account"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Navigation Item groups */}
      <div className="flex-1 overflow-y-auto py-4" id="sidebar-nav">
        {["Payment", "Receipt", "Journal Voucher", "Tally", "Contra Entry", "Debit Note", "Credit Note", "Masters", "Reports", "System"].map(cat => {
          const items = menuItems.filter(i => i.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="mb-4">
              <h3 className="px-6 text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                {cat}
              </h3>
              {items.map(item => {
                const IconComp = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`nav-item w-full px-6 py-2.5 flex items-center gap-3 text-left text-xs font-medium cursor-pointer transition-all border-l-2 ${
                      isActive 
                        ? "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB] font-bold" 
                        : "text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] border-transparent"
                    }`}
                  >
                    <IconComp className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
