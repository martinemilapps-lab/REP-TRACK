'use client';
import { X } from 'lucide-react';
import { useRef, useId, type ReactNode } from 'react';
import { useTranslation } from '@/lib/i18nContext';
import { useModalFocus } from './useModalFocus';
export function Drawer({ open, title, onClose, children }: {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
}) {
    const ref = useRef<HTMLElement>(null);
    const id = useId();
    const { language } = useTranslation();
    useModalFocus(open, ref, onClose);
    if (!open)
        return null;
    return <div className="fixed inset-0 z-50 bg-slate-950/35" onMouseDown={e => { if (e.target === e.currentTarget)
        onClose(); }}>
    <aside ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className="absolute inset-y-0 end-0 w-full max-w-xl overflow-y-auto overscroll-contain bg-[var(--surface)] p-4 shadow-2xl sm:p-6">
    <header className="mb-5 flex items-start justify-between gap-3">
    <h2 id={id} className="min-w-0 break-words text-lg font-semibold">{title}</h2>
    <button type="button" onClick={onClose} aria-label={language === 'ar' ? 'إغلاق' : 'Close'} className="min-h-11 min-w-11 shrink-0 rounded-lg p-3 hover:bg-[var(--surface-hover)]">
    <X className="size-5"/>
    </button>
    </header>{children}</aside>
    </div>;
}
