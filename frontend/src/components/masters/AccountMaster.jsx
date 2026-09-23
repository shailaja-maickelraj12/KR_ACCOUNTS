import React, { useState, useMemo, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, X, FileSpreadsheet, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import ExcelImportModal from "../common/ExcelImportModal";
import { bulkSaveAccounts } from "../../database";

/**
 * Auto-generator for Account Codes:
 * - Start Value: 60000001
 * - Increment: +1 for each new account
 * - Format: Fixed 8-digit integer (60000001, 60000002, 60000003, ...)
 * - Common series for all categories
 */
export function generateAccountCode(accounts = []) {
  const existingCodes = new Set((accounts || []).map(a => String(a.code || "").trim()).filter(Boolean));
  
  let maxCode = 60000000;
  for (const a of accounts || []) {
    const raw = String(a.code || "").trim();
    if (/^\d{8}$/.test(raw)) {
      const n = parseInt(raw, 10);
      if (n >= 60000001 && n > maxCode) {
        maxCode = n;
      }
    }
  }

  let candidate = maxCode + 1;
  while (existingCodes.has(String(candidate))) {
    candidate++;
  }
  return String(candidate);
}

export default function AccountMaster({ 
  database, 
  onSaveAccount,
  onDeleteAccount
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [accountCode, setAccountCode] = useState("");
  const [selectedSubGroup, setSelectedSubGroup] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const accountsList = database.accounts || [];
  const subGroupsList = database.subGroups || database.subgroups || [];

  const handleSearchChange = (e) => setSearchTerm(e.target.value.toLowerCase());

  // High-Performance Filter with useMemo
  const filteredAccounts = useMemo(() => {
    if (!searchTerm) return accountsList;
    const term = searchTerm.toLowerCase();
    return accountsList.filter(a => 
      (a.name && a.name.toLowerCase().includes(term)) || 
      (a.code && String(a.code).toLowerCase().includes(term)) || 
      (a.subGroupName && a.subGroupName.toLowerCase().includes(term)) || 
      (a.place && a.place.toLowerCase().includes(term))
    );
  }, [accountsList, searchTerm]);

  // Reset page to 1 when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const totalPages = Math.ceil(filteredAccounts.length / pageSize) || 1;
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAccounts.slice(start, start + pageSize);
  }, [filteredAccounts, currentPage, pageSize]);

  const handleDelete = (code) => {
    if(!confirm("Are you sure you want to delete this account?")) return;
    if (onDeleteAccount) onDeleteAccount(code);
  };

  const handleBulkImport = async (importedAccounts, onProgress) => {
    const existingCodes = new Set((accountsList || []).map(a => String(a.code || "").trim()).filter(Boolean));
    const processedAccounts = [];
    let currentCode = parseInt(generateAccountCode(accountsList), 10);

    for (const acc of importedAccounts) {
      let finalCode = acc.code ? String(acc.code).trim() : "";
      const subName = (acc.subGroupName || "").trim();
      const selectedSub = subGroupsList.find(s => s.name?.trim().toLowerCase() === subName.toLowerCase());

      if (!finalCode) {
        while (existingCodes.has(String(currentCode))) {
          currentCode++;
        }
        finalCode = String(currentCode);
        existingCodes.add(finalCode);
        currentCode++;
      } else {
        existingCodes.add(finalCode);
      }

      const accountToSave = {
        ...acc,
        code: finalCode,
        groupName: selectedSub?.groupName || acc.groupName || "",
        mainGroupName: selectedSub?.mainDescription || acc.mainGroupName || "Assets"
      };
      processedAccounts.push(accountToSave);
    }

    await bulkSaveAccounts(processedAccounts, onProgress);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#F8FAFC] min-h-0" id="account-master-root">
      
      {/* Search & Actions Toolbar */}
      <div className="p-6 bg-white border-b border-[#E2E8F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shrink-0" id="master-search-bar">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search accounts by name, code, subgroup, or place..."
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
              const defaultSub = subGroupsList[0]?.name || "";
              setSelectedSubGroup(defaultSub);
              setAccountCode(generateAccountCode(accountsList));
              setIsModalOpen(true);
            }}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start md:self-auto shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Account
          </button>
        </div>
      </div>

      {/* Grid Content Section with Scrollable Table & Pinned Pagination */}
      <div className="flex-1 p-6 flex flex-col min-h-0 overflow-hidden" id="master-table-wrapper">
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
          
          {/* Scrollable Table Area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-[#E2E8F0]">
                <tr className="bg-slate-50 text-[#64748B] font-bold uppercase tracking-wider">
                  <th className="p-3.5 bg-slate-50">Code</th>
                  <th className="p-3.5 bg-slate-50">Account Name</th>
                  <th className="p-3.5 bg-slate-50">Sub-Group</th>
                  <th className="p-3.5 bg-slate-50">Place / Contact</th>
                  <th className="p-3.5 text-right bg-slate-50">Opg Debit</th>
                  <th className="p-3.5 text-right bg-slate-50">Opg Credit</th>
                  <th className="p-3.5 text-center bg-slate-50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {paginatedAccounts.map(acc => (
                  <tr key={acc.code} className="hover:bg-[#F8FAFC]">
                    <td className="p-3 font-mono text-[#2563EB] font-semibold">{acc.code}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{acc.name}</div>
                      {acc.address1 && <div className="text-[10px] text-slate-400 truncate max-w-xs">{acc.address1}</div>}
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">{acc.subGroupName}</span>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-700">{acc.place || "-"}</div>
                      {acc.phoneNo && <div className="text-[10px] text-slate-400">📞 {acc.phoneNo}</div>}
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-slate-700">
                      {acc.openingDebit ? parseFloat(acc.openingDebit).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-slate-700">
                      {acc.openingCredit ? parseFloat(acc.openingCredit).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { 
                          setEditingItem(acc); 
                          setSelectedSubGroup(acc.subGroupName || "");
                          setAccountCode(acc.code || "");
                          setIsModalOpen(true); 
                        }} className="text-slate-500 hover:text-[#2563EB] cursor-pointer" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(acc.code)} className="text-slate-500 hover:text-red-600 cursor-pointer" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAccounts.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                {accountsList.length === 0 ? "No accounts found in the database." : "No matching accounts found for your search."}
              </div>
            )}
          </div>

          {/* Pagination Controls Footer - Always Pinned at Bottom */}
          {filteredAccounts.length > 0 && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
              <div className="flex items-center gap-3">
                <span>
                  Showing <span className="font-semibold text-slate-800">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-semibold text-slate-800">{Math.min(currentPage * pageSize, filteredAccounts.length)}</span> of <span className="font-bold text-slate-900">{filteredAccounts.length.toLocaleString()}</span> accounts
                </span>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-slate-500 text-[11px]">Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="p-1 border border-slate-200 rounded text-xs bg-white text-slate-700 outline-none cursor-pointer"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value={500}>500</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-semibold text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Pop-up Dialog Modal for Creating/Editing Master Entries */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1E293B]/40 flex items-center justify-center z-50 p-4" id="account-modal">
          <div className="bg-white rounded-lg shadow-xl border border-[#E2E8F0] p-6 w-full max-h-[85vh] overflow-y-auto max-w-4xl">
            
            <div className="flex justify-between items-center pb-4 border-b border-[#E2E8F0] mb-4">
              <h3 className="font-bold text-[#1E293B] text-sm uppercase tracking-wider">
                {editingItem ? "✏️ Edit" : "➕ Create"} Account Master Detail
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const data = Object.fromEntries(fd.entries());

              const finalCode = editingItem?.code || accountCode || data.code || generateAccountCode(accountsList);
              const selectedSub = subGroupsList.find(s => s.name === (data.subGroupName || selectedSubGroup));
              const updated = {
                code: finalCode,
                name: data.name,
                groupName: selectedSub?.groupName || editingItem?.groupName || data.groupName || "",
                subGroupName: data.subGroupName || selectedSubGroup,
                mainGroupName: selectedSub?.mainDescription || editingItem?.mainGroupName || data.mainGroupName || "Liabilities",
                place: data.place,
                address1: data.address1,
                address2: data.address2,
                address3: data.address3,
                state: data.state,
                deliveryAddress1: data.deliveryAddress1,
                deliveryAddress2: data.deliveryAddress2,
                deliveryAddress3: data.deliveryAddress3,
                cstNo: data.cstNo,
                tinNo: data.tinNo,
                phoneNo: data.phoneNo,
                email: data.email,
                fax: data.fax,
                website: data.website,
                accountNo: data.accountNo,
                cellNo: data.cellNo,
                voucherDescription: data.voucherDescription,
                openingDebit: parseFloat(data.openingDebit) || 0,
                openingCredit: parseFloat(data.openingCredit) || 0,
                panNo: data.panNo,
                gstNo: data.gstNo,
                contactPerson: data.contactPerson
              };
              if (onSaveAccount) onSaveAccount(updated);
              setIsModalOpen(false);
            }}>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-xs font-semibold text-slate-700">
                {/* --- LEFT SECTION --- */}
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700">Code</label>
                      <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                        {editingItem ? "Locked" : "Auto-generated (Locked)"}
                      </span>
                    </div>
                    <input
                      name="code"
                      value={accountCode}
                      readOnly
                      required
                      className="w-full p-2 border border-slate-200 rounded text-xs font-mono font-bold bg-slate-100 text-slate-600 cursor-not-allowed select-none outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Account Group</label>
                    <select
                      name="subGroupName"
                      value={selectedSubGroup}
                      onChange={(e) => {
                        const newSub = e.target.value;
                        setSelectedSubGroup(newSub);
                        if (!editingItem) {
                          setAccountCode(generateAccountCode(newSub, accountsList, subGroupsList));
                        }
                      }}
                      required
                      className="w-full p-2 border rounded text-xs outline-none focus:ring-1 focus:ring-[#2563EB]"
                    >
                      <option value="">-- Select Group --</option>
                      {subGroupsList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Account Name</label>
                    <input name="name" defaultValue={editingItem?.name || ""} required className="w-full p-2 border rounded text-xs outline-none focus:ring-1 focus:ring-[#2563EB]" />
                  </div>
                  <div>
                    <label className="block mb-1">Place</label>
                    <input name="place" defaultValue={editingItem?.place || ""} className="w-full p-2 border rounded text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block mb-1">Address Line 1</label>
                    <input name="address1" defaultValue={editingItem?.address1 || ""} className="w-full p-2 border rounded text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block mb-1">Address Line 2</label>
                    <input name="address2" defaultValue={editingItem?.address2 || ""} className="w-full p-2 border rounded text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block mb-1">Address Line 3</label>
                    <input name="address3" defaultValue={editingItem?.address3 || ""} className="w-full p-2 border rounded text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block mb-1">State</label>
                    <input name="state" defaultValue={editingItem?.state || ""} className="w-full p-2 border rounded text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block mb-1">Opening Credit</label>
                    <input type="number" step="any" name="openingCredit" defaultValue={editingItem?.openingCredit || ""} className="w-full p-2 border rounded text-xs font-mono outline-none" />
                  </div>
                  <div>
                    <label className="block mb-1">Opening Debit</label>
                    <input type="number" step="any" name="openingDebit" defaultValue={editingItem?.openingDebit || ""} className="w-full p-2 border rounded text-xs font-mono outline-none" />
                  </div>
                </div>

                {/* --- RIGHT SECTION --- */}
                <div className="flex flex-col gap-3">
                  <div><label className="block mb-1">Phone No</label><input name="phoneNo" defaultValue={editingItem?.phoneNo || ""} className="w-full p-2 border rounded text-xs outline-none" /></div>
                  <div><label className="block mb-1">Email</label><input type="email" name="email" defaultValue={editingItem?.email || ""} className="w-full p-2 border rounded text-xs outline-none" /></div>
                  <div><label className="block mb-1">Contact Person</label><input name="contactPerson" defaultValue={editingItem?.contactPerson || ""} className="w-full p-2 border rounded text-xs outline-none" /></div>
                  <div><label className="block mb-1">Cell No</label><input name="cellNo" defaultValue={editingItem?.cellNo || ""} className="w-full p-2 border rounded text-xs outline-none" /></div>
                  <div><label className="block mb-1">PAN No</label><input name="panNo" defaultValue={editingItem?.panNo || ""} className="w-full p-2 border rounded text-xs outline-none" /></div>
                  <div><label className="block mb-1">GST No</label><input name="gstNo" defaultValue={editingItem?.gstNo || ""} className="w-full p-2 border rounded text-xs outline-none" /></div>
                  <div><label className="block mb-1">CST No</label><input name="cstNo" defaultValue={editingItem?.cstNo || ""} className="w-full p-2 border rounded text-xs outline-none" /></div>
                  <div><label className="block mb-1">TIN No</label><input name="tinNo" defaultValue={editingItem?.tinNo || ""} className="w-full p-2 border rounded text-xs outline-none" /></div>
                  <div><label className="block mb-1">Website</label><input type="url" name="website" defaultValue={editingItem?.website || ""} className="w-full p-2 border rounded text-xs outline-none" /></div>
                  <div><label className="block mb-1">Account No</label><input name="accountNo" defaultValue={editingItem?.accountNo || ""} className="w-full p-2 border rounded text-xs outline-none" /></div>
                  <div><label className="block mb-1">Voucher Description</label><input name="voucherDescription" defaultValue={editingItem?.voucherDescription || ""} className="w-full p-2 border rounded text-xs outline-none" /></div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0] mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-xs text-slate-500 hover:bg-slate-50 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded text-xs font-semibold cursor-pointer">
                  {editingItem ? "Update Account" : "Save Account"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import Accounts"
        templateColumns={[
          "Account Name", "Account Group", "Place", "Phone No", "Cell No", "Address",
          "Opening Debit", "Opening Credit", "PAN No", "GST No", "Contact Person",
          "Email", "State", "Account Code"
        ]}
        columnMap={{
          "accountname": "name",
          "name": "name",
          "accountgroup": "subGroupName",
          "subgroup": "subGroupName",
          "subgroupname": "subGroupName",
          "place": "place",
          "phoneno": "phoneNo",
          "phone": "phoneNo",
          "cellno": "cellNo",
          "address": "address1",
          "addressline1": "address1",
          "address1": "address1",
          "openingdebit": "openingDebit",
          "debit": "openingDebit",
          "openingcredit": "openingCredit",
          "credit": "openingCredit",
          "panno": "panNo",
          "pan": "panNo",
          "gstno": "gstNo",
          "gst": "gstNo",
          "contactperson": "contactPerson",
          "contact": "contactPerson",
          "email": "email",
          "state": "state",
          "accountcode": "code",
          "code": "code"
        }}
        requiredFields={["name", "subGroupName"]}
        transformRow={(row) => ({
          name: row.name,
          subGroupName: row.subGroupName,
          code: row.code ? String(row.code) : "",
          place: row.place || "",
          phoneNo: row.phoneNo ? String(row.phoneNo) : "",
          cellNo: row.cellNo ? String(row.cellNo) : "",
          address1: row.address1 || "",
          openingDebit: parseFloat(row.openingDebit) || 0,
          openingCredit: parseFloat(row.openingCredit) || 0,
          panNo: row.panNo ? String(row.panNo) : "",
          gstNo: row.gstNo ? String(row.gstNo) : "",
          contactPerson: row.contactPerson || "",
          email: row.email || "",
          state: row.state || ""
        })}
        onImport={handleBulkImport}
      />

    </div>
  );
}
