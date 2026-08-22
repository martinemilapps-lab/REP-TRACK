'use client';

import React from 'react';
import { ActivityType } from '@/types';

interface EntityTabsProps {
  activeTab: ActivityType;
  onChange: (tab: ActivityType) => void;
}

const TABS: { key: ActivityType; label: string; icon: string }[] = [
  { key: 'hospital', label: 'المستشفيات', icon: '🏥' },
  { key: 'pharmacy', label: 'الصيدليات', icon: '💊' },
  { key: 'doctor', label: 'الدكاترة', icon: '🩺' },
  { key: 'branch', label: 'فروع التوزيع', icon: '🏢' },
  { key: 'availability', label: 'توافر المنتج', icon: '📦' },
];

export function EntityTabs({ activeTab, onChange }: EntityTabsProps) {
  return (
    <div className="flex gap-2 flex-wrap mb-3.5">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? 'bg-[var(--ink)] text-white border-[var(--ink)] shadow-xs'
                : 'bg-white text-[var(--ink-soft)] border-[var(--line)] hover:border-[var(--ink-soft)]'
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
