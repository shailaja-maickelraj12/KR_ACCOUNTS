import React from "react";

export default function SearchPanel({ value = "", onChange, placeholder = "Search" }) {
  return (
    <input
      className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
    />
  );
}
