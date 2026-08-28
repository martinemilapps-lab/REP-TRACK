'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Representative, WeeklyPlanRecord } from '@/types';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { EmptyState } from '@/components/ui/EmptyState';

interface WeeklyPlanViewProps {
  reps: Representative[];
  selectedRep: string;
  onSelectRep?: (name: string) => void;
  isManager?: boolean;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

interface DayPlan {
  dayKey: string;
  dayNameEn: string;
  dayNameAr: string;
  amKey: keyof WeeklyPlanFormState;
  pmKey: keyof WeeklyPlanFormState;
}

interface WeeklyPlanFormState {
  saturdayAm: string;
  saturdayPm: string;
  sundayAm: string;
  sundayPm: string;
  mondayAm: string;
  mondayPm: string;
  tuesdayAm: string;
  tuesdayPm: string;
  wednesdayAm: string;
  wednesdayPm: string;
  thursdayAm: string;
  thursdayPm: string;
  fridayAm: string;
  fridayPm: string;
}

const DAYS: DayPlan[] = [
  { dayKey: 'saturday', dayNameEn: 'SATURDAY', dayNameAr: 'السبت', amKey: 'saturdayAm', pmKey: 'saturdayPm' },
  { dayKey: 'sunday', dayNameEn: 'SUNDAY', dayNameAr: 'الأحد', amKey: 'sundayAm', pmKey: 'sundayPm' },
  { dayKey: 'monday', dayNameEn: 'MONDAY', dayNameAr: 'الاثنين', amKey: 'mondayAm', pmKey: 'mondayPm' },
  { dayKey: 'tuesday', dayNameEn: 'TUESDAY', dayNameAr: 'الثلاثاء', amKey: 'tuesdayAm', pmKey: 'tuesdayPm' },
  { dayKey: 'wednesday', dayNameEn: 'WEDNESDAY', dayNameAr: 'الأربعاء', amKey: 'wednesdayAm', pmKey: 'wednesdayPm' },
  { dayKey: 'thursday', dayNameEn: 'THURSDAY', dayNameAr: 'الخميس', amKey: 'thursdayAm', pmKey: 'thursdayPm' },
  { dayKey: 'friday', dayNameEn: 'FRIDAY', dayNameAr: 'الجمعة', amKey: 'fridayAm', pmKey: 'fridayPm' },
];

/**
 * Calculates current or specified Saturday start date and Friday end date (YYYY-MM-DD)
 */
function getWeekRange(baseDate = new Date()): { startDate: string; endDate: string; label: string } {
  const d = new Date(baseDate);
  const day = d.getDay(); // 0 is Sunday, 6 is Saturday
  // Distance back to last Saturday (if Saturday, diff is 0)
  const diffToSaturday = (day + 1) % 7;
  const sat = new Date(d);
  sat.setDate(d.getDate() - diffToSaturday);

  const fri = new Date(sat);
  fri.setDate(sat.getDate() + 6);

  const format = (date: Date) => date.toISOString().split('T')[0];
  const formatDisplay = (date: Date) => {
    const dayNum = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${dayNum}-${month}-${year}`;
  };

  return {
    startDate: format(sat),
    endDate: format(fri),
    label: `${formatDisplay(sat)} to ${formatDisplay(fri)}`,
  };
}

export function WeeklyPlanView({
  reps,
  selectedRep,
  onSelectRep,
  isManager = false,
  onSuccess,
  onError,
}: WeeklyPlanViewProps) {
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plansHistory, setPlansHistory] = useState<WeeklyPlanRecord[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  const initialRange = useMemo(() => getWeekRange(), []);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [weekLabel, setWeekLabel] = useState(initialRange.label);
  const [managerNotes, setManagerNotes] = useState('');
  const [planStatus, setPlanStatus] = useState('Submitted');

  const [formData, setFormData] = useState<WeeklyPlanFormState>({
    saturdayAm: 'Line 1 meeting then office working',
    saturdayPm: 'Office working',
    sundayAm: 'Line 2 meeting then Am double visit with...',
    sundayPm: 'Pm double visit with...',
    mondayAm: 'Line 3 meeting then Am single visits in...',
    mondayPm: 'Pm single visits in...',
    tuesdayAm: 'Line 1 meeting then Am double visit with...',
    tuesdayPm: 'Pm double visit with...',
    wednesdayAm: 'Line 2 meeting then office working',
    wednesdayPm: 'Office working',
    thursdayAm: 'Line 3 meeting then office working',
    thursdayPm: 'Office working',
    fridayAm: 'Field visits / Follow-up',
    fridayPm: 'Off / Weekly summary',
  });

  const repOptions: SelectOption[] = useMemo(() => {
    return reps.map((r) => ({
      value: r.name,
      label: r.name,
      sublabel: r.area,
    }));
  }, [reps]);

  // Load plans history for selected rep
  const loadPlans = useCallback(async () => {
    if (!selectedRep && !isManager) return;
    setLoading(true);
    try {
      const url = selectedRep
        ? `/api/weekly-plans?rep=${encodeURIComponent(selectedRep)}`
        : `/api/weekly-plans`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.plans) {
        setPlansHistory(data.plans);
        // If there's a plan for the current week, populate it
        const currentMatch = data.plans.find(
          (p: WeeklyPlanRecord) => p.startDate === startDate && (!selectedRep || p.rep === selectedRep)
        );
        if (currentMatch) {
          setActivePlanId(currentMatch.id);
          setPlanStatus(currentMatch.status || 'Submitted');
          setManagerNotes(currentMatch.managerNotes || '');
          setFormData({
            saturdayAm: currentMatch.saturdayAm || '',
            saturdayPm: currentMatch.saturdayPm || '',
            sundayAm: currentMatch.sundayAm || '',
            sundayPm: currentMatch.sundayPm || '',
            mondayAm: currentMatch.mondayAm || '',
            mondayPm: currentMatch.mondayPm || '',
            tuesdayAm: currentMatch.tuesdayAm || '',
            tuesdayPm: currentMatch.tuesdayPm || '',
            wednesdayAm: currentMatch.wednesdayAm || '',
            wednesdayPm: currentMatch.wednesdayPm || '',
            thursdayAm: currentMatch.thursdayAm || '',
            thursdayPm: currentMatch.thursdayPm || '',
            fridayAm: currentMatch.fridayAm || '',
            fridayPm: currentMatch.fridayPm || '',
          });
        }
      }
    } catch (err) {
      console.error('Failed to load weekly plans:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRep, isManager, startDate]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    try {
      const d = new Date(newStart);
      const range = getWeekRange(d);
      setEndDate(range.endDate);
      setWeekLabel(range.label);
    } catch {
      // ignore
    }
  };

  const handleDayChange = (key: keyof WeeklyPlanFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyPreset = (key: keyof WeeklyPlanFormState, text: string) => {
    setFormData((prev) => {
      const current = prev[key].trim();
      const next = current ? `${current} | ${text}` : text;
      return { ...prev, [key]: next };
    });
  };

  const handleSelectHistoryPlan = (plan: WeeklyPlanRecord) => {
    setActivePlanId(plan.id);
    setStartDate(plan.startDate);
    setEndDate(plan.endDate);
    setWeekLabel(plan.weekLabel || `${plan.startDate} to ${plan.endDate}`);
    setPlanStatus(plan.status || 'Submitted');
    setManagerNotes(plan.managerNotes || '');
    setFormData({
      saturdayAm: plan.saturdayAm || '',
      saturdayPm: plan.saturdayPm || '',
      sundayAm: plan.sundayAm || '',
      sundayPm: plan.sundayPm || '',
      mondayAm: plan.mondayAm || '',
      mondayPm: plan.mondayPm || '',
      tuesdayAm: plan.tuesdayAm || '',
      tuesdayPm: plan.tuesdayPm || '',
      wednesdayAm: plan.wednesdayAm || '',
      wednesdayPm: plan.wednesdayPm || '',
      thursdayAm: plan.thursdayAm || '',
      thursdayPm: plan.thursdayPm || '',
      fridayAm: plan.fridayAm || '',
      fridayPm: plan.fridayPm || '',
    });
  };

  const handleSavePlan = async () => {
    if (!selectedRep && !isManager) {
      onError?.(t('msg.requiredRep'));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/weekly-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rep: selectedRep,
          startDate,
          endDate,
          weekLabel,
          ...formData,
          status: 'Submitted',
          managerNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess?.(data.message || t('msg.planSaved'));
        if (data.plan) {
          setActivePlanId(data.plan.id);
        }
        loadPlans();
      } else {
        onError?.(data.message || t('msg.errorGeneric'));
      }
    } catch {
      onError?.(t('msg.errorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  const handleExportPlanExcel = async () => {
    if (activePlanId) {
      window.open(`/api/weekly-plans/${activePlanId}/export`, '_blank');
      onSuccess?.(t('msg.exportPlanSuccess'));
      return;
    }

    // If not saved yet, save first then export
    await handleSavePlan();
    onSuccess?.(t('msg.exportPlanSuccess'));
  };

  const handleCopyLastWeek = () => {
    if (plansHistory.length > 0) {
      const latest = plansHistory[0];
      setFormData({
        saturdayAm: latest.saturdayAm || '',
        saturdayPm: latest.saturdayPm || '',
        sundayAm: latest.sundayAm || '',
        sundayPm: latest.sundayPm || '',
        mondayAm: latest.mondayAm || '',
        mondayPm: latest.mondayPm || '',
        tuesdayAm: latest.tuesdayAm || '',
        tuesdayPm: latest.tuesdayPm || '',
        wednesdayAm: latest.wednesdayAm || '',
        wednesdayPm: latest.wednesdayPm || '',
        thursdayAm: latest.thursdayAm || '',
        thursdayPm: latest.thursdayPm || '',
        fridayAm: latest.fridayAm || '',
        fridayPm: latest.fridayPm || '',
      });
      onSuccess?.('تم استرجاع بيانات آخر خطة سابقة ✓');
    } else {
      onError?.('لا توجد خطط سابقة لنسخها');
    }
  };

  const handleApprovePlan = async () => {
    if (!activePlanId) return;
    try {
      const res = await fetch(`/api/weekly-plans/${activePlanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved', managerNotes }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPlanStatus('Approved');
        onSuccess?.('تم اعتماد الخطة الأسبوعية بنجاح ✓');
        loadPlans();
      } else {
        onError?.(data.message || t('msg.errorGeneric'));
      }
    } catch {
      onError?.(t('msg.errorGeneric'));
    }
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Identity Selector */}
      {onSelectRep && (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">👤</span>
            <h2 className="text-base font-extrabold text-[var(--ink)]">
              {t('rep.selector.title')}
            </h2>
          </div>
          <p className="text-xs text-[var(--ink-soft)] mb-3.5 leading-relaxed">
            {t('weekly.desc')}
          </p>
          <div className="max-w-xs md:max-w-sm">
            <CustomSelect
              options={repOptions}
              value={selectedRep}
              onChange={onSelectRep}
              placeholder={t('rep.selector.placeholder')}
              searchable={true}
            />
          </div>
        </div>
      )}

      {!selectedRep && !isManager ? (
        <EmptyState
          title={t('rep.myReports.emptyPrompt')}
          description={t('weekly.desc')}
          icon="📅"
        />
      ) : (
        <>
          {/* Main Weekly Plan Sheet Card (Restricted & Identical to Template) */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-lg)] shadow-hover overflow-hidden transition-all">
            {/* Top Sheet Header Banner (Matching XLS Gold/Beige Style) */}
            <div className="bg-gradient-to-r from-[#E5D7B7] via-[#DFCEAA] to-[#E5D7B7] border-b border-[#C8B68E] p-4 text-center">
              <h1 className="text-lg md:text-2xl font-black tracking-widest text-[#4A3B18] uppercase">
                WEEKLY PLAN
              </h1>
              <p className="text-xs text-[#6B5726] font-bold mt-0.5">
                {language === 'ar' ? 'خطة العمل الأسبوعية للمندوب الطبي' : 'Medical Representative Weekly Field Schedule'}
              </p>
            </div>

            {/* Subheader: Rep Name & Date Range Inputs */}
            <div className="bg-[#FAF7F0] border-b border-[#E8E2D2] px-5 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-sm font-black text-[#5C4A1E] uppercase tracking-wide whitespace-nowrap">
                  NAME :-
                </span>
                <span className="font-extrabold text-sm md:text-base text-[var(--ink)] px-3 py-1 bg-white border border-[#DDD5C0] rounded-lg shadow-xs">
                  {selectedRep || (language === 'ar' ? 'المندوب الطبي' : 'Medical Rep')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-[#1D5E99] uppercase tracking-wide whitespace-nowrap font-mono">
                    DATE:-
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-[#DDD5C0] rounded-lg text-[#1D5E99]"
                  />
                  <span className="text-xs font-bold text-[#6B5726]">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-[#DDD5C0] rounded-lg text-[#1D5E99]"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      planStatus === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {planStatus === 'Approved' ? `✓ ${t('status.approved')}` : t('status.submitted')}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Fill Presets Bar */}
            <div className="bg-white px-5 py-3 border-b border-[var(--line)] flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-[var(--ink-secondary)] shrink-0 flex items-center gap-1">
                <span>⚡</span>
                <span>{t('weekly.quickFill')}</span>
              </span>
              <button
                type="button"
                onClick={() => handleApplyPreset('saturdayAm', 'Line 1 meeting then office working')}
                className="text-[11px] font-bold px-2.5 py-1 bg-[var(--surface-subtle)] hover:bg-[var(--gold-tint)] border border-[var(--line)] hover:border-[var(--gold)] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Line 1 meeting
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('sundayAm', 'Line 2 meeting then Am double visit with...')}
                className="text-[11px] font-bold px-2.5 py-1 bg-[var(--surface-subtle)] hover:bg-[var(--gold-tint)] border border-[var(--line)] hover:border-[var(--gold)] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Line 2 meeting
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('mondayAm', 'Line 3 meeting then office working')}
                className="text-[11px] font-bold px-2.5 py-1 bg-[var(--surface-subtle)] hover:bg-[var(--gold-tint)] border border-[var(--line)] hover:border-[var(--gold)] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Line 3 meeting
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('saturdayPm', 'Office working')}
                className="text-[11px] font-bold px-2.5 py-1 bg-[var(--surface-subtle)] hover:bg-[var(--gold-tint)] border border-[var(--line)] hover:border-[var(--gold)] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Office working
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('mondayPm', 'Pm single visits in...')}
                className="text-[11px] font-bold px-2.5 py-1 bg-[var(--surface-subtle)] hover:bg-[var(--gold-tint)] border border-[var(--line)] hover:border-[var(--gold)] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Single visits
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('tuesdayAm', 'Am double visit with...')}
                className="text-[11px] font-bold px-2.5 py-1 bg-[var(--surface-subtle)] hover:bg-[var(--gold-tint)] border border-[var(--line)] hover:border-[var(--gold)] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Double visit
              </button>
            </div>

            {/* Template Table: DAY | AM | PM (Saturday to Friday) */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#EFE9DA] text-[#4A3B18] border-b-2 border-[#D8CEB9]">
                    <th className="py-3 px-4 text-center font-black text-xs md:text-sm uppercase tracking-wider w-[18%] border-r border-[#E0D7C4]">
                      {t('weekly.day')} (DAY)
                    </th>
                    <th className="py-3 px-4 text-start font-black text-xs md:text-sm uppercase tracking-wider w-[41%] border-r border-[#E0D7C4]">
                      {t('weekly.am')}
                    </th>
                    <th className="py-3 px-4 text-start font-black text-xs md:text-sm uppercase tracking-wider w-[41%]">
                      {t('weekly.pm')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] bg-white text-xs md:text-sm">
                  {DAYS.map((dayItem, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <tr
                        key={dayItem.dayKey}
                        className={`transition-colors hover:bg-[#FAF9F5] ${
                          isEven ? 'bg-white' : 'bg-[#FCFAF6]'
                        }`}
                      >
                        {/* Day Column */}
                        <td className="py-3.5 px-4 font-black text-[#5C4A1E] text-center uppercase tracking-wide border-r border-[var(--line)] bg-[#FAF7F0]">
                          <div className="flex flex-col items-center justify-center">
                            <span className="font-mono text-xs md:text-sm font-extrabold">
                              {dayItem.dayNameEn}
                            </span>
                            <span className="text-[11px] text-[var(--ink-muted)] font-normal">
                              {dayItem.dayNameAr}
                            </span>
                          </div>
                        </td>

                        {/* AM Input Cell */}
                        <td className="py-2.5 px-3 border-r border-[var(--line)] align-top">
                          <textarea
                            rows={2}
                            value={formData[dayItem.amKey]}
                            onChange={(e) => handleDayChange(dayItem.amKey, e.target.value)}
                            placeholder={`e.g. Line 1 meeting then Am single visits in...`}
                            className="w-full text-xs md:text-sm p-2 bg-transparent border border-transparent hover:border-[var(--line)] focus:border-[var(--gold)] focus:bg-white rounded-lg resize-none transition-all outline-none leading-relaxed"
                          />
                        </td>

                        {/* PM Input Cell */}
                        <td className="py-2.5 px-3 align-top">
                          <textarea
                            rows={2}
                            value={formData[dayItem.pmKey]}
                            onChange={(e) => handleDayChange(dayItem.pmKey, e.target.value)}
                            placeholder={`e.g. Pm double visit with... or Office working`}
                            className="w-full text-xs md:text-sm p-2 bg-transparent border border-transparent hover:border-[var(--line)] focus:border-[var(--gold)] focus:bg-white rounded-lg resize-none transition-all outline-none leading-relaxed"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Manager Notes / Directives Box (If Any) */}
            {(isManager || managerNotes) && (
              <div className="bg-[#FFFDF7] border-t border-[var(--gold-border)] p-4">
                <label className="block text-xs font-bold text-[var(--gold-deep)] mb-1.5 flex items-center gap-1.5">
                  <span>📝</span>
                  <span>{t('weekly.managerNotes')}</span>
                </label>
                {isManager ? (
                  <textarea
                    rows={2}
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    placeholder="ملاحظات وتوجيهات الإدارة على هذه الخطة الأسبوعية..."
                    className="w-full text-xs md:text-sm p-2.5 bg-white border border-[var(--gold-border)] rounded-xl"
                  />
                ) : (
                  <div className="p-3 bg-white border border-[var(--gold-border)] rounded-xl text-xs md:text-sm text-[var(--ink-secondary)] leading-relaxed">
                    {managerNotes}
                  </div>
                )}
              </div>
            )}

            {/* Actions Footer Bar */}
            <div className="bg-[#FAF7F0] border-t border-[#E8E2D2] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyLastWeek}
                  className="text-xs font-bold"
                >
                  <span>📋</span>
                  <span>{t('weekly.copyLastWeek')}</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportPlanExcel}
                  className="text-xs font-bold bg-[#E8F3FF] hover:bg-[#D5E9FF] text-[#1D5E99] border-[#B9DAFF]"
                >
                  <span>📊</span>
                  <span>{t('weekly.exportExcel')}</span>
                </Button>
              </div>

              <div className="flex items-center gap-2.5">
                {isManager && planStatus !== 'Approved' && activePlanId && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleApprovePlan}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs md:text-sm"
                  >
                    <span>✓</span>
                    <span>{t('manager.approvePlan')}</span>
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSavePlan}
                  isLoading={saving}
                  className="font-extrabold text-xs md:text-sm px-6"
                >
                  <span>💾</span>
                  <span>{t('weekly.savePlan')}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Past Plans History for this Representative */}
          {plansHistory.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 shadow-card animate-fade-in">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📜</span>
                  <h3 className="text-sm font-extrabold text-[var(--ink)]">
                    {t('weekly.history')} ({plansHistory.length})
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {plansHistory.map((plan) => {
                  const isActive = plan.id === activePlanId;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => handleSelectHistoryPlan(plan)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                        isActive
                          ? 'border-[var(--gold)] bg-[var(--gold-tint)] shadow-xs'
                          : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--gold-light)] hover:bg-[#FAF9F5]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-[var(--ink)]">
                          📅 {plan.weekLabel || `${plan.startDate} to ${plan.endDate}`}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            plan.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {plan.status === 'Approved' ? 'معتمدة ✓' : 'مرسلة'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--ink-muted)] flex items-center justify-between mt-1">
                        <span>{plan.rep}</span>
                        <span className="text-[10px]">
                          {plan.submittedAt ? new Date(plan.submittedAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
