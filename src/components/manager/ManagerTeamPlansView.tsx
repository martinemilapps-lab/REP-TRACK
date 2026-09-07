'use client';
import { useEffect, useState } from 'react';
import type { WeeklyPlanRecord } from '@/types';

export function ManagerTeamPlansView({ onError }: { onError: (message: string) => void }) {
  const [plans, setPlans] = useState<WeeklyPlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/weekly-plans?team=true&scopeMode=ALL_DESCENDANTS').then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Unable to load team plans');
      setPlans(body.plans || []);
    }).catch((error) => onError(error instanceof Error ? error.message : 'Unable to load team plans')).finally(() => setLoading(false));
  }, [onError]);
  if (loading) return <div className="p-6 text-sm text-[var(--ink-soft)]">Loading team plans…</div>;
  return <div className="space-y-3">{plans.length === 0 && <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 text-sm text-[var(--ink-soft)]">No submitted plans in your authorized hierarchy.</div>}{plans.map((plan) => <article key={plan.id} className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 shadow-xs"><div className="flex items-center justify-between gap-3"><strong>{plan.rep}</strong><span className="text-xs text-[var(--ink-soft)]">{plan.isManagerPlan ? 'Manager plan' : 'MR plan'}</span></div><div className="mt-2 text-sm text-[var(--ink-soft)]">{plan.weekLabel || `${plan.startDate} – ${plan.endDate}`}</div><div className="mt-2 text-xs font-bold text-[var(--gold-dark)]">{plan.status}</div></article>)}</div>;
}
