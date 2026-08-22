'use client';

import React from 'react';

export interface ToastMessage {
  text: string;
  isError?: boolean;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose?: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  if (!toast) return null;

  const isError = toast.isError;

  return (
    <div className="fixed bottom-5 inset-x-0 flex justify-center z-50 pointer-events-none px-4">
      <div
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-fade-in max-w-md ${
          isError
            ? 'bg-[var(--overdue-bg)] border-[var(--overdue-border)] text-[var(--overdue-color)]'
            : 'bg-white border-[var(--visited-border)] text-[var(--ink)] shadow-gold'
        }`}
      >
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            isError ? 'bg-[var(--overdue-color)] text-white' : 'bg-[var(--visited-color)] text-white'
          }`}
        >
          {isError ? '✕' : '✓'}
        </span>
        <p className="text-xs md:text-sm font-bold">{toast.text}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="ms-auto text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer text-sm"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
