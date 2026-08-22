'use client';

import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 text-center bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] shadow-card ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-[var(--gold-tint)] border border-[var(--gold-border)] flex items-center justify-center text-[var(--gold-dark)] text-2xl mb-3 shadow-xs">
        {icon || '📋'}
      </div>
      <h3 className="text-sm md:text-base font-bold text-[var(--ink)] mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-[var(--ink-soft)] max-w-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
