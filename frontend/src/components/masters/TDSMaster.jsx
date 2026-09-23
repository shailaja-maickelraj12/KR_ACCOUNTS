import React, { useState } from "react";
import { Plus, Search, Edit2, Trash2, X, FileSpreadsheet } from "lucide-react";
import ExcelImportModal from "../common/ExcelImportModal";
import { bulkSaveTds } from "../../database";

export default function TDSMaster({ database, onSave, onDelete }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const dataList = database?.tds || []; 
  const accounts = database?.accounts || [];

  const handleDelete = (code) => {
    if (window.confirm(`Are you sure you want to delete TDS config: ${code}?`)) {
      onDelete(code);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd.entries());

      const payload = {
        code: editingItem?.code || (data.code || "").toUpperCase(),
        name: data.name,
        tdsPercentage: parseFloat(data.tdsPercentage) || 0,
        scPercentage: parseFloat(data.scPercentage) || 0,
        chessPercentage: parseFloat(data.chessPercentage) || 0,
        hsChessPercentage: parseFloat(data.hsChessPercentage) || 0,
        accountHeadName: data.accountHeadName,
        sectionCode: data.sectionCode,
      };

      if (!payload.code || !payload.name) {
        throw new Error("Missing Code or Name");
      }

      await onSave(payload);
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error("Save failed:", err.message);
    }
  };

  // High-Performance Bulk Import Handler
  const handleBulkImport = async (importedTds, onProgress) => {
    const existingCodes = new Set(dataList.map(t => String(t.code || "").toUpperCase()));
    const processedTds = [];
    let counter = 1;

    for (const tds of importedTds) {
      let finalCode = tds.code ? String(tds.code).toUpperCase() : "";
      if (!finalCode) {
        while (existingCodes.has(`TDS-${String(counter).padStart(3, "0")}`)) {
          counter++;
        }
        finalCode = `TDS-${String(counter).padStart(3, "0")}`;
        existingCodes.add(finalCode);
      } else {
        existingCodes.add(finalCode);
      }
      processedTds.push({ ...tds, code: finalCode });
    }

    await bulkSaveTds(processedTds, onProgress);
  };

  const filteredData = dataList.filter(t => 
    (t.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.sectionCode || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#F8FAFC] min-h-0" id="tds-master-root">
      
      {/* Header Section */}
      <div className="p-6 bg-white border-b border-[#E2E8F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs shrink-0">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search TDS by name, code, or section..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
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
              setIsModalOpen(true); 
            }} 
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New TDS
          </button>
        </div>
      </div>

      {/* Table Section with Smooth Vertical Scrolling */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0" id="tds-table-wrapper">
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="p-4 bg-slate-50">Code</th>
                <th className="p-4 bg-slate-50">TDS Name</th>
                <th className="p-4 text-center bg-slate-50">TDS %</th>
                <th className="p-4 text-center bg-slate-50">Cess %</th>
                <th className="p-4 bg-slate-50">Account Head</th>
                <th className="p-4 text-center bg-slate-50">Section</th>
                <th className="p-4 text-center w-24 bg-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredData.map(item => (
                <tr key={item.code} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-[#2563EB] font-bold">{item.code}</td>
                  <td className="p-4 font-semibold text-slate-800">{item.name}</td>
                  <td className="p-4 text-center font-mono text-slate-700 font-bold">{item.tdsPercentage || 0}%</td>
                  <td className="p-4 text-center font-mono text-slate-500">{item.chessPercentage || 0}%</td>
                  <td className="p-4 text-slate-600">{item.accountHeadName || <span className="text-red-400">Not Linked</span>}</td>
                  <td className="p-4 text-center text-slate-500 font-mono">{item.sectionCode || "-"}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => { 
                          setEditingItem(item); 
                          setIsModalOpen(true); 
                        }} 
                        className="text-slate-500 hover:text-[#2563EB] cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.code)} 
                        className="text-slate-500 hover:text-red-600 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 text-xs">
                    {dataList.length === 0 ? "No records in database. Add your first TDS configuration." : "No matching results."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Section */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1E293B]/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-[#E2E8F0] w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#E2E8F0] bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                {editingItem ? "✏️ Edit TDS Configuration" : "➕ New TDS Configuration"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Code</label>
                    <input name="code" required disabled={!!editingItem} defaultValue={editingItem?.code || ""} placeholder="TDS001" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono disabled:opacity-60" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">TDS Name</label>
                    <input name="name" required defaultValue={editingItem?.name || ""} placeholder="e.g. Contractors" className="w-full p-2 border border-slate-200 rounded-md text-xs" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#2563EB] uppercase">TDS %</label>
                    <input name="tdsPercentage" type="number" step="any" required defaultValue={editingItem?.tdsPercentage || 0} className="w-full p-2 border border-slate-200 rounded text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Surcharge %</label>
                    <input name="scPercentage" type="number" step="any" required defaultValue={editingItem?.scPercentage || 0} className="w-full p-2 border border-slate-200 rounded text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Cess %</label>
                    <input name="chessPercentage" type="number" step="any" required defaultValue={editingItem?.chessPercentage || 0} className="w-full p-2 border border-slate-200 rounded text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">H.S. Cess %</label>
                    <input name="hsChessPercentage" type="number" step="any" required defaultValue={editingItem?.hsChessPercentage || 0} className="w-full p-2 border border-slate-200 rounded text-xs font-mono" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Account Head (Ledger)</label>
                  <select name="accountHeadName" required defaultValue={editingItem?.accountHeadName || ""} className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs">
                    <option value="">-- Select Account --</option>
                    {accounts.map(a => <option key={a.code} value={a.name}>{a.name} ({a.code})</option>)}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Section Code</label>
                  <input name="sectionCode" defaultValue={editingItem?.sectionCode || ""} placeholder="e.g. 194C" className="w-full p-2 border border-slate-200 rounded-md text-xs font-mono" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0] mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-xs text-slate-500 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded text-xs font-semibold cursor-pointer">{editingItem ? "Update TDS" : "Save TDS"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import TDS Configurations"
        templateColumns={["TDS Name", "TDS %", "Surcharge %", "Cess %", "Account Head", "Section Code", "Code"]}
        columnMap={{
          "tdsname": "name",
          "name": "name",
          "tdspercentage": "tdsPercentage",
          "tds": "tdsPercentage",
          "surchargepercentage": "scPercentage",
          "surcharge": "scPercentage",
          "sc": "scPercentage",
          "cesspercentage": "chessPercentage",
          "cess": "chessPercentage",
          "accounthead": "accountHeadName",
          "accountheadname": "accountHeadName",
          "ledger": "accountHeadName",
          "sectioncode": "sectionCode",
          "section": "sectionCode",
          "code": "code"
        }}
        requiredFields={["name", "tdsPercentage"]}
        transformRow={(row) => ({
          code: row.code ? String(row.code).toUpperCase() : "",
          name: row.name,
          tdsPercentage: parseFloat(row.tdsPercentage) || 0,
          scPercentage: parseFloat(row.scPercentage) || 0,
          chessPercentage: parseFloat(row.chessPercentage) || 0,
          hsChessPercentage: parseFloat(row.hsChessPercentage) || 0,
          accountHeadName: row.accountHeadName || "",
          sectionCode: row.sectionCode ? String(row.sectionCode) : ""
        })}
        onImport={handleBulkImport}
      />

    </div>
  );
}