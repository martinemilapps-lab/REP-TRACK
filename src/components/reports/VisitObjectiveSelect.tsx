'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { OBJECTIVES_BY_SECTION, ObjectiveOption } from '@/lib/constants';
import { useTranslation } from '@/lib/i18nContext';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';

interface VisitObjectiveSelectProps {
  section: 'hospital' | 'pharmacy' | 'doctor' | 'branch' | 'availability';
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const CUSTOM_VALUE = '__custom__';

export function VisitObjectiveSelect({
  section,
  value,
  onChange,
  className = '',
}: VisitObjectiveSelectProps) {
  const { t, language } = useTranslation();
  const objectives = useMemo<ObjectiveOption[]>(() => {
    return OBJECTIVES_BY_SECTION[section] || [];
  }, [section]);

  // Determine whether current value matches a predefined option
  const matchedPredefined = useMemo(() => {
    if (!value) return null;
    return objectives.find(
      (opt) => opt.value === value || (language === 'ar' ? opt.labelAr : opt.labelEn) === value
    );
  }, [objectives, value, language]);

  const [isCustomMode, setIsCustomMode] = useState<boolean>(() => {
    return Boolean(value && !matchedPredefined);
  });

  // Keep custom mode synced when value changes externally (e.g. draft restore)
  useEffect(() => {
    if (value && !matchedPredefined) {
      setIsCustomMode(true);
    }
  }, [value, matchedPredefined]);

  const selectOptions = useMemo<SelectOption[]>(() => {
    const list: SelectOption[] = objectives.map((opt) => ({
      value: opt.value,
      label: language === 'ar' ? opt.labelAr : opt.labelEn,
    }));

    list.push({
      value: CUSTOM_VALUE,
      label: t('form.customObjective'),
    });

    return list;
  }, [objectives, language, t]);

  const selectedSelectValue = useMemo(() => {
    if (isCustomMode) return CUSTOM_VALUE;
    if (matchedPredefined) return matchedPredefined.value;
    return value ? CUSTOM_VALUE : '';
  }, [isCustomMode, matchedPredefined, value]);

  const handleSelectChange = (newVal: string) => {
    if (newVal === CUSTOM_VALUE) {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
      onChange(newVal);
    }
  };

  const handleChipClick = (optValue: string) => {
    setIsCustomMode(false);
    onChange(optValue);
  };

  const commonChips = useMemo(() => {
    return objectives.filter((opt) => opt.isCommon);
  }, [objectives]);

  return (
    <div
      className={`mb-4 bg-[var(--surface-subtle)]/75 p-3.5 md:p-4 rounded-xl border border-[var(--line)] shadow-2xs transition-all ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor="objective-select"
          className="text-xs font-extrabold text-[var(--ink)] flex items-center gap-1.5 cursor-pointer"
        >
          <span className="text-base">🎯</span>
          <span>{t('form.objective')}</span>
        </label>
        <span className="text-[10px] font-bold text-[var(--gold-deep)] bg-[var(--gold-tint)] px-2 py-0.5 rounded-md">
          {language === 'ar' ? 'قائمة أهداف الزيارة المعتمدة' : 'Standard Objectives List'}
        </span>
      </div>

      {/* Main Select Dropdown */}
      <div className="relative">
        <CustomSelect
          options={selectOptions}
          value={selectedSelectValue}
          onChange={handleSelectChange}
          placeholder={t('form.selectObjective')}
          searchable={false}
        />
      </div>

      {/* Quick-Pick Chips */}
      {commonChips.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-[var(--ink-muted)] shrink-0 flex items-center gap-1">
            <span>⚡</span>
            <span>{t('form.quickObjectives')}</span>
          </span>
          {commonChips.map((opt) => {
            const isCurrent = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleChipClick(opt.value)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all text-start ${
                  isCurrent
                    ? 'bg-[var(--gold)] text-amber-950 border-[var(--gold-dark)] font-bold shadow-2xs scale-[1.02]'
                    : 'bg-white text-[var(--ink-secondary)] border-[var(--line)] hover:border-[var(--gold)] hover:bg-amber-50/50'
                }`}
              >
                {language === 'ar' ? opt.labelAr : opt.labelEn}
              </button>
            );
          })}
        </div>
      )}

      {/* Custom Text Input if "Other" is selected or user wants to customize */}
      {isCustomMode && (
        <div className="mt-2.5 animate-fade-in pt-2 border-t border-[var(--line)]/60">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-[var(--ink-soft)]">
              {language === 'ar' ? 'اكتب هدف الزيارة المخصص:' : 'Type custom visit objective:'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsCustomMode(false);
                if (objectives[0]) onChange(objectives[0].value);
              }}
              className="text-[10px] text-[var(--gold-dark)] hover:underline font-bold"
            >
              {language === 'ar' ? 'العودة للقائمة' : 'Back to list'}
            </button>
          </div>
          <input
            id="objective"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t('form.objectivePlaceholder')}
            autoFocus
            className="w-full px-3.5 py-2.5 text-xs md:text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] rounded-xl font-medium outline-none shadow-2xs transition-all text-[var(--ink)]"
          />
        </div>
      )}
    </div>
  );
}
