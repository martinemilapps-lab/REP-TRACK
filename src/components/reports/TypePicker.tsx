'use client';

import React from 'react';
import { ActivityType } from '@/types';
import { useTranslation } from '@/lib/i18nContext';

interface TypePickerProps {
  selectedType: ActivityType | null;
  onSelect: (type: ActivityType) => void;
}

export function TypePicker({ selectedType, onSelect }: TypePickerProps) {
  const { t } = useTranslation();

  const types: { type: ActivityType; icon: string; label: string }[] = [
    { type: 'hospital', icon: '🏥', label: t('activity.hospital') },
    { type: 'pharmacy', icon: '💊', label: t('activity.pharmacy') },
    { type: 'doctor', icon: '🩺', label: t('activity.doctor') },
    { type: 'branch', icon: '🏢', label: t('activity.branch') },
    { type: 'availability', icon: '📦', label: t('activity.availability') },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
      {types.map((item) => {
        const isSelected = selectedType === item.type;
        return (
          <button
            key={item.type}
            type="button"
            onClick={() => onSelect(item.type)}
            className={`border-2 rounded-[var(--radius)] p-3.5 text-center cursor-pointer transition-all duration-200 select-none flex flex-col items-center justify-center ${
              isSelected
                ? 'border-[var(--gold)] bg-gradient-to-b from-[var(--gold-tint)] to-[var(--surface)] text-[var(--ink)] shadow-hover'
                : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:border-[var(--gold-light)] hover:bg-[#FAF9F5]'
            }`}
          >
            <span className="text-2xl mb-1.5 transform transition-transform group-hover:scale-110">
              {item.icon}
            </span>
            <span className="font-bold text-xs md:text-sm tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
