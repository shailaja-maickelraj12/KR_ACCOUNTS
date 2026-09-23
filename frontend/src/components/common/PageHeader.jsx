import React from "react";

export default function PageHeader({ title, category, description, actions }) {
  return (
    <div className="page-header border-b border-[#E2E8F0] bg-white p-6 shrink-0" id="page-header-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          {/* Breadcrumbs */}
          <div className="text-[11px] font-bold tracking-wider text-[#64748B] uppercase mb-1">
            {category} / <span className="text-[#2563EB]">{title}</span>
          </div>
          {/* Main Title and subtitled help */}
          <h1 className="text-xl font-bold text-[#1E293B]" id="page-title-header">{title}</h1>
          {description && (
            <p className="text-xs text-[#64748B] mt-1">{description}</p>
          )}
        </div>
        {/* Dynamic Context Actions */}
        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
