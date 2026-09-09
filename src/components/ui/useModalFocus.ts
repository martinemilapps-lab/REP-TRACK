'use client';
import { useEffect, useRef, type RefObject } from 'react';
const modalStack: HTMLElement[] = [];
let originalOverflow = '';
/** Keep focus in the active modal, restore its trigger, and prevent background scrolling. */
export function useModalFocus(open: boolean, ref: RefObject<HTMLElement | null>, onClose: () => void) {
    const close = useRef(onClose);
    useEffect(() => { close.current = onClose; }, [onClose]);
    useEffect(() => {
        if (!open)
            return;
        const trigger = document.activeElement as HTMLElement | null;
        const root = ref.current;
        if (!root)
            return;
        if (!modalStack.length)
            originalOverflow = document.body.style.overflow;
        modalStack.push(root);
        document.body.style.overflow = 'hidden';
        const focusable = () => Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(e => e.getClientRects().length > 0);
        (focusable()[0] || root).focus();
        const key = (e: KeyboardEvent) => { if (modalStack.at(-1) !== root)
            return; if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            close.current();
        } if (e.key === 'Tab') {
            const elements = focusable();
            const first = elements[0], last = elements.at(-1);
            if (!first) {
                e.preventDefault();
                root.focus();
            }
            else if (e.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
                e.preventDefault();
                last?.focus();
            }
            else if (!e.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) {
                e.preventDefault();
                first.focus();
            }
        } };
        const focus = (e: FocusEvent) => { if (modalStack.at(-1) === root && !root.contains(e.target as Node))
            (focusable()[0] || root).focus(); };
        document.addEventListener('keydown', key);
        document.addEventListener('focusin', focus);
        return () => { const index = modalStack.indexOf(root); if (index >= 0)
            modalStack.splice(index, 1); document.removeEventListener('keydown', key); document.removeEventListener('focusin', focus); if (!modalStack.length)
            document.body.style.overflow = originalOverflow; if (trigger?.isConnected)
            trigger.focus(); };
    }, [open, ref]);
}
