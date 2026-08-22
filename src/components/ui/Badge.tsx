'use client';

import React from 'react';

interface BadgeProps {
  status?: string;
  type?: 'visit' | 'availability';
}

export function Badge({ status = '', type = 'visit' }: BadgeProps) {
  if (type === 'availability') {
    const isAvailable = status === 'Available';
    return (
      <span
        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
          isAvailable
            ? 'bg-[var(--green-tint)] text-[var(--green)]'
            : 'bg-[var(--amber-tint)] text-[var(--amber)]'
        }`}
      >
        {isAvailable ? 'متوفر' : 'مش متوفر'}
      </span>
    );
  }

  const s = status.toLowerCase();
  if (s.includes('visited') && !s.includes('not') && !s.includes('overdue')) {
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--green-tint)] text-[var(--green)]">
        تم الزيارة
      </span>
    );
  }
  if (s.includes('overdue')) {
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--coral-tint)] text-[var(--coral)]">
        متأخرة
      </span>
    );
  }

  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--amber-tint)] text-[var(--amber)]">
      لسه
    </span>
  );
}
