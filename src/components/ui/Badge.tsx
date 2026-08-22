'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18nContext';

interface BadgeProps {
  status: string;
  type?: 'visit' | 'availability' | 'class' | 'active';
  className?: string;
}

export function Badge({ status, type = 'visit', className = '' }: BadgeProps) {
  const { t } = useTranslation();
  const normalized = status ? status.trim().toLowerCase() : '';

  if (type === 'availability') {
    const isAvailable = normalized === 'available' || normalized.includes('متوافر') || normalized === 'true';
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
          isAvailable
            ? 'bg-[var(--visited-bg)] text-[var(--visited-color)] border-[var(--visited-border)]'
            : 'bg-[var(--overdue-bg)] text-[var(--overdue-color)] border-[var(--overdue-border)]'
        } ${className}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isAvailable ? 'bg-[var(--visited-color)]' : 'bg-[var(--overdue-color)]'
          }`}
        />
        <span>{isAvailable ? t('status.available') : t('status.notAvailable')}</span>
      </span>
    );
  }

  if (type === 'class') {
    return (
      <span
        className={`inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[var(--surface-subtle)] text-[var(--ink-secondary)] border border-[var(--line)] ${className}`}
      >
        {status}
      </span>
    );
  }

  // Visit Status
  let colorStyles = 'bg-[var(--surface-subtle)] text-[var(--ink-soft)] border-[var(--line)]';
  let dotColor = 'bg-[var(--ink-muted)]';
  let label = status;

  if (normalized === 'visited' || normalized.includes('تم الزيارة')) {
    colorStyles = 'bg-[var(--visited-bg)] text-[var(--visited-color)] border-[var(--visited-border)]';
    dotColor = 'bg-[var(--visited-color)]';
    label = t('status.visited');
  } else if (normalized === 'overdue' || normalized.includes('متأخرة') || normalized.includes('متأخر')) {
    colorStyles = 'bg-[var(--overdue-bg)] text-[var(--overdue-color)] border-[var(--overdue-border)]';
    dotColor = 'bg-[var(--overdue-color)]';
    label = t('status.overdue');
  } else if (normalized === 'not visited yet' || normalized.includes('لم تتم') || normalized.includes('لسه')) {
    colorStyles = 'bg-[var(--pending-bg)] text-[var(--pending-color)] border-[var(--pending-border)]';
    dotColor = 'bg-[var(--pending-color)]';
    label = t('status.notVisited');
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${colorStyles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}
