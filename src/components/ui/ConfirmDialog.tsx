'use client';
import { useId, useRef } from 'react';
import { Button } from './Button';
import { useModalFocus } from './useModalFocus';
import { useTranslation } from '@/lib/i18nContext';
export function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onClose, destructive = false }: {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onClose: () => void;
    destructive?: boolean;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const id = useId();
    const { language } = useTranslation();
    const ar = language === 'ar';
    useModalFocus(open, ref, onClose);
    if (!open)
        return null;
    return <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/40 p-4" onMouseDown={e => { if (e.target === e.currentTarget)
        onClose(); }}>
    <div ref={ref} tabIndex={-1} role="alertdialog" aria-modal="true" aria-labelledby={id} aria-describedby={`${id}-description`} className="section-card max-h-[90dvh] w-full max-w-md overflow-y-auto shadow-2xl">
    <h2 id={id} className="text-lg font-semibold">{title}</h2>
    <p id={`${id}-description`} className="my-3 text-sm text-[var(--ink-soft)]">{description}</p>
    <div className="flex flex-wrap justify-end gap-2">
    <Button type="button" variant="secondary" onClick={onClose}>{ar ? 'إلغاء' : 'Cancel'}</Button>
    <Button type="button" variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel || (ar ? 'تأكيد' : 'Confirm')}</Button>
    </div>
    </div>
    </div>;
}
