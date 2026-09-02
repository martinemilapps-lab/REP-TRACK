'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18nContext';

export interface MasterNameComboboxProps<T> {
  id?: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (name: string) => void;
  items: T[];
  getItemName: (item: T) => string;
  getItemSublabel?: (item: T) => string;
  getItemBadge?: (item: T) => string;
  onSelectItem: (item: T) => void;
  selectedMasterId?: string;
  onClearSelection?: () => void;
  required?: boolean;
}

export function MasterNameCombobox<T>({
  id = 'name',
  label,
  placeholder,
  value,
  onChange,
  items,
  getItemName,
  getItemSublabel,
  getItemBadge,
  onSelectItem,
  selectedMasterId,
  onClearSelection,
  required = true,
}: MasterNameComboboxProps<T>) {
  const { language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items according to search query
  const query = value.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    if (!query) return true;
    const nameMatch = getItemName(item).toLowerCase().includes(query);
    const subMatch = getItemSublabel ? getItemSublabel(item).toLowerCase().includes(query) : false;
    return nameMatch || subMatch;
  });

  const selectedItem = selectedMasterId
    ? items.find((item: any) => item.id === selectedMasterId)
    : null;

  return (
    <div className="relative" ref={containerRef}>
      {/* Field Label Header with My Lists indicator */}
      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
        <label htmlFor={id} className="block text-xs font-bold text-[var(--ink-secondary)]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
            className="text-[10px] font-bold text-[var(--gold-deep)] hover:text-[var(--gold-dark)] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>⚡</span>
            <span>
              {language === 'ar'
                ? `قوائمي (${items.length})`
                : `My Lists (${items.length})`}
            </span>
          </button>
        )}
      </div>

      {/* Input wrapper with clear & dropdown trigger */}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (items.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className={`w-full px-3.5 py-2.5 pe-16 text-sm bg-white border rounded-xl font-medium outline-none transition-all ${
            selectedMasterId
              ? 'border-emerald-400 bg-emerald-50/20 text-[var(--ink)]'
              : 'border-[var(--line)] focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-light)]/20'
          }`}
        />

        {/* Action icons on input right side */}
        <div className="absolute inset-y-0 end-0 pe-2.5 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                if (onClearSelection) onClearSelection();
                inputRef.current?.focus();
                setIsOpen(true);
              }}
              title={language === 'ar' ? 'مسح' : 'Clear'}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md text-xs cursor-pointer"
            >
              ✕
            </button>
          )}

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsOpen((prev) => !prev);
                inputRef.current?.focus();
              }}
              title={language === 'ar' ? 'عرض القائمة' : 'Toggle list'}
              className="text-gray-400 hover:text-[var(--gold-dark)] p-1 rounded-md text-xs cursor-pointer transition-transform"
            >
              <span className={`inline-block transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}>
                ▾
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Auto-fill indicator badge when populated from My Lists */}
      {selectedMasterId && selectedItem && (
        <div className="mt-1.5 flex items-center justify-between gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200/70 rounded-lg text-[11px] text-emerald-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 font-medium truncate">
            <span className="text-emerald-600 font-bold">✓</span>
            <span className="truncate">
              {language === 'ar'
                ? `تم استرجاع بيانات "${getItemName(selectedItem)}" تلقائياً من قوائمك`
                : `Data auto-filled for "${getItemName(selectedItem)}" from My Lists`}
            </span>
          </div>
          {onClearSelection && (
            <button
              type="button"
              onClick={onClearSelection}
              className="text-[10px] text-emerald-700 hover:text-emerald-900 underline font-bold cursor-pointer shrink-0"
            >
              {language === 'ar' ? 'تغيير' : 'Change'}
            </button>
          )}
        </div>
      )}

      {/* Autocomplete / Combobox Dropdown from My Lists */}
      {isOpen && items.length > 0 && (
        <div className="absolute z-40 top-full mt-1 inset-x-0 bg-white border border-[var(--line)] rounded-2xl shadow-xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="p-2.5 bg-gradient-to-r from-[#FAF7F0] to-[#F5EEDC] text-[11px] font-extrabold text-[var(--gold-deep)] flex items-center justify-between border-b border-[var(--line)]/50">
            <div className="flex items-center gap-1.5">
              <span>⚡</span>
              <span>
                {language === 'ar'
                  ? 'اختر من عملائك المسجلين في "قوائمي" للتعبئة الفورية:'
                  : 'Select from saved customers in "My Lists" to auto-fill:'}
              </span>
            </div>
            <span className="text-[10px] bg-white/80 px-1.5 py-0.5 rounded-md border border-[var(--line)] text-[var(--ink-secondary)]">
              {filteredItems.length}
            </span>
          </div>

          {/* List items */}
          {filteredItems.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {filteredItems.map((item, idx) => {
                const itemName = getItemName(item);
                const sublabel = getItemSublabel ? getItemSublabel(item) : '';
                const badge = getItemBadge ? getItemBadge(item) : '';
                const isCurrent = selectedMasterId === (item as any).id;

                return (
                  <div
                    key={(item as any).id || idx}
                    onClick={() => {
                      onSelectItem(item);
                      setIsOpen(false);
                    }}
                    className={`p-2.5 hover:bg-[var(--gold-tint)]/60 cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                      isCurrent ? 'bg-[var(--gold-tint)]/80 font-bold' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[var(--ink)] truncate">
                          {itemName}
                        </span>
                        {badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold shrink-0">
                            {badge}
                          </span>
                        )}
                      </div>
                      {sublabel && (
                        <p className="text-[10px] text-[var(--ink-muted)] truncate mt-0.5">
                          {sublabel}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-1 text-[11px] text-[var(--gold-deep)] font-extrabold bg-white px-2 py-1 rounded-lg border border-[var(--gold-light)]/40 shadow-2xs">
                      <span>تعبئة</span>
                      <span>⚡</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-[var(--ink-muted)] bg-gray-50/50">
              <p className="font-medium">
                {language === 'ar'
                  ? 'لم يتم العثور على اسم مطابق في قوائمك.'
                  : 'No matching customer in your lists.'}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {language === 'ar'
                  ? 'يمكنك متابعة الكتابة وسيتم تسجيله كعميل جديد.'
                  : 'You can continue typing to record as a new customer.'}
              </p>
            </div>
          )}

          {/* Quick footer reminder */}
          <div className="p-2 bg-gray-50 text-[10px] text-[var(--ink-muted)] flex items-center justify-between">
            <span>
              {language === 'ar'
                ? '💡 يمكنك أيضاً كتابة اسم جديد غير مسجل'
                : '💡 You can also type a new unlisted name'}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[var(--gold-deep)] hover:underline font-bold"
            >
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
