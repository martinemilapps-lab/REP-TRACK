'use client';

import React from 'react';

interface CoverageRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercentSymbol?: boolean;
}

export function CoverageRing({
  percentage,
  size = 54,
  strokeWidth = 5,
  label,
  showPercentSymbol = true,
}: CoverageRingProps) {
  const clamped = Math.max(0, Math.min(100, isNaN(percentage) ? 0 : Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  // Dynamic color gradient based on coverage tier
  let gradientId = 'goldGradient';
  if (clamped >= 100) {
    gradientId = 'greenGradient';
  } else if (clamped < 40) {
    gradientId = 'amberGradient';
  }

  return (
    <div className="flex flex-col items-center justify-center shrink-0">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5A623" />
              <stop offset="100%" stopColor="#E59819" />
            </linearGradient>
            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>
            <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Background track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--line)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Active progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex items-center justify-center font-mono font-extrabold text-[12px] text-[var(--ink)]">
          <span>{clamped}</span>
          {showPercentSymbol && <span className="text-[9px] font-bold text-[var(--ink-soft)]">%</span>}
        </div>
      </div>

      {label && <span className="mt-1 text-[11px] font-bold text-[var(--ink-soft)]">{label}</span>}
    </div>
  );
}
