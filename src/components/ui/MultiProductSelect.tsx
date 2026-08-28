'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customProduct, setCustomProduct] = useState('');
  const [placement, setPlacement] = useState<'down' | 'up'>('down');
  const [maxDropdownHeight, setMaxDropdownHeight] = useState<number>(300);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Parse comma-separated value into array of trimmed product names
  const selectedList = useMemo(() => {
    if (!value) return [];
    return value
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
  }, [value]);

  // Calculate position (up vs down) & max available height to prevent clipping off-screen
  const updateDropdownPlacement = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    const spaceBelow = windowHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;

    if (spaceBelow < 280 && spaceAbove > spaceBelow) {
      setPlacement('up');
      setMaxDropdownHeight(Math.max(200, Math.min(360, spaceAbove)));
    } else {
      setPlacement('down');
      setMaxDropdownHeight(Math.max(200, Math.min(360, spaceBelow)));
    }
  }, []);

  // Update placement whenever opening or on window resize/scroll
  useEffect(() => {
    if (isOpen) {
      updateDropdownPlacement();
      window.addEventListener('resize', updateDropdownPlacement);
      window.addEventListener('scroll', updateDropdownPlacement, true);
      return () => {
        window.removeEventListener('resize', updateDropdownPlacement);
        window.removeEventListener('scroll', updateDropdownPlacement, true);
      };
    }
  }, [isOpen, updateDropdownPlacement]);

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
  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Box */}
      <div
        onClick={() => {
          setIsOpen((prev) => {
            const next = !prev;
            if (next) {
              setTimeout(() => {
                updateDropdownPlacement();
                searchInputRef.current?.focus();
              }, 50);
            }
            return next;
          });
        }}
        className="w-full min-h-[44px] px-3.5 py-2 text-xs md:text-sm bg-white border border-[var(--line)] hover:border-[var(--gold)] focus-within:border-[var(--gold)] rounded-xl font-medium cursor-pointer transition-all flex flex-wrap items-center gap-1.5 justify-between shadow-2xs"
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {selectedList.length === 0 ? (
            <span className="text-[var(--ink-muted)] select-none text-xs">{placeholder}</span>
          ) : (
            selectedList.map((prod) => (
              <span
                key={prod}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold shadow-2xs animate-in fade-in zoom-in-95 duration-100"
              >
                <span className="truncate max-w-[220px]" title={prod}>
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

        <div className="flex items-center gap-2 shrink-0 text-gray-400">
          {selectedList.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              title="مسح الكل"
              className="text-[10px] text-gray-400 hover:text-red-600 px-1 hover:bg-gray-100 rounded cursor-pointer"
            >
              ✕ مسح
            </button>
          )}

          {/* Expand Full Modal Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              setIsModalOpen(true);
            }}
            title="فتح نافذة لاختيار المنتجات"
            className="text-[11px] text-[var(--gold-dark)] font-bold bg-[var(--gold-tint)] hover:bg-[var(--gold-light)]/20 px-2 py-0.5 rounded-md border border-[var(--gold)]/30 cursor-pointer flex items-center gap-1"
          >
            <span>⛶</span>
            <span className="hidden sm:inline">نافذة كاملة</span>
          </button>

          <span className="text-[10px] font-mono font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
            {selectedList.length}
          </span>
          <span className="text-xs font-bold text-gray-600">{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Smart Positioning Dropdown Menu */}
      {isOpen && (
        <div
          style={{ maxHeight: `${maxDropdownHeight}px` }}
          className={`absolute z-[999] inset-x-0 bg-white border border-[#DCD3BE] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col ${
            placement === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {/* Search & Action Header */}
          <div className="p-2.5 bg-[#FAF7F0] border-b border-[#E8E2D2] space-y-2 shrink-0">
            <div className="relative flex items-center gap-1.5">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم (مثال: Nitrong, Sugammadex, Propofol...)..."
                className="w-full text-xs px-3 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none font-medium shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute end-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs px-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsModalOpen(true);
                }}
                title="تكبير في نافذة مخصصة"
                className="shrink-0 p-2 text-xs bg-white hover:bg-gray-100 border border-[var(--line)] rounded-xl text-[var(--gold-dark)] font-bold cursor-pointer"
              >
                ⛶
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] px-0.5">
              <span className="font-bold text-[var(--ink-secondary)]">
                المعروض: {filteredProducts.length} من {SUNNY_PRODUCTS_LIST.length}
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
          <div className="overflow-y-auto flex-1 divide-y divide-gray-100 p-1 overscroll-contain">
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
                    className={`px-3 py-2 flex items-center gap-2.5 hover:bg-[#FAF9F5] transition-colors cursor-pointer text-xs rounded-lg ${
                      isSelected ? 'bg-amber-50/80 font-bold text-amber-950' : 'text-gray-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleProduct(product)}
                      className="w-4 h-4 rounded border-gray-300 text-[var(--gold)] focus:ring-[var(--gold)] cursor-pointer"
                    />
                    <span className="flex-1 leading-snug">{product}</span>
                    {isSelected && (
                      <span className="text-[11px] text-amber-700 font-extrabold bg-amber-100 px-1.5 py-0.2 rounded">
                        ✓ محدد
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>

          {/* Custom Product & Done Footer */}
          <div className="p-2 bg-gray-50 border-t border-gray-200 shrink-0 space-y-1.5">
            <form onSubmit={handleAddCustomProduct} className="flex items-center gap-1.5">
              <input
                type="text"
                value={customProduct}
                onChange={(e) => setCustomProduct(e.target.value)}
                placeholder="إضافة منتج يدوي آخر..."
                className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg outline-none"
              />
              <button
                type="submit"
                disabled={!customProduct.trim()}
                className="px-2.5 py-1.5 bg-gray-800 hover:bg-black text-white text-[11px] font-bold rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
              >
                + إضافة
              </button>
            </form>

            <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
              <span className="text-[11px] font-bold text-[var(--ink-secondary)]">
                المحدد: <strong className="text-amber-800">{selectedList.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1 bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white text-xs font-extrabold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                ✓ تم (إغلاق)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Dedicated Modal Dialog (Zero Clipping Guarantee) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[var(--line)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#FAF7F0] to-[#F5EFE0] border-b border-[#E8E2D2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📦</span>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--ink)]">
                    قائمة منتجات مجموعة صني الطبية (78 منتج)
                  </h3>
                  <p className="text-xs text-[var(--ink-muted)]">
                    حدد المنتجات التي تم مناقشتها والترويج لها خلال الزيارة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center font-bold text-sm border border-gray-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Search & Batch Bar */}
            <div className="p-3 bg-white border-b border-gray-100 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث باسم المنتج أو المادة الفعالة..."
                  autoFocus
                  className="w-full text-sm px-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[var(--gold)] rounded-xl outline-none font-medium shadow-inner"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-bold text-gray-600">
                  المعروض: {filteredProducts.length} من {SUNNY_PRODUCTS_LIST.length}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="font-bold text-[var(--gold-deep)] hover:underline cursor-pointer"
                  >
                    تحديد جميع المعروض
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    إلغاء تحديد الكل
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Chips Preview */}
            {selectedList.length > 0 && (
              <div className="p-3 bg-[#FAF8F5] border-b border-gray-200/70 max-h-28 overflow-y-auto flex flex-wrap gap-1.5">
                <span className="text-[11px] font-bold text-amber-900 self-center me-1">
                  المحدد ({selectedList.length}):
                </span>
                {selectedList.map((prod) => (
                  <span
                    key={prod}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-amber-950 border border-amber-300 rounded-lg text-xs font-bold shadow-2xs"
                  >
                    <span>{prod}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveProduct(prod, e)}
                      className="text-amber-700 hover:text-red-700 rounded-full w-4 h-4 flex items-center justify-center hover:bg-amber-100 cursor-pointer"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Products Grid / Scrollable List */}
            <div className="flex-1 overflow-y-auto p-3 divide-y divide-gray-100 max-h-[50vh]">
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-sm text-[var(--ink-muted)]">
                  لا توجد منتجات تطابق البحث &ldquo;{search}&rdquo;
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {filteredProducts.map((product) => {
                    const isSelected = selectedList.includes(product);
                    return (
                      <label
                        key={product}
                        className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-xs ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 font-bold text-amber-950 shadow-2xs'
                            : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleProduct(product)}
                          className="w-4 h-4 rounded border-gray-300 text-[var(--gold)] focus:ring-[var(--gold)] cursor-pointer"
                        />
                        <span className="flex-1 leading-snug">{product}</span>
                        {isSelected && (
                          <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            ✓ محدد
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 flex-wrap">
              <form onSubmit={handleAddCustomProduct} className="flex items-center gap-2 flex-1 min-w-[240px]">
                <input
                  type="text"
                  value={customProduct}
                  onChange={(e) => setCustomProduct(e.target.value)}
                  placeholder="إضافة منتج يدوي آخر..."
                  className="flex-1 text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none"
                />
                <button
                  type="submit"
                  disabled={!customProduct.trim()}
                  className="px-3 py-2 bg-gray-800 hover:bg-black text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
                >
                  + إضافة
                </button>
              </form>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white text-sm font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
              >
                ✓ تأكيد الاختيار ({selectedList.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
