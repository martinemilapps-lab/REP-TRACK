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
  isMulti?: boolean;
}

const CUSTOM_VALUE = '__custom__';

export function VisitObjectiveSelect({
  section,
  value,
  onChange,
  className = '',
  isMulti = false,
}: VisitObjectiveSelectProps) {
  const { t, language } = useTranslation();
  const objectives = useMemo<ObjectiveOption[]>(() => {
    return OBJECTIVES_BY_SECTION[section] || [];
  }, [section]);

  // Multi-select state and helpers
  const selectedMultiValues = useMemo(() => {
    if (!isMulti || !value) return [];
    return value
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [isMulti, value]);

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState('');

  const handleToggleOption = (optValue: string) => {
    const current = [...selectedMultiValues];
    const index = current.indexOf(optValue);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(optValue);
    }
    onChange(current.join('، '));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    const trimmed = customText.trim();
    if (!selectedMultiValues.includes(trimmed)) {
      const next = [...selectedMultiValues, trimmed];
      onChange(next.join('، '));
    }
    setCustomText('');
    setShowCustomInput(false);
  };

  const handleRemoveItem = (itemToRemove: string) => {
    const next = selectedMultiValues.filter((v) => v !== itemToRemove);
    onChange(next.join('، '));
  };

  const handleClearAll = () => {
    onChange('');
  };

  // Determine whether current value matches a predefined option (Single mode)
  const matchedPredefined = useMemo(() => {
    if (isMulti || !value) return null;
    return objectives.find(
      (opt) => opt.value === value || (language === 'ar' ? opt.labelAr : opt.labelEn) === value
    );
  }, [objectives, value, language, isMulti]);

  const [isCustomMode, setIsCustomMode] = useState<boolean>(() => {
    if (isMulti) return false;
    return Boolean(value && !matchedPredefined);
  });

  // Keep custom mode synced when value changes externally (e.g. draft restore)
  useEffect(() => {
    if (!isMulti && value && !matchedPredefined) {
      setIsCustomMode(true);
    }
  }, [isMulti, value, matchedPredefined]);

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

  // If in multi-select mode, render the rich multi-choice pill interface
  if (isMulti) {
    return (
      <div
        className={`mb-4 bg-[var(--surface-subtle)]/80 p-4 rounded-xl border border-[var(--line)] shadow-2xs transition-all ${className}`}
      >
        {/* Header with Title & Multi-selection notice */}
        <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-extrabold text-[var(--ink)]">
                  {t('form.objective')} *
                </label>
                {selectedMultiValues.length > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    {selectedMultiValues.length} {t('form.selectedObjectivesCount')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--ink-muted)]">
                {t('form.multiObjectivesNotice')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedMultiValues.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer transition-colors"
              >
                ✕ {t('form.clearObjectives')}
              </button>
            )}
            <span className="text-[10px] font-bold text-[var(--gold-deep)] bg-[var(--gold-tint)] px-2.5 py-1 rounded-md border border-[var(--gold-light)]/50">
              {language === 'ar' ? 'اختيار متعدد' : 'Multi-Select'}
            </span>
          </div>
        </div>

        {/* Multi-Option Grid of Interactive Checkbox Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
          {objectives.map((opt) => {
            const isSelected =
              selectedMultiValues.includes(opt.value) ||
              selectedMultiValues.includes(opt.labelAr) ||
              selectedMultiValues.includes(opt.labelEn);

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleToggleOption(opt.value)}
                className={`p-2.5 rounded-xl border text-start flex items-start gap-2.5 transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-amber-50/90 border-[var(--gold)] text-amber-950 shadow-2xs scale-[1.01]'
                    : 'bg-white border-[var(--line)] text-[var(--ink)] hover:border-[var(--gold)]/60 hover:bg-amber-50/30'
                }`}
              >
                <span
                  className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center text-[10px] shrink-0 border transition-all ${
                    isSelected
                      ? 'bg-[var(--gold)] text-amber-950 border-[var(--gold-dark)] font-extrabold shadow-2xs'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isSelected ? '✓' : ''}
                </span>
                <span className={`text-xs leading-snug ${isSelected ? 'font-bold text-amber-950' : 'font-medium'}`}>
                  {language === 'ar' ? opt.labelAr : opt.labelEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom additions tags */}
        {selectedMultiValues.filter((val) => !objectives.some((o) => o.value === val || o.labelAr === val || o.labelEn === val)).length > 0 && (
          <div className="mb-3 pt-2 border-t border-[var(--line)]/60 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[var(--ink-muted)]">
              {language === 'ar' ? 'أهداف مخصصة إضافية:' : 'Custom objectives:'}
            </span>
            {selectedMultiValues
              .filter((val) => !objectives.some((o) => o.value === val || o.labelAr === val || o.labelEn === val))
              .map((customVal) => (
                <span
                  key={customVal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold"
                >
                  <span>{customVal}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(customVal)}
                    className="text-blue-700 hover:text-red-600 font-bold ml-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              ))}
          </div>
        )}

        {/* Custom Objective Addition Trigger & Form */}
        <div className="pt-2 border-t border-[var(--line)]/60">
          {!showCustomInput ? (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="text-xs font-bold text-[var(--gold-dark)] hover:text-amber-900 flex items-center gap-1.5 transition-colors cursor-pointer py-1"
            >
              <span>➕</span>
              <span>{t('form.addCustomObjectiveBtn')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 animate-fade-in">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustom(e);
                  }
                }}
                placeholder={language === 'ar' ? 'اكتب هدف الزيارة الإضافي واضغط إضافة...' : 'Type additional objective and click Add...'}
                autoFocus
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-lg outline-none font-medium text-[var(--ink)]"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                className="px-3 py-1.5 rounded-lg bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-amber-950 font-bold text-xs shadow-2xs cursor-pointer transition-colors"
              >
                {language === 'ar' ? 'إضافة' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomText('');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs cursor-pointer transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Single-Select Mode
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
