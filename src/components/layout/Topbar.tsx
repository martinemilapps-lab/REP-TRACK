'use client';

import React from 'react';

export type ViewType = 'submit' | 'myreports' | 'dashboard';

interface TopbarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  isManagerUnlocked?: boolean;
}

export function Topbar({ activeView, onViewChange, isManagerUnlocked }: TopbarProps) {
  return (
    <header className="flex items-center justify-between gap-4 flex-wrap pb-4 mb-6 border-b border-[var(--line)]">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--teal)] to-[var(--teal-deep)] flex items-center justify-center text-white font-mono font-bold text-sm shrink-0 shadow-xs">
          MR
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-[var(--ink)] tracking-tight">
            منصة تجميع تقارير المندوبين
          </h1>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5">
            كل مندوب يبعت تقريره من هنا، وكله يتجمع أوتوماتيك في مكان واحد
          </p>
        </div>
      </div>

      <nav className="flex gap-1.5 bg-[var(--surface)] p-1.5 rounded-xl border border-[var(--line)] shadow-xs">
        <button
          onClick={() => onViewChange('submit')}
          className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer ${
            activeView === 'submit'
              ? 'bg-[var(--teal)] text-white shadow-xs'
              : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          إرسال تقرير
        </button>
        <button
          onClick={() => onViewChange('myreports')}
          className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer ${
            activeView === 'myreports'
              ? 'bg-[var(--teal)] text-white shadow-xs'
              : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          تقاريري
        </button>
        <button
          onClick={() => onViewChange('dashboard')}
          className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-1 ${
            activeView === 'dashboard'
              ? 'bg-[var(--teal)] text-white shadow-xs'
              : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          <span>{isManagerUnlocked ? '📊' : '🔒'}</span>
          <span>لوحة المدير</span>
        </button>
      </nav>
    </header>
  );
}
