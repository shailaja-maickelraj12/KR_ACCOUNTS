import React, { useState } from "react";
import { Plus, Search, Edit2, Trash2, X, FileSpreadsheet } from "lucide-react";
import ExcelImportModal from "../common/ExcelImportModal";
import { bulkSaveSubGroups } from "../../database";

export default function SubGroupMaster({ database, onSave, onDelete }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Supports both App.tsx (subgroups) and App.jsx dbState (subGroups)
  const dataList = database.subGroups || database.subgroups || [];
  const groups = database.groups || [];

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this Sub Group?")) {
      onDelete(id);
    }
  };

  const handleBulkImport = async (importedSubGroups, onProgress) => {
    await bulkSaveSubGroups(importedSubGroups, onProgress);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-hidden min-h-0" id="subgroup-master-root">
      
      {/* Search and Action Toolbar */}
      <div className="p-6 bg-white border-b border-[#E2E8F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Sub Groups..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value.toLowerCase())}
            className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] rounded-md text-xs outline-none focus:ring-1 focus:ring-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" /> Bulk Import
          </button>

          <button
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Sub Group
          </button>
        </div>
      </div>

      {/* SubGroups Table with Smooth Scrolling */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider sticky top-0 z-10">
                <th className="p-4 bg-slate-50">Sub Group Description</th>
                <th className="p-4 bg-slate-50">Group Description</th>
                <th className="p-4 bg-slate-50">Main Description</th>
                <th className="p-4 bg-slate-50">Ledger Type</th>
                <th className="p-4 bg-slate-50 text-center">TB Sl.No</th>
                <th className="p-4 bg-slate-50 text-center">P & L</th>
                <th className="p-4 bg-slate-50 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {dataList
                .filter(item => 
                  item.name?.toLowerCase().includes(searchTerm) ||
                  item.groupName?.toLowerCase().includes(searchTerm) ||
                  item.mainDescription?.toLowerCase().includes(searchTerm)
                )
                .map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-4 font-semibold text-slate-800">{item.name}</td>
                    <td className="p-4 text-slate-600">{item.groupName}</td>
                    <td className="p-4 text-slate-500">{item.mainDescription}</td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                        {item.ledgerType}
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono text-slate-600">{item.tbSlNo ?? 0}</td>
                    <td className="p-4 text-center font-mono text-slate-600">{item.pnl ?? item.pAndL ?? 0}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                          className="text-slate-500 hover:text-[#2563EB] cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="text-slate-500 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {dataList.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">No Sub Groups defined yet.</div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1E293B]/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-[#E2E8F0] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-[#E2E8F0] mb-4">
              <h3 className="font-bold text-[#1E293B] text-sm uppercase tracking-wider">
                {editingItem ? "Edit Sub Group" : "Create Sub Group"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const data = Object.fromEntries(fd.entries());
              
              const selectedGroup = groups.find(g => g.name === data.groupName);

              const subGroupData = {
                id: editingItem?.id || undefined,
                name: data.name,
                groupName: data.groupName,
                mainDescription: selectedGroup?.mainDescription || data.mainDescription || "Assets",
                ledgerType: data.ledgerType,
                tbSlNo: Number(data.tbSlNo) || 0,
                pnl: Number(data.pnl) || 0,
                pAndL: Number(data.pnl) || 0
              };

              onSave(subGroupData);
              setIsModalOpen(false);
            }}>
              <div className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block mb-1">Sub Group Description</label>
                  <input name="name" defaultValue={editingItem?.name || ""} required placeholder="e.g. CASH - ON - HAND" className="w-full p-2 border rounded text-xs outline-none focus:ring-1 focus:ring-[#2563EB]" />
                </div>

                <div>
                  <label className="block mb-1">Group Description</label>
                  <select name="groupName" defaultValue={editingItem?.groupName || ""} required className="w-full p-2 border rounded text-xs outline-none focus:ring-1 focus:ring-[#2563EB]">
                    <option value="">-- Select Parent Group --</option>
                    {groups.map(g => (
                      <option key={g.id || g.name} value={g.name}>{g.name} ({g.mainDescription})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Ledger Type</label>
                  <select name="ledgerType" defaultValue={editingItem?.ledgerType || "GENERAL LEDGER"} className="w-full p-2 border rounded text-xs outline-none focus:ring-1 focus:ring-[#2563EB]">
                    <option value="GENERAL LEDGER">GENERAL LEDGER</option>
                    <option value="SUB LEDGER">SUB LEDGER</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">TB Sl.No</label>
                    <input name="tbSlNo" type="number" defaultValue={editingItem?.tbSlNo ?? 0} className="w-full p-2 border rounded text-xs outline-none focus:ring-1 focus:ring-[#2563EB]" />
                  </div>
                  <div>
                    <label className="block mb-1">P & L Mapping Code</label>
                    <input name="pnl" type="number" defaultValue={editingItem?.pnl ?? editingItem?.pAndL ?? 0} className="w-full p-2 border rounded text-xs outline-none focus:ring-1 focus:ring-[#2563EB]" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0] mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-xs text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded text-xs font-semibold">Save Sub Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import Sub Groups"
        templateColumns={["Sub Group Description", "Group Description", "Main Category", "Ledger Type", "TB Sl.No", "P & L"]}
        columnMap={{
          "subgroupdescription": "name",
          "subgroupname": "name",
          "name": "name",
          "groupdescription": "groupName",
          "groupname": "groupName",
          "maincategory": "mainDescription",
          "maindescription": "mainDescription",
          "ledgertype": "ledgerType",
          "tbslno": "tbSlNo",
          "tbserialno": "tbSlNo",
          "pandl": "pnl",
          "pnl": "pnl"
        }}
        requiredFields={["name", "groupName"]}
        transformRow={(row) => ({
          id: row.id || undefined,
          name: row.name,
          groupName: row.groupName,
          mainDescription: row.mainDescription || "Assets",
          ledgerType: row.ledgerType || "GENERAL LEDGER",
          tbSlNo: Number(row.tbSlNo) || 0,
          pnl: Number(row.pnl) || 0,
          pAndL: Number(row.pnl) || 0
        })}
        onImport={handleBulkImport}
      />

    </div>
  );
}