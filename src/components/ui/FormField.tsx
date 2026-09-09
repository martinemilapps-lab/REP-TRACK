'use client';
import { useId, useState, type InputHTMLAttributes } from 'react';
import { useTranslation } from '@/lib/i18nContext';
export function FormField({ label, value, onChange, multiline = false, required = false, type = 'text' }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    multiline?: boolean;
    required?: boolean;
    type?: InputHTMLAttributes<HTMLInputElement>['type'];
}) {
    const id = useId();
    const [invalid, setInvalid] = useState(false);
    const { language } = useTranslation();
    const error = language === 'ar' ? 'يرجى إدخال قيمة صالحة لهذا الحقل.' : 'Please enter a valid value for this field.';
    const props = {
        id, value, required, 'aria-invalid': invalid || undefined, 'aria-describedby': invalid ? `${id}-error` : undefined, onInvalid: () => setInvalid(true), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setInvalid(false); onChange(e.target.value); }, onBlur: () => { if (required)
            setInvalid(!value.trim()); }, className: 'mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--focus)]'
    };
    return <div className="min-w-0">
    <label htmlFor={id} className="text-sm font-semibold">{label}{required ? ' *' : ''}</label>{multiline ? <textarea {...props} rows={3}/> : <input {...props} type={type}/>} {invalid && <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-700">{error}</p>}</div>;
}
