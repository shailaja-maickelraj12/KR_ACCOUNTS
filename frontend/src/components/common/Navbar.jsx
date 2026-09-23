import React from "react";

export default function Navbar({ title = "KR Accounts" }) {
  return (
    <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
      <span className="font-semibold text-slate-800">{title}</span>
    </header>
  );
}
