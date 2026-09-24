'use client';

import React, { useEffect, useState } from 'react';
import { Zap, Play, CheckCircle2, History, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/lib/i18nContext';
import { getCustomFunctionsForPosition, CustomFunction } from '@/components/admin/AdminFunctionBuilder';

const SUBMISSIONS_KEY = 'reptrack_custom_function_submissions';

export interface FunctionSubmission {
  id: string;
  functionId: string;
  functionName: string;
  positionCode: string;
  submittedBy: string;
  submittedAt: string;
  data: Record<string, any>;
}

function loadSubmissions(): FunctionSubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSubmissions(list: FunctionSubmission[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(list));
}

interface CustomFunctionsWidgetProps {
  positionCode?: string | null;
  currentUser?: { name: string; username: string };
  onShowToast?: (msg: string, isError?: boolean) => void;
}

export function CustomFunctionsWidget({
  positionCode = 'MR',
  currentUser,
  onShowToast,
}: CustomFunctionsWidgetProps) {
  const { language } = useTranslation();
  const ar = language === 'ar';
  const pos = positionCode || 'MR';

  const [functions, setFunctions] = useState<CustomFunction[]>([]);
  const [activeFn, setActiveFn] = useState<CustomFunction | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [submissions, setSubmissions] = useState<FunctionSubmission[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = () => {
      setFunctions(getCustomFunctionsForPosition(pos));
      setSubmissions(loadSubmissions().filter((s) => s.positionCode === pos));
    };

    load();

    const handleUpdate = () => {
      load();
    };

    window.addEventListener('reptrack_admin_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('reptrack_admin_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [pos]);

  if (!functions || functions.length === 0) {
    return null;
  }

  const openRunner = (fn: CustomFunction) => {
    setActiveFn(fn);
    setFormValues({});
  };

  const handleFieldValueChange = (fieldId: string, val: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: val,
    }));
  };

  const executeFunction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFn) return;

    setBusy(true);

    const submission: FunctionSubmission = {
      id: crypto.randomUUID(),
      functionId: activeFn.id,
      functionName: ar ? activeFn.nameAr || activeFn.name : activeFn.name,
      positionCode: pos,
      submittedBy: currentUser?.name || 'User',
      submittedAt: new Date().toISOString(),
      data: formValues,
    };

    const all = loadSubmissions();
    all.unshift(submission);
    saveSubmissions(all);

    setSubmissions(all.filter((s) => s.positionCode === pos));
    setBusy(false);
    setActiveFn(null);

    const msg = ar
      ? `تم تشغيل الوظيفة "${activeFn.nameAr || activeFn.name}" بنجاح!`
      : `Function "${activeFn.name}" executed successfully!`;
    
    if (onShowToast) {
      onShowToast(msg);
    }
  };

  const clearHistory = () => {
    const remain = loadSubmissions().filter((s) => s.positionCode !== pos);
    saveSubmissions(remain);
    setSubmissions([]);
  };

  return (
    <div className="my-6 space-y-4" data-ui-id="admin-custom-functions-section">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--gold-tint)] text-[var(--gold-dark)] border border-[var(--gold-border)]">
            <Zap className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[var(--ink)]">
              {ar ? 'الوظائف والعمليات المخصصة للنظام' : 'System Custom Functions & Workflows'}
            </h3>
            <p className="text-xs text-[var(--ink-soft)]">
              {ar
                ? `الوظائف المخصصة المعتمدة من الإدارة لمنصب (${pos})`
                : `Admin-configured custom processes active for position (${pos})`}
            </p>
          </div>
        </div>

        {submissions.length > 0 && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5"
          >
            <History className="size-4" />
            <span>
              {ar ? 'سجل التشغيل' : 'Execution Log'} ({submissions.length})
            </span>
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {functions.map((fn) => (
          <SectionCard
            key={fn.id}
            title={ar ? fn.nameAr || fn.name : fn.name}
            description={ar ? fn.descriptionAr || fn.description : fn.description}
            actions={<StatusBadge tone="success">{fn.category.toUpperCase()}</StatusBadge>}
          >
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-[var(--ink-soft)]">
                {fn.fields.length} {ar ? 'حقول' : 'fields'}
              </span>
              <Button size="sm" onClick={() => openRunner(fn)} className="flex items-center gap-1">
                <Play className="size-3.5 fill-current" />
                <span>{ar ? 'تشغيل الوظيفة' : 'Run Function'}</span>
              </Button>
            </div>
          </SectionCard>
        ))}
      </div>

      {/* Function Runner Drawer */}
      <Drawer
        open={activeFn !== null}
        title={ar ? `تشغيل: ${activeFn?.nameAr || activeFn?.name}` : `Run: ${activeFn?.name}`}
        onClose={() => setActiveFn(null)}
      >
        {activeFn && (
          <form className="space-y-4" onSubmit={executeFunction}>
            <p className="text-sm text-[var(--ink-soft)]">
              {ar ? activeFn.descriptionAr || activeFn.description : activeFn.description}
            </p>

            <div className="space-y-3 pt-2">
              {activeFn.fields.map((field) => {
                const label = ar ? field.labelAr || field.label : field.label;
                const val = formValues[field.id] ?? '';

                return (
                  <div key={field.id} className="space-y-1">
                    <label className="block text-sm font-semibold">
                      {label} {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        className="input w-full"
                        rows={3}
                        placeholder={field.placeholder || ''}
                        value={val}
                        required={field.required}
                        onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        className="input w-full"
                        value={val}
                        required={field.required}
                        onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                      >
                        <option value="">{ar ? 'اختر...' : 'Select...'}</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'multiselect' ? (
                      <div className="space-y-1 p-2 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                        {field.options?.map((opt) => {
                          const arr: string[] = Array.isArray(val) ? val : [];
                          return (
                            <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={arr.includes(opt)}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...arr, opt]
                                    : arr.filter((x) => x !== opt);
                                  handleFieldValueChange(field.id, next);
                                }}
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : field.type === 'toggle' ? (
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(val)}
                          onChange={(e) => handleFieldValueChange(field.id, e.target.checked)}
                        />
                        <span>{label}</span>
                      </label>
                    ) : (
                      <input
                        type={
                          field.type === 'number'
                            ? 'number'
                            : field.type === 'date'
                            ? 'date'
                            : field.type === 'email'
                            ? 'email'
                            : field.type === 'phone'
                            ? 'tel'
                            : 'text'
                        }
                        className="input w-full"
                        placeholder={field.placeholder || ''}
                        value={val}
                        required={field.required}
                        onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <Button type="submit" isLoading={busy} className="w-full">
              <CheckCircle2 className="size-4" />
              <span>{ar ? 'تأفيذ وحفظ النتائج' : 'Execute & Submit'}</span>
            </Button>
          </form>
        )}
      </Drawer>

      {/* History Drawer */}
      <Drawer
        open={showHistory}
        title={ar ? 'سجل تنفيذ الوظائف المخصصة' : 'Custom Functions Execution History'}
        onClose={() => setShowHistory(false)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--ink-soft)] font-mono">
              {submissions.length} {ar ? 'سجلات' : 'entries'}
            </span>
            <Button size="sm" variant="danger" onClick={clearHistory}>
              <Trash2 className="size-3.5" />
              <span>{ar ? 'مسح السجل' : 'Clear History'}</span>
            </Button>
          </div>

          <div className="space-y-3">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--line)] space-y-2 text-sm"
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-[var(--ink)]">{sub.functionName}</span>
                  <span className="text-[10px] font-mono text-[var(--ink-soft)]">
                    {new Date(sub.submittedAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-soft)]">
                  {ar ? 'بواسطة:' : 'By:'} <strong>{sub.submittedBy}</strong>
                </p>
                <div className="pt-2 border-t border-[var(--line)] grid gap-1 text-xs font-mono">
                  {Object.entries(sub.data).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-[var(--ink-soft)]">{k}:</span>
                      <span className="font-semibold text-[var(--ink)]">
                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
