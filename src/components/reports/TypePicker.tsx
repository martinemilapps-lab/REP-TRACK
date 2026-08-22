'use client';

import React from 'react';
import { ActivityType } from '@/types';

interface TypePickerProps {
  selectedType: ActivityType | null;
  onSelect: (type: ActivityType) => void;
}

const TYPES: { type: ActivityType; icon: string; label: string }[] = [
  { type: 'hospital', icon: '🏥', label: 'زيارة مستشفى' },
  { type: 'pharmacy', icon: '💊', label: 'زيارة صيدلية' },
  { type: 'doctor', icon: '🩺', label: 'زيارة دكتور' },
  { type: 'branch', icon: '🏢', label: 'فرع توزيع' },
  { type: 'availability', icon: '📦', label: 'توافر المنتج بالمستشفى' },
];

export function TypePicker({ selectedType, onSelect }: TypePickerProps) {
  return (
    <div className="flex gap-2.5 flex-wrap mb-1">
      {TYPES.map((item) => {
        const isSelected = selectedType === item.type;
        return (
          <button
            key={item.type}
            type="button"
            onClick={() => onSelect(item.type)}
            className={`flex-1 min-w-[130px] border-2 rounded-xl p-3.5 text-center cursor-pointer transition-all ${
              isSelected
                ? 'border-[var(--teal)] bg-[var(--teal-tint)] text-[var(--teal-deep)] shadow-xs'
                : 'border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--teal)]'
            }`}
          >
            <span className="text-xl block mb-1.5">{item.icon}</span>
            <span className="font-bold text-xs md:text-sm">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
