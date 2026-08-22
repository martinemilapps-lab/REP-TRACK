'use client';

import React from 'react';

interface CoverageRingProps {
  percentage: number;
}

export function CoverageRing({ percentage }: CoverageRingProps) {
  const clampedPct = Math.min(Math.max(percentage, 0), 100);

  return (
    <div
      className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center transition-all duration-500"
      style={{
        background: `conic-gradient(var(--teal) ${clampedPct}%, var(--line) 0)`,
      }}
    >
      <div className="w-[42px] h-[42px] rounded-full bg-[var(--surface)] flex items-center justify-center font-mono text-xs font-bold text-[var(--ink)] shadow-xs">
        {percentage}%
      </div>
    </div>
  );
}
