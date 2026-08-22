'use client';

import React from 'react';

interface ProgressBarProps {
  label: string;
  actual: number;
  assigned: number;
}

export function ProgressBar({ label, actual, assigned }: ProgressBarProps) {
  const percentage = assigned > 0 ? Math.min(Math.round((actual / assigned) * 100), 100) : 0;

  return (
    <div className="flex items-center gap-2 mt-2 text-xs">
      <div className="w-16 text-[var(--ink-soft)] shrink-0 font-medium">{label}</div>
      <div className="flex-1 h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--teal)] rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="w-14 text-left font-mono text-[11px] text-[var(--ink-soft)] shrink-0">
        {actual}/{assigned}
      </div>
    </div>
  );
}
