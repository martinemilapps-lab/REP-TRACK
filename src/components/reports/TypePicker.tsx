'use client';

import React from 'react';
import { ActivityType, VisitEntityType } from '@/types';
import { useTranslation } from '@/lib/i18nContext';

interface TypePickerProps {
  selectedType: ActivityType | null;
  onSelect: (type: ActivityType) => void;
  visitSubtype?: VisitEntityType;
  onSelectVisitSubtype?: (subtype: VisitEntityType) => void;
}

export function TypePicker({
  selectedType,
  onSelect,
  visitSubtype = 'hospital',
  onSelectVisitSubtype,
}: TypePickerProps) {
  const { t } = useTranslation();

  // Normalize active top item
  const isVisitCategory =
    selectedType === 'visit' ||
    selectedType === 'hospital' ||
    selectedType === 'pharmacy' ||
    selectedType === 'doctor' ||
    selectedType === 'branch';

  const isEventCategory = selectedType === 'event';
  const isTrainingCategory = selectedType === 'training';
  const isTaskCategory = selectedType === 'special_task';
  const isAnalysisCategory = selectedType === 'availability' || selectedType === 'product_analysis';

  const mainItems: {
    key: string;
    targetType: ActivityType;
    icon: string;
    badgeNumber: string;
    title: string;
    subtitle: string;
    isSelected: boolean;
  }[] = [
    {
      key: 'visit',
      targetType: visitSubtype || 'hospital',
      icon: '🩺',
      badgeNumber: '1',
      title: t('activity.visitType'),
      subtitle: 'مستشفى، صيدلية، عيادة، موزع',
      isSelected: isVisitCategory,
    },
    {
      key: 'event',
      targetType: 'event',
      icon: '🎟️',
      badgeNumber: '2',
      title: t('activity.events'),
      subtitle: 'مؤتمرات، ندوات، ستاندات',
      isSelected: isEventCategory,
    },
    {
      key: 'training',
      targetType: 'training',
      icon: '🎓',
      badgeNumber: '3',
      title: t('activity.training'),
      subtitle: 'ورش عمل، مهارات، تدريب علمي',
      isSelected: isTrainingCategory,
    },
    {
      key: 'task',
      targetType: 'special_task',
      icon: '⚡',
      badgeNumber: '4',
      title: t('activity.specialTasks'),
      subtitle: 'مسح سوقي، مهام إدارية، أخرى',
      isSelected: isTaskCategory,
    },
    {
      key: 'analysis',
      targetType: 'availability',
      icon: '📊',
      badgeNumber: '5',
      title: t('activity.productsAnalysis'),
      subtitle: 'توافر ومبيعات وبدائل السوق',
      isSelected: isAnalysisCategory,
    },
  ];

  const visitSubtypes: { type: VisitEntityType; icon: string; label: string }[] = [
    { type: 'hospital', icon: '🏥', label: t('activity.hospital') },
    { type: 'pharmacy', icon: '💊', label: t('activity.pharmacy') },
    { type: 'doctor', icon: '🩺', label: t('activity.doctor') },
    { type: 'branch', icon: '🏢', label: t('activity.branch') },
  ];

  return (
    <div className="space-y-3.5">
      {/* 5 Main Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {mainItems.map((item) => {
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.targetType)}
              className={`relative border-2 rounded-[var(--radius)] p-3 md:p-3.5 text-center cursor-pointer transition-all duration-200 select-none flex flex-col items-center justify-center group ${
                item.isSelected
                  ? 'border-[var(--gold)] bg-gradient-to-b from-[var(--gold-tint)] to-[var(--surface)] text-[var(--ink)] shadow-card ring-2 ring-[var(--gold-light)]/20'
                  : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:border-[var(--gold-light)] hover:bg-[#FAF9F5]'
              } ${item.key === 'analysis' ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              {/* Badge Number (1 to 5) */}
              <span
                className={`absolute top-2 left-2 text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center ${
                  item.isSelected
                    ? 'bg-[var(--gold)] text-white'
                    : 'bg-[var(--bg-subtle)] text-[var(--ink-soft)] border border-[var(--line)]'
                }`}
              >
                {item.badgeNumber}
              </span>

              <span className="text-2xl mb-1 transform transition-transform group-hover:scale-110">
                {item.icon}
              </span>
              <span className="font-extrabold text-xs md:text-sm tracking-tight leading-snug">
                {item.title}
              </span>
              <span className="text-[10px] text-[var(--ink-soft)] mt-0.5 line-clamp-1">
                {item.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub-Type Selector: Only visible when Visit Type (Item 1) is active */}
      {isVisitCategory && (
        <div className="bg-gradient-to-r from-[var(--surface)] to-[var(--bg-subtle)] border border-[var(--line)] rounded-xl p-2.5 animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink)] self-start sm:self-center px-1">
            <span className="text-sm">📍</span>
            <span>الجهة المستهدفة للزيارة (Visit Target):</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {visitSubtypes.map((sub) => {
              const isSubSelected = selectedType === sub.type || (selectedType === 'visit' && visitSubtype === sub.type);
              return (
                <button
                  key={sub.type}
                  type="button"
                  onClick={() => {
                    if (onSelectVisitSubtype) onSelectVisitSubtype(sub.type);
                    onSelect(sub.type);
                  }}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 select-none border ${
                    isSubSelected
                      ? 'bg-[var(--gold)] text-white border-[var(--gold-dark)] shadow-xs font-extrabold'
                      : 'bg-[var(--surface)] text-[var(--ink-secondary)] border-[var(--line)] hover:border-[var(--gold-light)] hover:text-[var(--ink)]'
                  }`}
                >
                  <span>{sub.icon}</span>
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
