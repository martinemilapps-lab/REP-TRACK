'use client';

import React, { useEffect } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] text-[var(--ink)]">
      <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-black text-[var(--ink)]">
            حدث خطأ أثناء تحميل الصفحة
          </h2>
          <p className="text-sm text-[var(--ink-soft)] mt-2">
            An unexpected error occurred while loading this page.
          </p>
          {error?.message && (
            <p className="text-xs font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 rounded-lg p-2 mt-3 select-all">
              {error.message}
            </p>
          )}
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white text-sm font-bold shadow-xs hover:brightness-105 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة المحاولة / Retry</span>
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-hover)] text-[var(--ink)] text-sm font-bold hover:bg-[var(--line)] transition-all cursor-pointer"
          >
            <span>تحديث / Reload</span>
          </button>
        </div>
      </div>
    </div>
  );
}
