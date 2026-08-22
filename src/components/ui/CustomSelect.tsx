'use client';

import React, { useState, useRef, useEffect, useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface CustomSelectProps {
  options: (SelectOption | string)[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
  size?: 'sm' | 'md';
  id?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = '-- اختار --',
  className = '',
  disabled = false,
  searchable = false,
  size = 'md',
  id,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Normalize options into SelectOption objects
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (searchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, searchable]);

  // Handle keyboard ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(term) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(term))
    );
  });

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const isSmall = size === 'sm';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 text-start transition-all cursor-pointer select-none
          bg-white border rounded-xl font-bold text-[var(--ink)] shadow-2xs hover:border-[var(--gold)]
          ${
            isOpen
              ? 'border-[var(--gold)] ring-3 ring-[rgba(229,152,25,0.18)]'
              : 'border-[var(--line)]'
          }
          ${disabled ? 'opacity-60 cursor-not-allowed bg-[var(--surface-subtle)]' : ''}
          ${isSmall ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2.5 text-sm'}
        `}
      >
        <span className="truncate flex-1 text-start">
          {selectedOption ? (
            <span className="flex items-center gap-2">
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-xs font-normal text-[var(--gold-deep)] opacity-90 truncate">
                  — {selectedOption.sublabel}
                </span>
              )}
            </span>
          ) : (
            <span className="text-[var(--ink-muted)] font-normal">{placeholder}</span>
          )}
        </span>

        {/* Custom Chevron Arrow */}
        <span
          className={`shrink-0 transition-transform duration-200 text-[var(--ink-soft)] ${
            isOpen ? 'rotate-180 text-[var(--gold-dark)]' : ''
          }`}
        >
          <svg
            className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1.5 w-full min-w-[220px] bg-white border border-[var(--gold-border)] rounded-2xl shadow-xl overflow-hidden animate-fade-in text-start"
          style={{
            boxShadow:
              '0 12px 28px -4px rgba(229, 152, 25, 0.18), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Optional Search in dropdown */}
          {searchable && normalizedOptions.length > 5 && (
            <div className="p-2 border-b border-[var(--line)] bg-[var(--surface-subtle)]">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث في القائمة..."
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[var(--line)] rounded-lg font-medium outline-none focus:border-[var(--gold)] text-start"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-select-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-center text-[var(--ink-muted)] font-medium">
                لا توجد نتائج مطابقة
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm cursor-pointer transition-all select-none text-start
                      ${
                        isSelected
                          ? 'bg-[var(--gold-soft)] text-[var(--gold-deep)] font-extrabold shadow-2xs'
                          : 'text-[var(--ink)] font-medium hover:bg-[var(--gold-tint)] hover:text-[var(--gold-dark)]'
                      }
                    `}
                  >
                    <div className="flex flex-col min-w-0 flex-1 text-start">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span
                          className={`text-[11px] truncate ${
                            isSelected
                              ? 'text-[var(--gold-deep)] opacity-90'
                              : 'text-[var(--ink-soft)]'
                          }`}
                        >
                          {opt.sublabel}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <span className="shrink-0 text-[var(--gold-dark)] font-black text-sm ms-2">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
