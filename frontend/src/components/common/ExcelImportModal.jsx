import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, CheckCircle2, AlertCircle, X, FileSpreadsheet, RefreshCw, FileCheck } from "lucide-react";

/**
 * Reusable Bulk Import Modal.
 * Features:
 * - Uploading and parsing .xlsx, .xls, and .csv files via SheetJS
 * - Flexible normalized column mapping
 * - Real-time validation and interactive preview table
 * - Real-time animated Progress Bar during bulk data import
 */
export default function ExcelImportModal({
  isOpen,
  onClose,
  title = "Bulk Import Data",
  templateColumns = [],
  columnMap = {},
  requiredFields = [],
  transformRow = (row) => row,
  onImport = async () => {}
}) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percent: 0 });
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Helper to normalize string for fuzzy column matching
  const normalizeKey = (key) => String(key || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  // Parse Uploaded Excel File
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setErrorMsg("");
    setFile(selectedFile);
    setIsValidating(true);
    setProgress({ current: 0, total: 0, percent: 0 });

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        
        // Read raw objects from sheet
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (rawJson.length === 0) {
          setErrorMsg("The selected Excel file is empty.");
          setParsedRows([]);
          setIsValidating(false);
          return;
        }

        // Build normalized header lookup map
        const normalizedColumnMap = {};
        Object.entries(columnMap).forEach(([rawKey, targetField]) => {
          normalizedColumnMap[normalizeKey(rawKey)] = targetField;
        });

        // Parse and validate each row
        const processed = rawJson.map((row, idx) => {
          const mappedRow = {};

          Object.entries(row).forEach(([colHeader, cellValue]) => {
            const cleanKey = normalizeKey(colHeader);
            const targetField = normalizedColumnMap[cleanKey] || colHeader;
            
            if (typeof cellValue === "string") {
              mappedRow[targetField] = cellValue.trim();
            } else {
              mappedRow[targetField] = cellValue;
            }
          });

          // Run custom transformation
          const transformed = transformRow(mappedRow, idx, rawJson);

          // Validation check for required fields
          const missingFields = requiredFields.filter(field => {
            const val = transformed[field];
            return val === undefined || val === null || String(val).trim() === "";
          });

          return {
            _index: idx + 1,
            _raw: mappedRow,
            _transformed: transformed,
            _isValid: missingFields.length === 0,
            _errors: missingFields.map(f => `Missing ${f}`)
          };
        });

        setParsedRows(processed);
      } catch (err) {
        console.error("Error reading file:", err);
        setErrorMsg("Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.");
      } finally {
        setIsValidating(false);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  // Confirm and execute bulk import
  const handleConfirmImport = async () => {
    const validItems = parsedRows.filter(r => r._isValid).map(r => r._transformed);
    if (validItems.length === 0) {
      alert("No valid rows found to import.");
      return;
    }

    try {
      setIsImporting(true);
      setErrorMsg("");
      setProgress({ current: 0, total: validItems.length, percent: 0 });

      await onImport(validItems, (current, total) => {
        const pct = Math.round((current / total) * 100);
        setProgress({ current, total, percent: pct });
      });

      // Brief delay so user sees 100% completed
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err) {
      console.error("Bulk Import failed:", err);
      setErrorMsg(err.message || "An error occurred during bulk import.");
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedRows.filter(r => r._isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 bg-[#1E293B]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="bulk-import-modal">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-[#2563EB] rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm">{title}</h2>
              <p className="text-[11px] text-slate-500">Upload your spreadsheet (.xlsx, .xls, .csv) to bulk import records directly into database</p>
            </div>
          </div>
          {!isImporting && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200 cursor-pointer transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          
          {/* Upload Dropzone */}
          <div 
            onClick={() => !isImporting && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
              file 
                ? "border-blue-400 bg-blue-50/30" 
                : "border-slate-300 hover:border-blue-500 hover:bg-slate-50/80 bg-slate-50/40"
            } ${isImporting ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              disabled={isImporting}
              className="hidden"
            />
            
            {file ? (
              <div className="flex items-center gap-3 text-slate-700">
                <div className="p-3 bg-blue-600 text-white rounded-lg shadow-xs">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-xs text-slate-800">{file.name}</p>
                  <p className="text-[11px] text-slate-500">{(file.size / 1024).toFixed(1)} KB • Click to choose a different spreadsheet</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-3 bg-blue-50 text-[#2563EB] rounded-full border border-blue-100">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-xs text-slate-800">
                    Click to select your Excel file <span className="font-normal text-slate-500">or drag and drop here</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) files</p>
                </div>
              </>
            )}
          </div>

          {/* Real-time Import Progress Bar */}
          {isImporting && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col gap-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  Importing records into database: {progress.current} / {progress.total}
                </span>
                <span className="font-mono">{progress.percent}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-150 ease-out" 
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="text-[10px] text-blue-700">Please do not close this window while the import completes...</p>
            </div>
          )}

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Validation & Preview Section */}
          {parsedRows.length > 0 && !isImporting && (
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <span>Data Preview ({parsedRows.length} total records)</span>
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    ✓ {validCount} valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      ⚠ {invalidCount} invalid
                    </span>
                  )}
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-64 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5 w-12 text-center">Status</th>
                      <th className="p-2.5 w-12 text-center">Row</th>
                      {templateColumns.map(col => (
                        <th key={col} className="p-2.5 whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {parsedRows.slice(0, 50).map((row) => (
                      <tr key={row._index} className={row._isValid ? "hover:bg-slate-50" : "bg-red-50/60 hover:bg-red-50"}>
                        <td className="p-2.5 text-center">
                          {row._isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 inline-block" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500 inline-block" title={row._errors.join(", ")} />
                          )}
                        </td>
                        <td className="p-2.5 text-center text-slate-400 font-sans">{row._index}</td>
                        {templateColumns.map(col => {
                          const val = row._raw[col] ?? row._transformed[columnMap[col] || col] ?? "";
                          return (
                            <td key={col} className="p-2.5 text-slate-700 whitespace-nowrap max-w-xs truncate">
                              {String(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 50 && (
                <p className="text-[11px] text-slate-500 italic text-right">
                  Showing preview of first 50 records (all {parsedRows.length.toLocaleString()} will be imported).
                </p>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            disabled={isImporting}
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-white rounded-md text-xs font-semibold text-slate-600 disabled:opacity-50 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={parsedRows.length === 0 || validCount === 0 || isImporting}
            onClick={handleConfirmImport}
            className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Importing Records...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Bulk Import {validCount} Record{validCount === 1 ? "" : "s"}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
