'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SUNNY_PRODUCTS_LIST } from '@/lib/constants';

interface MultiProductSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MultiProductSelect({
  value,
  onChange,
  placeholder = 'اختر أو ابحث عن المنتجات...',
  className = '',
}: MultiProductSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customProduct, setCustomProduct] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse comma-separated value into array of trimmed product names
  const selectedList = useMemo(() => {
    if (!value) return [];
    return value
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products by search term
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return SUNNY_PRODUCTS_LIST;
    return SUNNY_PRODUCTS_LIST.filter((p) => p.toLowerCase().includes(term));
  }, [search]);

  // Toggle single product selection
  const handleToggleProduct = (product: string) => {
    let nextList: string[];
    if (selectedList.includes(product)) {
      nextList = selectedList.filter((p) => p !== product);
    } else {
      nextList = [...selectedList, product];
    }
    onChange(nextList.join(', '));
  };

  // Remove single product chip
  const handleRemoveProduct = (product: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextList = selectedList.filter((p) => p !== product);
    onChange(nextList.join(', '));
  };

  // Add custom typed product
  const handleAddCustomProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customProduct.trim();
    if (!trimmed) return;
    if (!selectedList.includes(trimmed)) {
      const nextList = [...selectedList, trimmed];
      onChange(nextList.join(', '));
    }
    setCustomProduct('');
  };

  // Select all filtered products
  const handleSelectAllFiltered = () => {
    const set = new Set([...selectedList, ...filteredProducts]);
    onChange(Array.from(set).join(', '));
  };

  // Clear all selections
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Box */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full min-h-[42px] px-3 py-2 text-xs md:text-sm bg-white border border-[var(--line)] hover:border-[var(--gold)] rounded-xl font-medium cursor-pointer transition-all flex flex-wrap items-center gap-1.5 justify-between"
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {selectedList.length === 0 ? (
            <span className="text-[var(--ink-muted)] select-none text-xs">{placeholder}</span>
          ) : (
            selectedList.map((prod) => (
              <span
                key={prod}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-md text-[11px] font-bold shadow-2xs animate-in fade-in zoom-in-95 duration-100"
              >
                <span className="truncate max-w-[200px]" title={prod}>
                  {prod}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveProduct(prod, e)}
                  className="text-amber-700 hover:text-red-700 rounded-full w-3.5 h-3.5 flex items-center justify-center hover:bg-amber-200 transition-colors"
                >
                  ✕
                </button>
              </span>
            ))
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
          {selectedList.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              title="مسح الكل"
              className="text-[10px] text-gray-400 hover:text-red-600 px-1 hover:bg-gray-100 rounded"
            >
              ✕
            </button>
          )}
          <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
            {selectedList.length}
          </span>
          <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1.5 inset-x-0 bg-white border border-[var(--line)] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-80">
          {/* Search & Action Header */}
          <div className="p-2.5 bg-[#FAF7F0] border-b border-[#E8E2D2] space-y-2 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم (مثال: Nitrong, Sugammadex, Propofol...)..."
                autoFocus
                className="w-full text-xs px-3 py-1.5 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-lg outline-none font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[var(--ink-secondary)]">
                المعروض: {filteredProducts.length} منتج
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-[10px] font-bold text-[var(--gold-deep)] hover:underline cursor-pointer"
                >
                  تحديد المعروض
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>
          </div>

          {/* Product Items List */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-100 p-1">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-[var(--ink-muted)]">
                لا توجد منتجات تطابق البحث &ldquo;{search}&rdquo;
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isSelected = selectedList.includes(product);
                return (
                  <label
                    key={product}
                    className={`px-3 py-2 flex items-center gap-2.5 hover:bg-[#FAF9F5] transition-colors cursor-pointer text-xs ${
                      isSelected ? 'bg-amber-50/70 font-bold text-amber-950' : 'text-gray-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleProduct(product)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-[var(--gold)] focus:ring-[var(--gold)] cursor-pointer"
                    />
                    <span className="flex-1 leading-snug">{product}</span>
                    {isSelected && <span className="text-[10px] text-amber-600 font-extrabold">✓</span>}
                  </label>
                );
              })
            )}
          </div>

          {/* Custom Product Entry Form */}
          <form
            onSubmit={handleAddCustomProduct}
            className="p-2 bg-gray-50 border-t border-gray-200 flex items-center gap-1.5 shrink-0"
          >
            <input
              type="text"
              value={customProduct}
              onChange={(e) => setCustomProduct(e.target.value)}
              placeholder="إضافة منتج آخر يدوي..."
              className="flex-1 text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-lg outline-none"
            />
            <button
              type="submit"
              disabled={!customProduct.trim()}
              className="px-2.5 py-1 bg-gray-800 hover:bg-black text-white text-[11px] font-bold rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
            >
              + إضافة
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
