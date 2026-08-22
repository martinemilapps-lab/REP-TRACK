'use client';

import React from 'react';
import { ActivityType } from '@/types';
import { useTranslation } from '@/lib/i18nContext';

interface EntityTabsProps {
  activeTab: ActivityType;
  onChange: (tab: ActivityType) => void;
  className?: string;
}

export function EntityTabs({ activeTab, onChange, className = '' }: EntityTabsProps) {
  const { t } = useTranslation();

  const tabs: { type: ActivityType; label: string; icon: string }[] = [
    { type: 'hospital', label: t('activity.hospital'), icon: '🏥' },
    { type: 'pharmacy', label: t('activity.pharmacy'), icon: '💊' },
    { type: 'doctor', label: t('activity.doctor'), icon: '🩺' },
    { type: 'branch', label: t('activity.branch'), icon: '🏢' },
    { type: 'availability', label: t('activity.availability'), icon: '📦' },
  ];

  return (
    <div className={`flex gap-1.5 overflow-x-auto pb-1 max-w-full ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.type;
        return (
          <button
            key={tab.type}
            onClick={() => onChange(tab.type)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none border ${
              isActive
                ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white border-[var(--gold-dark)] shadow-xs font-extrabold'
                : 'bg-[var(--surface)] text-[var(--ink-soft)] border-[var(--line)] hover:border-[var(--gold-light)] hover:text-[var(--ink)]'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
