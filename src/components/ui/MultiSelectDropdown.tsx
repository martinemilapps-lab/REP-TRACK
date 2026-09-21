'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18nContext';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: (string | MultiSelectOption)[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder,
  className = '',
}: MultiSelectDropdownProps) {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const l = (en: string, arabic: string) => (ar ? arabic : en);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize options to { value, label }
  const normalizedOptions = useMemo<MultiSelectOption[]>(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const query = searchQuery.toLowerCase();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query)
    );
  }, [normalizedOptions, searchQuery]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleSelectAll = () => {
    onChange(normalizedOptions.map((o) => o.value));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Button display text
  const buttonText = useMemo(() => {
    if (selectedValues.length === 0) {
      return placeholder || l('All', 'الكل');
    }
    if (selectedValues.length === 1) {
      const found = normalizedOptions.find((o) => o.value === selectedValues[0]);
      return found ? found.label : selectedValues[0];
    }
    if (selectedValues.length === normalizedOptions.length && normalizedOptions.length > 1) {
      return l('All selected', 'الكل محدد');
    }
    const firstTwo = selectedValues
      .slice(0, 2)
      .map((val) => normalizedOptions.find((o) => o.value === val)?.label || val)
      .join(', ');
    const remaining = selectedValues.length - 2;
    return remaining > 0 ? `${firstTwo} (+${remaining})` : firstTwo;
  }, [selectedValues, normalizedOptions, placeholder, l]);

  return (
    <div className={`min-w-0 flex-1 relative ${className}`} ref={dropdownRef}>
      <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1">
        {label}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-11 flex items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs md:text-sm text-start transition-all cursor-pointer hover:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] ${
          selectedValues.length > 0 ? 'border-[var(--gold)] font-medium text-[var(--ink)]' : 'text-[var(--ink-soft)]'
        }`}
      >
        <span className="truncate flex-1">{buttonText}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {selectedValues.length > 0 && (
            <span className="inline-flex items-center justify-center size-5 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white text-[10px] font-bold">
              {selectedValues.length}
            </span>
          )}
          <ChevronDown
            className={`size-4 text-[var(--ink-soft)] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[var(--gold)]' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 w-full min-w-[240px] max-w-[340px] rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-xl animate-fade-in"
          style={{ maxHeight: '360px', overflowY: 'auto' }}
        >
          {/* Header Actions: Select All / Clear */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--line)] text-xs">
            <span className="font-bold text-[var(--ink)]">
              {l('Multiple choice', 'اختيار متعدد')} ({selectedValues.length}/{normalizedOptions.length})
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[var(--gold-dark)] hover:underline font-semibold cursor-pointer"
              >
                {l('Select All', 'تحديد الكل')}
              </button>
              <span className="text-[var(--line)]">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[var(--ink-soft)] hover:text-red-500 font-semibold cursor-pointer"
              >
                {l('Clear', 'إلغاء')}
              </button>
            </div>
          </div>

          {/* Search Filter if options > 5 */}
          {normalizedOptions.length > 5 && (
            <div className="relative mb-2">
              <Search className="absolute start-2.5 top-2.5 size-3.5 text-[var(--ink-soft)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={l('Search options…', 'بحث في الخيارات…')}
                className="w-full rounded-md border border-[var(--line)] bg-[var(--surface-subtle)] ps-8 pe-7 py-1.5 text-xs focus:outline-none focus:border-[var(--gold)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute end-2 top-2 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {filteredOptions.length === 0 ? (
              <p className="py-3 text-center text-xs text-[var(--ink-soft)]">
                {l('No matching options', 'لا توجد خيارات مطابقة')}
              </p>
            ) : (
              filteredOptions.map((option) => {
                const isChecked = selectedValues.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs md:text-sm cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-[var(--gold)]/10 text-[var(--gold-dark)] font-semibold'
                        : 'text-[var(--ink)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOption(option.value)}
                      className="size-4 rounded border-[var(--line)] text-[var(--gold)] focus:ring-[var(--gold)] cursor-pointer"
                    />
                    <span className="flex-1 truncate">{option.label}</span>
                    {isChecked && <Check className="size-3.5 text-[var(--gold)] shrink-0" />}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
