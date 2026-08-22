'use client';

import React from 'react';

interface StatPillProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
  highlight?: boolean;
}

export function StatPill({
  label,
  value,
  icon,
  subtitle,
  className = '',
  highlight = false,
}: StatPillProps) {
  return (
    <div
      className={`flex-1 min-w-[140px] md:min-w-[160px] bg-[var(--surface)] border rounded-[var(--radius)] p-3.5 shadow-card hover:shadow-hover transition-all duration-200 ${
        highlight
          ? 'border-[var(--gold-border)] bg-gradient-to-b from-[var(--gold-tint)] to-[var(--surface)]'
          : 'border-[var(--line)] hover:border-[var(--gold-light)]'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-bold text-[var(--ink-soft)] truncate">{label}</span>
        {icon && <span className="text-[var(--gold-dark)] text-sm shrink-0">{icon}</span>}
      </div>
      <div className="text-xl md:text-2xl font-extrabold font-mono text-[var(--ink)] tracking-tight">
        {value}
      </div>
      {subtitle && <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">{subtitle}</div>}
    </div>
  );
}
