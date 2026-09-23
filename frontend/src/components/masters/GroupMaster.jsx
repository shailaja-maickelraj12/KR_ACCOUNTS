import React, { useState } from "react";
import { Plus, Search, Edit2, Trash2, X, FileSpreadsheet } from "lucide-react";
import ExcelImportModal from "../common/ExcelImportModal";
import { bulkSaveGroups } from "../../database";

/**
 * Auto Group ID Generator (Option 1 - Numeric Accounting Series):
 * - Assets: G1001, G1002, ...
 * - Liabilities: G2001, G2002, ...
 * - Incomes: G3001, G3002, ...
 * - Expenses: G4001, G4002, ...
 * - Profit & Loss A/c: G5001, G5002, ...
 */
export function generateGroupId(mainDescription = "Assets", groups = []) {
  const prefixMap = {
    "assets": 1000,
    "liabilities": 2000,
    "incomes": 3000,
    "expenses": 4000,
    "profit & loss a/c": 5000,
    "profit & loss": 5000
  };
  
  const descKey = (mainDescription || "Assets").trim().toLowerCase();
  let baseNum = 1000;
  for (const [k, v] of Object.entries(prefixMap)) {
    if (descKey.includes(k) || k.includes(descKey)) {
      baseNum = v;
      break;
    }
  }

  const existingIds = new Set((groups || []).map(g => String(g.id || "").trim().toUpperCase()).filter(Boolean));
  
  let maxSuffix = 0;
  for (const g of groups || []) {
    const idStr = String(g.id || "").trim().toUpperCase();
    const m = idStr.match(/^G(\d{4})$/);
    if (m) {
      const num = parseInt(m[1], 10);
      if (num >= baseNum && num < baseNum + 1000) {
        const offset = num - baseNum;
        if (offset > maxSuffix) maxSuffix = offset;
      }
    }
  }

  let candidateNum = baseNum + maxSuffix + 1;
  while (existingIds.has(`G${candidateNum}`)) {
    candidateNum++;
  }
  return `G${candidateNum}`;
}

export default function GroupMaster({ 
  database, 
  onSaveGroup,
  onDeleteGroup 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [groupId, setGroupId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Assets");

  // Filter List based on Search Term
  const groupsList = database.groups || [];

  const handleSearchChange = (e) => setSearchTerm(e.target.value.toLowerCase());

  // Delete Action Dispatcher
  const handleDelete = (id) => {
    if(!confirm("Are you sure you want to delete this group entry?")) return;
    if (onDeleteGroup) onDeleteGroup(id);
  };

  // High-Performance Bulk Import Handler with Group ID Auto-Generation
  const handleBulkImport = async (importedGroups, onProgress) => {
    const existingIds = new Set((groupsList || []).map(g => String(g.id || "").toUpperCase()).filter(Boolean));
    const processed = [];

    for (const grp of importedGroups) {
      const cat = grp.mainDescription || "Assets";
      let finalId = grp.id ? String(grp.id).trim() : "";
      if (!finalId) {
        finalId = generateGroupId(cat, [...groupsList, ...processed]);
        while (existingIds.has(finalId.toUpperCase())) {
          const numPart = parseInt(finalId.replace(/\D/g, ""), 10) + 1;
          finalId = `G${numPart}`;
        }
        existingIds.add(finalId.toUpperCase());
      } else {
        existingIds.add(finalId.toUpperCase());
      }
      processed.push({
        ...grp,
        id: finalId,
        mainDescription: cat
      });
    }

    await bulkSaveGroups(processed, onProgress);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#F8FAFC] min-h-0" id="group-master-root">
      
      {/* Search Filter Panel & Toolbar */}
      <div className="p-6 bg-white border-b border-[#E2E8F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shrink-0" id="master-search-bar">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search groups by ID, name, or description..."
            value={searchTerm}
            onChange={handleSearchChange}
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
            onClick={() => {
              setEditingItem(null);
              const defaultCat = "Assets";
              setSelectedCategory(defaultCat);
              setGroupId(generateGroupId(defaultCat, groupsList));
              setIsModalOpen(true);
            }}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start md:self-auto shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Group
          </button>
        </div>
      </div>

      {/* Grid Content Section with Smooth Scrolling */}
      <div className="flex-1 p-6 flex flex-col min-h-0 overflow-hidden" id="master-table-wrapper">
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider sticky top-0 z-10">
                  <th className="p-4 bg-slate-50 w-32">ID</th>
                  <th className="p-4 bg-slate-50">Group Description</th>
                  <th className="p-4 bg-slate-50">Main Description</th>
                  <th className="p-4 bg-slate-50 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {groupsList
                  .filter(g => 
                    (g.name && g.name.toLowerCase().includes(searchTerm)) || 
                    (g.id && g.id.toLowerCase().includes(searchTerm)) || 
                    (g.mainDescription && g.mainDescription.toLowerCase().includes(searchTerm))
                  )
                  .map(group => (
                    <tr key={group.id} className="hover:bg-[#F8FAFC]">
                      <td className="p-4 font-mono text-[#2563EB] font-semibold">{group.id}</td>
                      <td className="p-4 font-semibold text-slate-800">{group.name}</td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                          {group.mainDescription}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { 
                            setEditingItem(group); 
                            setSelectedCategory(group.mainDescription || "Assets");
                            setGroupId(group.id);
                            setIsModalOpen(true); 
                          }} className="text-slate-500 hover:text-[#2563EB] cursor-pointer" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(group.id)} className="text-slate-500 hover:text-red-600 cursor-pointer" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {groupsList.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">No groups found in the database.</div>
            )}
          </div>
        </div>
      </div>

      {/* Pop-up Dialog Modal for Creating/Editing */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1E293B]/40 flex items-center justify-center z-50 p-4" id="group-modal">
          <div className="bg-white rounded-lg shadow-xl border border-[#E2E8F0] p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-4 border-b border-[#E2E8F0] mb-4">
              <h3 className="font-bold text-[#1E293B] text-sm uppercase tracking-wider">
                {editingItem ? "✏️ Edit" : "➕ Create"} Group
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const data = Object.fromEntries(fd.entries());

              const finalGroupId = editingItem?.id || groupId || generateGroupId(data.mainDescription, groupsList);
              const updated = {
                id: finalGroupId,
                name: data.name,
                mainDescription: data.mainDescription
              };

              if (onSaveGroup) onSaveGroup(updated);
              setIsModalOpen(false);
            }}>
              
              <div className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700">Group ID</label>
                    <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                      {editingItem ? "Locked" : "Auto-generated (Locked)"}
                    </span>
                  </div>
                  <input 
                    name="id" 
                    value={groupId} 
                    readOnly 
                    required 
                    className="w-full p-2 border border-slate-200 rounded text-xs outline-none bg-slate-100 font-mono font-bold text-[#2563EB] cursor-not-allowed select-none" 
                  />
                </div>

                <div>
                  <label className="block mb-1">Main Description (Category)</label>
                  <select 
                    name="mainDescription" 
                    value={selectedCategory} 
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setSelectedCategory(newCat);
                      if (!editingItem) {
                        setGroupId(generateGroupId(newCat, groupsList));
                      }
                    }}
                    required 
                    className="w-full p-2 border rounded text-xs outline-none focus:ring-1 focus:ring-[#2563EB] bg-white cursor-pointer"
                  >
                    <option value="Assets">Assets</option>
                    <option value="Liabilities">Liabilities</option>
                    <option value="Incomes">Incomes</option>
                    <option value="Expenses">Expenses</option>
                    <option value="Profit & Loss A/c">Profit & Loss A/c</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Group Description</label>
                  <input 
                    name="name" 
                    defaultValue={editingItem?.name || ""} 
                    required 
                    placeholder="e.g. Current Assets" 
                    className="w-full p-2 border rounded text-xs outline-none focus:ring-1 focus:ring-[#2563EB]" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0] mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-xs text-slate-500 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded text-xs font-semibold cursor-pointer">{editingItem ? "Update Group" : "Save Group"}</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import Groups"
        templateColumns={["Group Description", "Main Category", "Group ID"]}
        columnMap={{
          "groupdescription": "name",
          "groupname": "name",
          "name": "name",
          "description": "name",
          "maincategory": "mainDescription",
          "maindescription": "mainDescription",
          "category": "mainDescription",
          "groupid": "id",
          "id": "id"
        }}
        requiredFields={["name"]}
        transformRow={(row) => ({
          id: row.id || undefined,
          name: row.name,
          mainDescription: row.mainDescription || "Assets"
        })}
        onImport={handleBulkImport}
      />

    </div>
  );
}
