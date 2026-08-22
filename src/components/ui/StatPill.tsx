'use client';

import React from 'react';

interface StatPillProps {
  label: string;
  value: number | string;
}

export function StatPill({ label, value }: StatPillProps) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl px-5 py-3 flex-1 min-w-[130px] shadow-xs">
      <div className="font-mono text-2xl font-bold text-[var(--teal-deep)]">{value}</div>
      <div className="text-xs text-[var(--ink-soft)] mt-1 font-medium">{label}</div>
    </div>
  );
}
