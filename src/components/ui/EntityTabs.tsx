'use client';

import { Hospital, Pill, Stethoscope, Building2, CalendarDays, GraduationCap, ClipboardList, PackageSearch } from 'lucide-react';
import React from 'react';
import { ActivityType } from '@/types';
import { useTranslation } from '@/lib/i18nContext';

interface EntityTabsProps {
  activeTab: ActivityType;
  onChange: (tab: ActivityType) => void;
  className?: string;
  showAllFiveItems?: boolean;
}

export function EntityTabs({
  activeTab,
  onChange,
  className = '',
  showAllFiveItems = true,
}: EntityTabsProps) {
  const { t, language } = useTranslation();

  const tabs: { type: ActivityType; label: string; icon: React.ReactNode }[] = showAllFiveItems
    ? [
        { type: 'hospital', label: t('activity.hospital'), icon: <Hospital className="size-5"/> },
        { type: 'pharmacy', label: t('activity.pharmacy'), icon: <Pill className="size-5"/> },
        { type: 'doctor', label: t('activity.doctor'), icon: <Stethoscope className="size-5"/> },
        { type: 'branch', label: t('activity.branch'), icon: <Building2 className="size-5"/> },
        { type: 'event', label: t('activity.events'), icon: <CalendarDays className="size-5"/> },
        { type: 'training', label: t('activity.training'), icon: <GraduationCap className="size-5"/> },
        { type: 'special_task', label: t('activity.specialTasks'), icon: <ClipboardList className="size-5"/> },
        { type: 'availability', label: language==='ar'?'توافر المنتجات':'Product availability', icon: <PackageSearch className="size-5"/> },
      ]
    : [
        { type: 'hospital', label: t('activity.hospital'), icon: <Hospital className="size-5"/> },
        { type: 'pharmacy', label: t('activity.pharmacy'), icon: <Pill className="size-5"/> },
        { type: 'doctor', label: t('activity.doctor'), icon: <Stethoscope className="size-5"/> },
        { type: 'branch', label: t('activity.branch'), icon: <Building2 className="size-5"/> },
        { type: 'availability', label: t('activity.productsAnalysis'), icon: <PackageSearch className="size-5"/> },
      ];

  return (
    <div className={`flex gap-1.5 overflow-x-auto pb-1 max-w-full ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.type;
        return (
          <button type="button"
            key={tab.type}
            onClick={() => onChange(tab.type)}
            className={`px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none border ${
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
