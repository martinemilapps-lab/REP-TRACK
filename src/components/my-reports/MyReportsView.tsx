'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Representative,
  ActivityType,
  HospitalVisitRecord,
  PharmacyVisitRecord,
  DoctorVisitRecord,
  BranchVisitRecord,
  ProductAvailabilityRecord,
  EventRecord,
  TrainingRecord,
  SpecialTaskRecord,
} from '@/types';
import { StatPill } from '@/components/ui/StatPill';
import { CoverageRing } from '@/components/ui/CoverageRing';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { EntityTabs } from '@/components/ui/EntityTabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { useTranslation } from '@/lib/i18nContext';
import { calculateRepCoverage, calculateRepOverviewStats, statusBucket } from '@/lib/coverage';

interface MyReportsViewProps {
  reps: Representative[];
  selectedRep: string;
  onSelectRep: (name: string) => void;
}

export function MyReportsView({ reps, selectedRep, onSelectRep }: MyReportsViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ActivityType>('hospital');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<{
    hospitals: HospitalVisitRecord[];
    pharmacies: PharmacyVisitRecord[];
    doctors: DoctorVisitRecord[];
    branches: BranchVisitRecord[];
    availabilities: ProductAvailabilityRecord[];
    events?: EventRecord[];
    trainings?: TrainingRecord[];
    specialTasks?: SpecialTaskRecord[];
    masterLists?: {
      hospitals: any[];
      pharmacies: any[];
      doctors: any[];
      branches: any[];
    };
  }>({
    hospitals: [],
    pharmacies: [],
    doctors: [],
    branches: [],
    availabilities: [],
    events: [],
    trainings: [],
    specialTasks: [],
  });

  const loadRepData = useCallback(async (repName: string) => {
    if (!repName) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?rep=${encodeURIComponent(repName)}`);
      const resData = await res.json();
      setData(resData);
    } catch (e) {
      console.error('Failed to load rep reports:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRep) {
      loadRepData(selectedRep);
    }
  }, [selectedRep, loadRepData]);

  const repObj = useMemo(() => reps.find((r) => r.name === selectedRep), [reps, selectedRep]);

  const coverage = useMemo(() => {
    if (!repObj) return null;
    const effectiveRep: Representative = {
      ...repObj,
      assignedHospitals:
        data.masterLists?.hospitals && data.masterLists.hospitals.length > 0
          ? data.masterLists.hospitals.length
          : repObj.assignedHospitals,
      assignedPharmacies:
        data.masterLists?.pharmacies && data.masterLists.pharmacies.length > 0
          ? data.masterLists.pharmacies.length
          : repObj.assignedPharmacies,
      assignedDrs:
        data.masterLists?.doctors && data.masterLists.doctors.length > 0
          ? data.masterLists.doctors.length
          : repObj.assignedDrs,
    };

    return calculateRepCoverage(
      effectiveRep,
      data.hospitals.length,
      data.pharmacies.length,
      data.doctors.length
    );
  }, [repObj, data.masterLists, data.hospitals.length, data.pharmacies.length, data.doctors.length]);

  const stats = useMemo(() => {
    const allVisits = [...data.hospitals, ...data.pharmacies, ...data.doctors, ...data.branches];
    return calculateRepOverviewStats(allVisits, data.availabilities.length);
  }, [data]);

  // Automated Call Rate & Standard Deviation (SD) Calculation vs My Lists Target
  const callRateAnalytics = useMemo(() => {
    const mH = (data.masterLists?.hospitals || []) as any[];
    const mP = (data.masterLists?.pharmacies || []) as any[];
    const mD = (data.masterLists?.doctors || []) as any[];

    // Target from My Lists (month based on 30 days, day based on 26 working days)
    const targetHMonth = mH.reduce((acc, it) => acc + 30 / (Number(it.defaultCycle) > 0 ? Number(it.defaultCycle) : 7), 0);
    const targetPMonth = mP.reduce((acc, it) => acc + 30 / (Number(it.defaultCycle) > 0 ? Number(it.defaultCycle) : 7), 0);
    const targetDMonth = mD.reduce((acc, it) => acc + 30 / (Number(it.defaultCycle) > 0 ? Number(it.defaultCycle) : 7), 0);
    const totalTargetMonth = targetHMonth + targetPMonth + targetDMonth;
    const totalTargetDay = totalTargetMonth / 26;

    // Actual visits count
    const actualHMonth = data.hospitals.length;
    const actualPMonth = data.pharmacies.length;
    const actualDMonth = data.doctors.length;
    const totalActual = actualHMonth + actualPMonth + actualDMonth;
    const actualPerDay = totalActual / 26;

    // Calculate Standard Deviation across recorded dates
    const visitsByDate: Record<string, number> = {};
    const addDate = (dStr?: string) => {
      if (!dStr) return;
      const key = dStr.slice(0, 10);
      visitsByDate[key] = (visitsByDate[key] || 0) + 1;
    };
    data.hospitals.forEach((h) => addDate(h.lastVisit || h.createdAt));
    data.pharmacies.forEach((p) => addDate(p.lastVisit || p.createdAt));
    data.doctors.forEach((d) => addDate(d.visitDate || d.createdAt));

    const dailyCounts = Object.values(visitsByDate);
    const variance =
      dailyCounts.length > 1
        ? dailyCounts.reduce((acc, cnt) => acc + Math.pow(cnt - totalActual / dailyCounts.length, 2), 0) /
          dailyCounts.length
        : 0;
    const sd = Math.sqrt(variance);

    return {
      targetHMonth,
      targetHDay: targetHMonth / 26,
      actualHMonth,
      actualHDay: actualHMonth / 26,

      targetPMonth,
      targetPDay: targetPMonth / 26,
      actualPMonth,
      actualPDay: actualPMonth / 26,

      targetDMonth,
      targetDDay: targetDMonth / 26,
      actualDMonth,
      actualDDay: actualDMonth / 26,

      totalTargetMonth,
      totalTargetDay,
      totalActual,
      actualPerDay,
      sd,
      achievementPct: totalTargetMonth > 0 ? Math.round((totalActual / totalTargetMonth) * 100) : 0,
    };
  }, [data]);

  const repOptions: SelectOption[] = useMemo(() => {
    return reps.map((r) => ({
      value: r.name,
      label: r.name,
      sublabel: r.area,
    }));
  }, [reps]);

  const statusFilterOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: t('status.all') },
      { value: 'visited', label: t('status.visited') },
      { value: 'notvisited', label: t('status.notVisited') },
      { value: 'overdue', label: t('status.overdue') },
    ];
  }, [t]);

  const filteredHospitals = useMemo(() => {
    if (!statusFilter) return data.hospitals;
    return data.hospitals.filter((r) => statusBucket(r.status) === statusFilter);
  }, [data.hospitals, statusFilter]);

  const filteredPharmacies = useMemo(() => {
    if (!statusFilter) return data.pharmacies;
    return data.pharmacies.filter((r) => statusBucket(r.status) === statusFilter);
  }, [data.pharmacies, statusFilter]);

  const filteredDoctors = useMemo(() => {
    if (!statusFilter) return data.doctors;
    return data.doctors.filter((r) => statusBucket(r.status) === statusFilter);
  }, [data.doctors, statusFilter]);

  return (
    <div className="animate-fade-in">
      {/* Identity Selector Card */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 mb-4 shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">👤</span>
          <h2 className="text-base font-extrabold text-[var(--ink)]">
            {t('rep.myReports.title')}
          </h2>
        </div>
        <p className="text-xs text-[var(--ink-soft)] mb-3.5 leading-relaxed">
          {t('rep.myReports.desc')}
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

      {!selectedRep ? (
        <EmptyState
          title={t('rep.myReports.emptyPrompt')}
          description={t('rep.selector.desc')}
          icon="👥"
        />
      ) : loading ? (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-12 text-center text-xs text-[var(--ink-soft)] shadow-card">
          <div className="inline-block w-7 h-7 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin mb-3" />
          <div className="font-bold">{t('app.loading')}</div>
        </div>
      ) : (
        <div>
          {/* Top KPI Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatPill label={t('kpi.totalVisits')} value={stats.totalVisits} icon="📊" highlight />
            <StatPill label={t('status.visited')} value={stats.visitedCount} icon="✓" />
            <StatPill label={t('status.notVisited')} value={stats.notVisitedCount} icon="⏳" />
            <StatPill label={t('status.overdue')} value={stats.overdueCount} icon="⚠️" />
          </div>

          {/* Automated Call Rate & Standard Deviation (SD) Analytics Strip */}
          <div className="bg-gradient-to-r from-[#FAF8F5] to-[#F5EFE6] border border-[#E8DFC8] rounded-[var(--radius)] p-4 mb-4 shadow-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#E8DFC8]/70">
              <div className="flex items-center gap-2">
                <span className="text-xl">📈</span>
                <div>
                  <h3 className="text-sm font-black text-amber-950">
                    {t('reports.callRateAnalytics')}
                  </h3>
                  <p className="text-[11px] text-amber-800/80 font-medium">
                    معدل الزيارات الفعلي مقارنة بالمستهدف من القوائم (My Lists) والانحراف المعياري (SD)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
                <span className="px-2.5 py-1 bg-amber-100/90 text-amber-950 rounded-lg border border-amber-300/80">
                  {t('reports.standardDeviation')}: ±{callRateAnalytics.sd.toFixed(2)} SD
                </span>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-950 rounded-lg border border-emerald-300">
                  {t('reports.achievement')}: {callRateAnalytics.achievementPct}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Overall Total */}
              <div className="p-3 bg-white/80 rounded-xl border border-[#E2D8C0] shadow-2xs">
                <div className="text-[11px] font-bold text-gray-600 mb-1">
                  🌐 إجمالي معدل الزيارات (Overall)
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-lg font-black text-[var(--ink)]">
                    {callRateAnalytics.actualPerDay.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">
                    / {callRateAnalytics.totalTargetDay.toFixed(1)} يومياً
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                  شهرياً: <strong>{callRateAnalytics.totalActual}</strong> / {Math.round(callRateAnalytics.totalTargetMonth)}
                </div>
              </div>

              {/* Hospitals */}
              <div className="p-3 bg-white/80 rounded-xl border border-[#E2D8C0] shadow-2xs">
                <div className="text-[11px] font-bold text-amber-900 mb-1">
                  🏥 {t('lists.hospitals')}
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-lg font-black text-amber-950">
                    {callRateAnalytics.actualHDay.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">
                    / {callRateAnalytics.targetHDay.toFixed(1)} يومياً
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                  شهرياً: <strong>{callRateAnalytics.actualHMonth}</strong> / {Math.round(callRateAnalytics.targetHMonth)}
                </div>
              </div>

              {/* Pharmacies */}
              <div className="p-3 bg-white/80 rounded-xl border border-[#E2D8C0] shadow-2xs">
                <div className="text-[11px] font-bold text-blue-900 mb-1">
                  💊 {t('lists.pharmacies')}
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-lg font-black text-blue-950">
                    {callRateAnalytics.actualPDay.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">
                    / {callRateAnalytics.targetPDay.toFixed(1)} يومياً
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                  شهرياً: <strong>{callRateAnalytics.actualPMonth}</strong> / {Math.round(callRateAnalytics.targetPMonth)}
                </div>
              </div>

              {/* Doctors */}
              <div className="p-3 bg-white/80 rounded-xl border border-[#E2D8C0] shadow-2xs">
                <div className="text-[11px] font-bold text-emerald-900 mb-1">
                  🩺 {t('lists.doctors')}
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-lg font-black text-emerald-950">
                    {callRateAnalytics.actualDDay.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">
                    / {callRateAnalytics.targetDDay.toFixed(1)} يومياً
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                  شهرياً: <strong>{callRateAnalytics.actualDMonth}</strong> / {Math.round(callRateAnalytics.targetDMonth)}
                </div>
              </div>
            </div>
          </div>

          {/* Coverage Summary Card */}
          {repObj && coverage && (
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 mb-4 shadow-card max-w-md">
              <div className="flex items-center gap-4 mb-3 pb-3 border-b border-[var(--line)]">
                <CoverageRing percentage={coverage.overallCoveragePct} size={62} strokeWidth={6} />
                <div>
                  <div className="font-extrabold text-sm md:text-base text-[var(--ink)]">{repObj.name}</div>
                  <div className="text-xs text-[var(--gold-dark)] font-bold">{repObj.area}</div>
                  <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                    {t('kpi.overallCoverage')}: <strong className="text-[var(--ink)] font-mono">{coverage.overallCoveragePct}%</strong>
                  </div>
                </div>
              </div>
              <ProgressBar
                label={t('activity.hospital')}
                actual={coverage.actualHospitals}
                assigned={coverage.assignedHospitals}
              />
              <ProgressBar
                label={t('activity.pharmacy')}
                actual={coverage.actualPharmacies}
                assigned={coverage.assignedPharmacies}
              />
              <ProgressBar
                label={t('activity.doctor')}
                actual={coverage.actualDrs}
                assigned={coverage.assignedDrs}
              />
            </div>
          )}

          {/* Detailed Records Data Table Card */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 shadow-card">
            <div className="flex justify-between items-center gap-3 mb-4 flex-wrap">
              <EntityTabs activeTab={activeTab} onChange={setActiveTab} />
              {activeTab !== 'availability' && activeTab !== 'branch' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-[var(--ink-soft)] whitespace-nowrap">
                    {t('status.filter')}
                  </label>
                  <div className="w-36">
                    <CustomSelect
                      options={statusFilterOptions}
                      value={statusFilter}
                      onChange={setStatusFilter}
                      size="sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rep-table-container">
              {activeTab === 'hospital' &&
                (filteredHospitals.length === 0 ? (
                  <EmptyState title={t('empty.noVisits')} icon="🏥" className="border-none shadow-none" />
                ) : (
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>{t('th.hospital')}</th>
                          <th>{t('th.objective')}</th>
                          <th>{t('th.visitType')}</th>
                          <th>{t('th.area')}</th>
                          <th>{t('th.type')}</th>
                          <th>{t('th.dept')}</th>
                          <th>{t('th.drsVisited')}</th>
                          <th>{t('th.contact')}</th>
                          <th>{t('th.phone')}</th>
                          <th>{t('th.lastVisit')}</th>
                          <th>{t('th.nextVisit')}</th>
                          <th>{t('th.status')}</th>
                          <th>{t('th.ourProducts')}</th>
                          <th>{t('th.competitor')}</th>
                          <th>{t('th.notes')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHospitals.map((r) => (
                          <tr key={r.id}>
                            <td className="font-bold text-[var(--ink)] whitespace-nowrap">{r.name}</td>
                            <td className="whitespace-nowrap max-w-[180px] truncate font-medium text-[var(--ink-secondary)]" title={r.objective || ''}>
                              {r.objective || '—'}
                            </td>
                            <td className="whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                  r.visitType === 'Double'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                <span>{r.visitType === 'Double' ? '👥' : '👤'}</span>
                                <span>
                                  {r.visitType === 'Double'
                                    ? `${t('visit.double')}${r.companion ? ` (${r.companion})` : ''}`
                                    : t('visit.single')}
                                </span>
                              </span>
                            </td>
                            <td className="whitespace-nowrap">{r.area}</td>
                            <td className="whitespace-nowrap">{r.type}</td>
                            <td className="whitespace-nowrap">{r.dept}</td>
                            <td className="whitespace-nowrap">
                              <span className="font-mono font-bold">{r.drsVisited ?? 0}</span>
                              {r.doctorNames && (
                                <div className="text-[10px] text-[var(--ink-muted)] font-normal max-w-[140px] truncate" title={r.doctorNames}>
                                  🩺 {r.doctorNames}
                                </div>
                              )}
                            </td>
                            <td className="whitespace-nowrap">{r.contact}</td>
                            <td className="font-mono whitespace-nowrap">{r.phone}</td>
                            <td className="font-mono whitespace-nowrap">{r.lastVisit}</td>
                            <td className="font-mono whitespace-nowrap">{r.nextVisit}</td>
                            <td className="whitespace-nowrap"><Badge status={r.status} /></td>
                            <td className="whitespace-nowrap">{r.ourProducts}</td>
                            <td className="whitespace-nowrap">{r.competitor}</td>
                            <td className="whitespace-nowrap max-w-xs truncate">{r.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

              {activeTab === 'pharmacy' &&
                (filteredPharmacies.length === 0 ? (
                  <EmptyState title={t('empty.noVisits')} icon="💊" className="border-none shadow-none" />
                ) : (
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>{t('th.pharmacy')}</th>
                          <th>{t('th.objective')}</th>
                          <th>{t('th.visitType')}</th>
                          <th>{t('th.area')}</th>
                          <th>{t('th.address')}</th>
                          <th>{t('th.pharmacist')}</th>
                          <th>{t('th.mobile')}</th>
                          <th>{t('th.classification')}</th>
                          <th>{t('th.stockPerMonth')}</th>
                          <th>{t('th.salesPerMonth')}</th>
                          <th>{t('th.lastVisit')}</th>
                          <th>{t('th.nextVisit')}</th>
                          <th>{t('th.status')}</th>
                          <th>{t('th.ourProducts')}</th>
                          <th>{t('th.competitor')}</th>
                          <th>{t('th.notes')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPharmacies.map((r) => (
                          <tr key={r.id}>
                            <td className="font-bold text-[var(--ink)] whitespace-nowrap">{r.name}</td>
                            <td className="whitespace-nowrap max-w-[180px] truncate font-medium text-[var(--ink-secondary)]" title={r.objective || ''}>
                              {r.objective || '—'}
                            </td>
                            <td className="whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                  r.visitType === 'Double'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                <span>{r.visitType === 'Double' ? '👥' : '👤'}</span>
                                <span>
                                  {r.visitType === 'Double'
                                    ? `${t('visit.double')}${r.companion ? ` (${r.companion})` : ''}`
                                    : t('visit.single')}
                                </span>
                              </span>
                            </td>
                            <td className="whitespace-nowrap">{r.area}</td>
                            <td className="whitespace-nowrap">{r.address}</td>
                            <td className="whitespace-nowrap">{r.pharmacist}</td>
                            <td className="font-mono whitespace-nowrap">{r.mobile}</td>
                            <td className="whitespace-nowrap"><Badge status={r.cls} type="class" /></td>
                            <td className="font-mono whitespace-nowrap font-bold text-amber-900">{r.stockPerMonth ?? '—'}</td>
                            <td className="font-mono whitespace-nowrap font-bold text-emerald-700">{r.salesPerMonth ?? '—'}</td>
                            <td className="font-mono whitespace-nowrap">{r.lastVisit}</td>
                            <td className="font-mono whitespace-nowrap">{r.nextVisit}</td>
                            <td className="whitespace-nowrap"><Badge status={r.status} /></td>
                            <td className="whitespace-nowrap">{r.ourProducts}</td>
                            <td className="whitespace-nowrap">{r.competitor}</td>
                            <td className="whitespace-nowrap max-w-xs truncate">{r.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

              {activeTab === 'doctor' &&
                (filteredDoctors.length === 0 ? (
                  <EmptyState title={t('empty.noVisits')} icon="🩺" className="border-none shadow-none" />
                ) : (
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>{t('th.code')}</th>
                          <th>{t('th.doctor')}</th>
                          <th>{t('th.objective')}</th>
                          <th>{t('th.visitType')}</th>
                          <th>{t('th.specialty')}</th>
                          <th>{t('th.workplace')}</th>
                          <th>{t('th.nearbyPharmacy')}</th>
                          <th>{t('th.area')}</th>
                          <th>{t('th.mobile')}</th>
                          <th>{t('th.classification')}</th>
                          <th>{t('th.prescriptionRate')}</th>
                          <th>{t('th.lastVisit')}</th>
                          <th>{t('th.nextVisit')}</th>
                          <th>{t('th.status')}</th>
                          <th>{t('th.presentedProducts')}</th>
                          <th>{t('th.notes')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDoctors.map((r) => {
                          const prods = [r.f1, r.f2, r.f3, r.reminder].filter(Boolean).join(', ');
                          return (
                            <tr key={r.id}>
                              <td className="font-mono whitespace-nowrap">{r.code}</td>
                              <td className="font-bold text-[var(--ink)] whitespace-nowrap">{r.name}</td>
                              <td className="whitespace-nowrap max-w-[180px] truncate font-medium text-[var(--ink-secondary)]" title={r.objective || ''}>
                                {r.objective || '—'}
                              </td>
                              <td className="whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                    r.visitType === 'Double'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  <span>{r.visitType === 'Double' ? '👥' : '👤'}</span>
                                  <span>
                                    {r.visitType === 'Double'
                                      ? `${t('visit.double')}${r.companion ? ` (${r.companion})` : ''}`
                                      : t('visit.single')}
                                  </span>
                                </span>
                              </td>
                              <td className="whitespace-nowrap">{r.specialty}</td>
                              <td className="whitespace-nowrap">{r.workplace}</td>
                              <td className="whitespace-nowrap font-medium text-blue-900">{r.nearbyPharmacy || '—'}</td>
                              <td className="whitespace-nowrap">{r.area}</td>
                              <td className="font-mono whitespace-nowrap">{r.mobile}</td>
                              <td className="whitespace-nowrap"><Badge status={r.cls} type="class" /></td>
                              <td className="whitespace-nowrap">
                                {r.prescriptionRate ? (
                                  <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    {r.prescriptionRate}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="font-mono whitespace-nowrap">{r.visitDate}</td>
                              <td className="font-mono whitespace-nowrap">{r.nextVisit}</td>
                              <td className="whitespace-nowrap"><Badge status={r.status} /></td>
                              <td className="whitespace-nowrap font-medium text-[var(--gold-deep)]">{prods}</td>
                              <td className="whitespace-nowrap max-w-xs truncate">{r.notes}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}

              {activeTab === 'branch' &&
                (data.branches.length === 0 ? (
                  <EmptyState title={t('empty.noVisits')} icon="🏢" className="border-none shadow-none" />
                ) : (
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>{t('th.branch')}</th>
                          <th>{t('th.objective')}</th>
                          <th>{t('th.visitType')}</th>
                          <th>{t('th.area')}</th>
                          <th>{t('th.contact')}</th>
                          <th>{t('th.phone')}</th>
                          <th>{t('th.ourProducts')}</th>
                          <th>{t('th.monthlyStock')}</th>
                          <th>{t('th.monthlySales')}</th>
                          <th>{t('th.lastVisit')}</th>
                          <th>{t('th.notes')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.branches.map((r) => (
                          <tr key={r.id}>
                            <td className="font-bold text-[var(--ink)] whitespace-nowrap">{r.name}</td>
                            <td className="whitespace-nowrap max-w-[180px] truncate font-medium text-[var(--ink-secondary)]" title={r.objective || ''}>
                              {r.objective || '—'}
                            </td>
                            <td className="whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                  r.visitType === 'Double'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                <span>{r.visitType === 'Double' ? '👥' : '👤'}</span>
                                <span>
                                  {r.visitType === 'Double'
                                    ? `${t('visit.double')}${r.companion ? ` (${r.companion})` : ''}`
                                    : t('visit.single')}
                                </span>
                              </span>
                            </td>
                            <td className="whitespace-nowrap">{r.area}</td>
                            <td className="whitespace-nowrap">{r.contact}</td>
                            <td className="font-mono whitespace-nowrap">{r.phone}</td>
                            <td className="whitespace-nowrap">{r.products}</td>
                            <td className="font-mono whitespace-nowrap font-bold text-amber-900">{r.monthlyStock ?? '—'}</td>
                            <td className="font-mono whitespace-nowrap font-bold text-blue-700">{r.monthlySales ?? '—'}</td>
                            <td className="font-mono whitespace-nowrap">{r.lastVisit}</td>
                            <td className="whitespace-nowrap max-w-xs truncate">{r.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

              {activeTab === 'availability' &&
                (data.availabilities.length === 0 ? (
                  <EmptyState title="لا توجد تقارير تحليل منتجات مسجلة حتى الآن" icon="📊" className="border-none shadow-none" />
                ) : (
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>{t('th.hospital')}</th>
                          <th>{t('th.area')}</th>
                          <th>{t('th.product')}</th>
                          <th>{t('th.month')}</th>
                          <th>{t('analysis.annualTarget')}</th>
                          <th>{t('analysis.avgMonthlyTarget')}</th>
                          <th>{t('analysis.sales')}</th>
                          <th>{t('analysis.potentiality')}</th>
                          <th>{t('analysis.pctAvgTarget')}</th>
                          <th>{t('analysis.pctAnnualTarget')}</th>
                          <th>{t('analysis.pctPotentiality')}</th>
                          <th>{t('th.availability')}</th>
                          <th>{t('th.notes')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.availabilities.map((r) => {
                          const salesVal = r.sales ?? 0;
                          const avgVal = r.avgMonthlyTarget ?? 0;
                          const annualVal = r.annualTarget ?? 0;
                          const potVal = r.potentiality ?? 0;
                          const pctAvg = avgVal > 0 ? Math.round((salesVal / avgVal) * 100) : null;
                          const pctAnn = annualVal > 0 ? Math.round((salesVal / annualVal) * 100) : null;
                          const pctPot = potVal > 0 ? Math.round((salesVal / potVal) * 100) : null;

                          return (
                            <tr key={r.id}>
                              <td className="font-bold text-[var(--ink)] whitespace-nowrap">{r.hospital}</td>
                              <td className="whitespace-nowrap">{r.area}</td>
                              <td className="font-bold text-[var(--gold-dark)] whitespace-nowrap">{r.product}</td>
                              <td className="whitespace-nowrap">{r.month}</td>
                              <td className="font-mono whitespace-nowrap">{r.annualTarget ?? '—'}</td>
                              <td className="font-mono whitespace-nowrap">{r.avgMonthlyTarget ?? '—'}</td>
                              <td className="font-mono whitespace-nowrap font-bold text-emerald-800">{salesVal}</td>
                              <td className="font-mono whitespace-nowrap">{r.potentiality ?? '—'}</td>
                              <td className="font-mono whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  {r.salesPctAvgTarget ?? (pctAvg !== null ? `${pctAvg}%` : '—')}
                                </span>
                              </td>
                              <td className="font-mono whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-blue-50 text-blue-800 border border-blue-200">
                                  {r.salesPctAnnualTarget ?? (pctAnn !== null ? `${pctAnn}%` : '—')}
                                </span>
                              </td>
                              <td className="font-mono whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-purple-50 text-purple-800 border border-purple-200">
                                  {r.salesPctPotentiality ?? (pctPot !== null ? `${pctPot}%` : '—')}
                                </span>
                              </td>
                              <td className="whitespace-nowrap"><Badge status={r.status} type="availability" /></td>
                              <td className="whitespace-nowrap max-w-xs truncate">{r.notes || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}

              {activeTab === 'event' &&
                (!data.events || data.events.length === 0 ? (
                  <EmptyState title="لا توجد فعاليات أو مؤتمرات مسجلة حتى الآن" icon="🎟️" className="border-none shadow-none" />
                ) : (
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>اسم الفعالية / المؤتمر</th>
                          <th>نوع الفعالية</th>
                          <th>التاريخ</th>
                          <th>المكان / القاعة</th>
                          <th>الحضور</th>
                          <th>التخصص المستهدف</th>
                          <th>المنتجات المعروضة</th>
                          <th>النتائج والمخرجات</th>
                          <th>ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.events.map((r) => (
                          <tr key={r.id}>
                            <td className="font-bold text-[var(--ink)] whitespace-nowrap">{r.title}</td>
                            <td className="whitespace-nowrap font-semibold text-[var(--gold-dark)]">{r.eventType}</td>
                            <td className="font-mono whitespace-nowrap">{r.eventDate}</td>
                            <td className="whitespace-nowrap">{r.location || '—'}</td>
                            <td className="font-mono whitespace-nowrap">{r.attendeesCount || '0'}</td>
                            <td className="whitespace-nowrap">{r.targetSpecialty || '—'}</td>
                            <td className="whitespace-nowrap font-medium text-[var(--ink)]">{r.products || '—'}</td>
                            <td className="whitespace-nowrap max-w-xs truncate" title={r.feedback || ''}>{r.feedback || '—'}</td>
                            <td className="whitespace-nowrap max-w-xs truncate">{r.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

              {activeTab === 'training' &&
                (!data.trainings || data.trainings.length === 0 ? (
                  <EmptyState title="لا توجد دورات أو ورش تدريبية مسجلة حتى الآن" icon="🎓" className="border-none shadow-none" />
                ) : (
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>عنوان التدريب / الورشة</th>
                          <th>نوع التدريب</th>
                          <th>التاريخ</th>
                          <th>المدرب / المحاضر</th>
                          <th>الحضور / الفئة</th>
                          <th>المدة (ساعات)</th>
                          <th>محاور الاستفادة والمخرجات</th>
                          <th>ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.trainings.map((r) => (
                          <tr key={r.id}>
                            <td className="font-bold text-[var(--ink)] whitespace-nowrap">{r.title}</td>
                            <td className="whitespace-nowrap font-semibold text-[var(--gold-dark)]">{r.trainingType}</td>
                            <td className="font-mono whitespace-nowrap">{r.trainingDate}</td>
                            <td className="whitespace-nowrap">{r.trainer || '—'}</td>
                            <td className="whitespace-nowrap">{r.attendees || '—'}</td>
                            <td className="font-mono whitespace-nowrap">{r.durationHours} س</td>
                            <td className="whitespace-nowrap max-w-xs truncate" title={r.outcomes || ''}>{r.outcomes || '—'}</td>
                            <td className="whitespace-nowrap max-w-xs truncate">{r.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

              {activeTab === 'special_task' &&
                (!data.specialTasks || data.specialTasks.length === 0 ? (
                  <EmptyState title="لا توجد مهام خاصة مسجلة حتى الآن" icon="⚡" className="border-none shadow-none" />
                ) : (
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>عنوان المهمة</th>
                          <th>التصنيف</th>
                          <th>التاريخ</th>
                          <th>بتكليف من</th>
                          <th>الأولوية</th>
                          <th>الحالة</th>
                          <th>تفاصيل المهمة والنتائج</th>
                          <th>ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.specialTasks.map((r) => (
                          <tr key={r.id}>
                            <td className="font-bold text-[var(--ink)] whitespace-nowrap">{r.title}</td>
                            <td className="whitespace-nowrap font-semibold text-[var(--gold-dark)]">{r.taskCategory}</td>
                            <td className="font-mono whitespace-nowrap">{r.taskDate}</td>
                            <td className="whitespace-nowrap">{r.assignedBy || '—'}</td>
                            <td className="whitespace-nowrap">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                r.priority === 'Urgent' ? 'bg-red-100 text-red-700' : r.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {r.priority}
                              </span>
                            </td>
                            <td className="whitespace-nowrap">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                {r.status}
                              </span>
                            </td>
                            <td className="whitespace-nowrap max-w-xs truncate" title={r.description || ''}>{r.description || '—'}</td>
                            <td className="whitespace-nowrap max-w-xs truncate">{r.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
