'use client';

import React from 'react';

export interface ToastMessage {
  text: string;
  isError?: boolean;
}

interface ToastProps {
  toast: ToastMessage | null;
}

export function Toast({ toast }: ToastProps) {
  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-300 z-50 flex items-center gap-2 ${
        toast.isError ? 'bg-[var(--coral)]' : 'bg-[var(--ink)]'
      }`}
    >
      <span>{toast.text}</span>
    </div>
  );
}
