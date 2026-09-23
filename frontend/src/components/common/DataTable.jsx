import React from "react";

export default function DataTable({ columns = [], rows = [] }) {
  return (
    <div className="overflow-auto border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column.key || column} className="px-3 py-2 text-left font-semibold text-slate-600">
                {column.label || column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row.code || index} className="border-t border-slate-100">
              {columns.map((column) => {
                const key = column.key || column;
                return <td key={key} className="px-3 py-2 text-slate-700">{row[key]}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
