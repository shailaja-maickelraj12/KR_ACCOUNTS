import React from "react";

export default function DateFilter({ from, to, onFromChange, onToChange }) {
  return (
    <div className="flex gap-2">
      <input className="h-10 border border-slate-300 px-3 text-sm" type="date" value={from || ""} onChange={(event) => onFromChange?.(event.target.value)} />
      <input className="h-10 border border-slate-300 px-3 text-sm" type="date" value={to || ""} onChange={(event) => onToChange?.(event.target.value)} />
    </div>
  );
}
