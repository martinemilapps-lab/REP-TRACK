'use client';

import React from 'react';

interface ProgressBarProps {
  label: string;
  actual: number;
  assigned: number;
  className?: string;
}

export function ProgressBar({ label, actual, assigned, className = '' }: ProgressBarProps) {
  const percentage = assigned > 0 ? Math.min(100, Math.round((actual / assigned) * 100)) : 0;
  const isComplete = percentage >= 100;

  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex justify-between items-center text-[11px] mb-1">
        <span className="font-semibold text-[var(--ink-secondary)]">{label}</span>
        <span className="font-mono text-[var(--ink-soft)]">
          <strong className="text-[var(--ink)] font-bold">{actual}</strong> / {assigned}
          <span className="text-[10px] text-[var(--ink-muted)] ms-1">({percentage}%)</span>
        </span>
      </div>
      <div className="w-full h-2 bg-[var(--surface-subtle)] border border-[var(--line)] rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isComplete
              ? 'bg-gradient-to-r from-[var(--visited-color)] to-[#22C55E]'
              : 'bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-light)]'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
