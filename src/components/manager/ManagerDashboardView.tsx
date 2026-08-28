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
  WeeklyPlanRecord,
} from '@/types';
import { StatPill } from '@/components/ui/StatPill';
import { CoverageRing } from '@/components/ui/CoverageRing';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { useTranslation } from '@/lib/i18nContext';
import { calculateRepCoverage } from '@/lib/coverage';

type ManagerTabType = ActivityType | 'weeklyPlans';

interface ManagerDashboardViewProps {
  reps: Representative[];
  onLock: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export function ManagerDashboardView({
  reps,
  onLock,
  onError,
  onSuccess,
}: ManagerDashboardViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ManagerTabType>('hospital');
  const [filterRep, setFilterRep] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedPlanPreview, setSelectedPlanPreview] = useState<WeeklyPlanRecord | null>(null);

  const [data, setData] = useState<{
    hospitals: HospitalVisitRecord[];
    pharmacies: PharmacyVisitRecord[];
    doctors: DoctorVisitRecord[];
    branches: BranchVisitRecord[];
    availabilities: ProductAvailabilityRecord[];
    weeklyPlans: WeeklyPlanRecord[];
  }>({
    hospitals: [],
    pharmacies: [],
    doctors: [],
    branches: [],
    availabilities: [],
    weeklyPlans: [],
  });

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsRes, plansRes] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/weekly-plans'),
      ]);
      const resData = await reportsRes.json();
      const plansData = await plansRes.json();
      setData({
        ...resData,
        weeklyPlans: plansData.plans || [],
      });
    } catch (e) {
      console.error('Error fetching manager overview:', e);
      onError(t('msg.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }, [onError, t]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export/excel');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `REP_TRACK_Combined_${stamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      onSuccess(t('msg.exportSuccess'));
    } catch (e) {
      console.error('Export error:', e);
      onError(t('msg.exportError'));
    } finally {
      setExporting(false);
    }
  };

  const handleApprovePlan = async (planId: string) => {
    try {
      const res = await fetch(`/api/weekly-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved' }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        onSuccess('تم اعتماد الخطة الأسبوعية بنجاح ✓');
        loadAllData();
      } else {
        onError(resData.message || t('msg.errorGeneric'));
      }
    } catch {
      onError(t('msg.errorGeneric'));
    }
  };

  const repSummaries = useMemo(() => {
    return reps.map((r) => {
      const hc = data.hospitals.filter(
        (x) => x.rep.trim().toLowerCase() === r.name.trim().toLowerCase()
      ).length;
      const pc = data.pharmacies.filter(
        (x) => x.rep.trim().toLowerCase() === r.name.trim().toLowerCase()
      ).length;
      const dc = data.doctors.filter(
        (x) => x.rep.trim().toLowerCase() === r.name.trim().toLowerCase()
      ).length;
      const cov = calculateRepCoverage(r, hc, pc, dc);
      return { rep: r, cov };
    });
  }, [reps, data.hospitals, data.pharmacies, data.doctors]);

  const repFilterOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: t('manager.allReps') },
      ...reps.map((r) => ({
        value: r.name,
        label: r.name,
        sublabel: r.area,
      })),
    ];
  }, [reps, t]);

  const matchesSearch = (text?: string | null) => {
    if (!searchTerm.trim()) return true;
    if (!text) return false;
    return text.toLowerCase().includes(searchTerm.trim().toLowerCase());
  };

  const filteredHospitals = useMemo(() => {
    return data.hospitals.filter((x) => {
      const repMatch = !filterRep || x.rep.trim().toLowerCase() === filterRep.trim().toLowerCase();
      const searchMatch = matchesSearch(x.name) || matchesSearch(x.area) || matchesSearch(x.rep);
      return repMatch && searchMatch;
    });
  }, [data.hospitals, filterRep, searchTerm]);

  const filteredPharmacies = useMemo(() => {
    return data.pharmacies.filter((x) => {
      const repMatch = !filterRep || x.rep.trim().toLowerCase() === filterRep.trim().toLowerCase();
      const searchMatch = matchesSearch(x.name) || matchesSearch(x.area) || matchesSearch(x.rep);
      return repMatch && searchMatch;
    });
  }, [data.pharmacies, filterRep, searchTerm]);

  const filteredDoctors = useMemo(() => {
    return data.doctors.filter((x) => {
      const repMatch = !filterRep || x.rep.trim().toLowerCase() === filterRep.trim().toLowerCase();
      const searchMatch =
        matchesSearch(x.name) || matchesSearch(x.area) || matchesSearch(x.specialty) || matchesSearch(x.rep);
      return repMatch && searchMatch;
    });
  }, [data.doctors, filterRep, searchTerm]);

  const filteredBranches = useMemo(() => {
    return data.branches.filter((x) => {
      const repMatch = !filterRep || x.rep.trim().toLowerCase() === filterRep.trim().toLowerCase();
      const searchMatch = matchesSearch(x.name) || matchesSearch(x.area) || matchesSearch(x.rep);
      return repMatch && searchMatch;
    });
  }, [data.branches, filterRep, searchTerm]);

  const filteredAvailabilities = useMemo(() => {
    return data.availabilities.filter((x) => {
      const repMatch = !filterRep || x.rep.trim().toLowerCase() === filterRep.trim().toLowerCase();
      const searchMatch =
        matchesSearch(x.hospital) || matchesSearch(x.product) || matchesSearch(x.area) || matchesSearch(x.rep);
      return repMatch && searchMatch;
    });
  }, [data.availabilities, filterRep, searchTerm]);

  const filteredWeeklyPlans = useMemo(() => {
    return data.weeklyPlans.filter((x) => {
      const repMatch = !filterRep || x.rep.trim().toLowerCase() === filterRep.trim().toLowerCase();
      const searchMatch = matchesSearch(x.rep) || matchesSearch(x.weekLabel) || matchesSearch(x.startDate);
      return repMatch && searchMatch;
    });
  }, [data.weeklyPlans, filterRep, searchTerm]);

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <StatPill label={t('kpi.hospitalCoverage')} value={data.hospitals.length} icon="🏥" />
        <StatPill label={t('kpi.pharmacyCoverage')} value={data.pharmacies.length} icon="💊" />
        <StatPill label={t('kpi.doctorCoverage')} value={data.doctors.length} icon="🩺" />
        <StatPill label={t('kpi.branchVisits')} value={data.branches.length} icon="🏢" />
        <StatPill label={t('kpi.weeklyPlansCount')} value={data.weeklyPlans.length} icon="📅" highlight />
        <StatPill label={t('kpi.repsCount')} value={reps.length} icon="👥" />
      </div>

      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 mb-4 shadow-card">
        <div className="flex justify-between items-center gap-3 mb-4 flex-wrap pb-3 border-b border-[var(--line)]">
          <div>
            <h2 className="text-base md:text-lg font-extrabold text-[var(--ink)]">
              {t('manager.repPerformance')}
            </h2>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5">
              {t('manager.subtitle')}
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <Button
              onClick={handleExportExcel}
              disabled={exporting}
              variant="secondary"
              size="sm"
              isLoading={exporting}
              leftIcon={<span>📥</span>}
            >
              {t('manager.exportExcel')}
            </Button>
            <Button
              onClick={onLock}
              variant="danger"
              size="sm"
              leftIcon={<span>🔒</span>}
            >
              {t('nav.lock')}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--ink-soft)]">
            <div className="inline-block w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin mb-2" />
            <div className="font-bold">{t('app.loading')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {repSummaries.map(({ rep, cov }) => (
              <div
                key={rep.id || rep.name}
                className="bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--gold-border)] rounded-xl p-4 shadow-2xs hover:shadow-card transition-all"
              >
                <div className="flex items-center gap-3.5 mb-3">
                  <CoverageRing percentage={cov.overallCoveragePct} size={50} strokeWidth={5} />
                  <div>
                    <div className="font-extrabold text-xs md:text-sm text-[var(--ink)]">{rep.name}</div>
                    <div className="text-[11px] font-bold text-[var(--gold-dark)]">{rep.area}</div>
                  </div>
                </div>
                <ProgressBar
                  label={t('activity.hospital')}
                  actual={cov.actualHospitals}
                  assigned={cov.assignedHospitals}
                />
                <ProgressBar
                  label={t('activity.pharmacy')}
                  actual={cov.actualPharmacies}
                  assigned={cov.assignedPharmacies}
                />
                <ProgressBar
                  label={t('activity.doctor')}
                  actual={cov.actualDrs}
                  assigned={cov.assignedDrs}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 shadow-card">
        <div className="flex justify-between items-center gap-3 mb-4 flex-wrap">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'hospital', icon: '🏥', label: t('activity.hospital') },
              { id: 'pharmacy', icon: '💊', label: t('activity.pharmacy') },
              { id: 'doctor', icon: '🩺', label: t('activity.doctor') },
              { id: 'branch', icon: '🏢', label: t('activity.branch') },
              { id: 'availability', icon: '📦', label: t('activity.availability') },
              { id: 'weeklyPlans', icon: '📅', label: t('manager.tab.weeklyPlans') },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ManagerTabType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${
                  activeTab === tab.id
                    ? 'bg-[var(--gold)] text-white border-[var(--gold-border)]'
                    : 'bg-white text-[var(--ink-soft)] border-[var(--line)]'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('manager.search')}
              className="px-3 py-1.5 text-xs bg-white border border-[var(--line)] rounded-lg font-medium w-44 md:w-56"
            />
            <div className="w-44 md:w-56">
              <CustomSelect
                options={repFilterOptions}
                value={filterRep}
                onChange={setFilterRep}
                size="sm"
                searchable={true}
              />
            </div>
          </div>
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
                      <th>{t('th.rep')}</th>
                      <th>{t('th.hospital')}</th>
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
                        <td className="font-bold text-[var(--gold-dark)] whitespace-nowrap">{r.rep}</td>
                        <td className="font-bold whitespace-nowrap">{r.name}</td>
                        <td className="whitespace-nowrap">
                          {r.visitType === 'Double' ? `👥 ${t('visit.double')}` : `👤 ${t('visit.single')}`}
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
                      <th>{t('th.rep')}</th>
                      <th>{t('th.pharmacy')}</th>
                      <th>{t('th.visitType')}</th>
                      <th>{t('th.area')}</th>
                      <th>{t('th.address')}</th>
                      <th>{t('th.pharmacist')}</th>
                      <th>{t('th.mobile')}</th>
                      <th>{t('th.classification')}</th>
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
                        <td className="font-bold text-[var(--gold-dark)] whitespace-nowrap">{r.rep}</td>
                        <td className="font-bold whitespace-nowrap">{r.name}</td>
                        <td className="whitespace-nowrap">
                          {r.visitType === 'Double' ? `👥 ${t('visit.double')}` : `👤 ${t('visit.single')}`}
                        </td>
                        <td className="whitespace-nowrap">{r.area}</td>
                        <td className="whitespace-nowrap">{r.address}</td>
                        <td className="whitespace-nowrap">{r.pharmacist}</td>
                        <td className="font-mono whitespace-nowrap">{r.mobile}</td>
                        <td className="whitespace-nowrap"><Badge status={r.cls} type="class" /></td>
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
                      <th>{t('th.rep')}</th>
                      <th>{t('th.code')}</th>
                      <th>{t('th.doctor')}</th>
                      <th>{t('th.visitType')}</th>
                      <th>{t('th.specialty')}</th>
                      <th>{t('th.workplace')}</th>
                      <th>{t('th.area')}</th>
                      <th>{t('th.mobile')}</th>
                      <th>{t('th.classification')}</th>
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
                          <td className="font-bold text-[var(--gold-dark)] whitespace-nowrap">{r.rep}</td>
                          <td className="font-mono whitespace-nowrap">{r.code}</td>
                          <td className="font-bold whitespace-nowrap">{r.name}</td>
                          <td className="whitespace-nowrap">
                            {r.visitType === 'Double' ? `👥 ${t('visit.double')}` : `👤 ${t('visit.single')}`}
                          </td>
                          <td className="whitespace-nowrap">{r.specialty}</td>
                          <td className="whitespace-nowrap">{r.workplace}</td>
                          <td className="whitespace-nowrap">{r.area}</td>
                          <td className="font-mono whitespace-nowrap">{r.mobile}</td>
                          <td className="whitespace-nowrap"><Badge status={r.cls} type="class" /></td>
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
            (filteredBranches.length === 0 ? (
              <EmptyState title={t('empty.noVisits')} icon="🏢" className="border-none shadow-none" />
            ) : (
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>{t('th.rep')}</th>
                      <th>{t('th.branch')}</th>
                      <th>{t('th.visitType')}</th>
                      <th>{t('th.area')}</th>
                      <th>{t('th.contact')}</th>
                      <th>{t('th.phone')}</th>
                      <th>{t('th.ourProducts')}</th>
                      <th>{t('th.lastVisit')}</th>
                      <th>{t('th.notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBranches.map((r) => (
                      <tr key={r.id}>
                        <td className="font-bold text-[var(--gold-dark)] whitespace-nowrap">{r.rep}</td>
                        <td className="font-bold whitespace-nowrap">{r.name}</td>
                        <td className="whitespace-nowrap">
                          {r.visitType === 'Double' ? `👥 ${t('visit.double')}` : `👤 ${t('visit.single')}`}
                        </td>
                        <td className="whitespace-nowrap">{r.area}</td>
                        <td className="whitespace-nowrap">{r.contact}</td>
                        <td className="font-mono whitespace-nowrap">{r.phone}</td>
                        <td className="whitespace-nowrap">{r.products}</td>
                        <td className="font-mono whitespace-nowrap">{r.lastVisit}</td>
                        <td className="whitespace-nowrap max-w-xs truncate">{r.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {activeTab === 'availability' &&
            (filteredAvailabilities.length === 0 ? (
              <EmptyState title={t('empty.noAvailability')} icon="📦" className="border-none shadow-none" />
            ) : (
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>{t('th.rep')}</th>
                      <th>{t('th.hospital')}</th>
                      <th>{t('th.area')}</th>
                      <th>{t('th.product')}</th>
                      <th>{t('th.month')}</th>
                      <th>{t('th.sales')}</th>
                      <th>{t('th.availability')}</th>
                      <th>{t('th.notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAvailabilities.map((r) => (
                      <tr key={r.id}>
                        <td className="font-bold text-[var(--gold-dark)] whitespace-nowrap">{r.rep}</td>
                        <td className="font-bold whitespace-nowrap">{r.hospital}</td>
                        <td className="whitespace-nowrap">{r.area}</td>
                        <td className="font-bold text-[var(--gold-dark)] whitespace-nowrap">{r.product}</td>
                        <td className="whitespace-nowrap">{r.month}</td>
                        <td className="font-mono whitespace-nowrap font-bold">{r.sales ?? 0}</td>
                        <td className="whitespace-nowrap"><Badge status={r.status} type="availability" /></td>
                        <td className="whitespace-nowrap max-w-xs truncate">{r.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {activeTab === 'weeklyPlans' &&
            (filteredWeeklyPlans.length === 0 ? (
              <EmptyState title={t('empty.noPlans')} icon="📅" className="border-none shadow-none" />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredWeeklyPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-white border border-[var(--line)] rounded-xl p-4 shadow-xs hover:shadow-card transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-[var(--line)]">
                          <div>
                            <span className="font-extrabold text-sm text-[var(--ink)] block">
                              👤 {plan.rep}
                            </span>
                            <span className="text-xs font-mono text-[var(--gold-dark)] font-bold">
                              📅 {plan.weekLabel || `${plan.startDate} to ${plan.endDate}`}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                              plan.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {plan.status === 'Approved' ? 'معتمدة ✓' : 'في الانتظار'}
                          </span>
                        </div>

                        {/* Quick highlights */}
                        <div className="text-[11px] space-y-1 my-2 bg-[#FAF9F5] p-2.5 rounded-lg border border-[var(--line)] font-medium">
                          <div className="truncate">
                            <strong className="text-[var(--ink)]">السبت:</strong> {plan.saturdayAm || '—'}
                          </div>
                          <div className="truncate">
                            <strong className="text-[var(--ink)]">الأحد:</strong> {plan.sundayAm || '—'}
                          </div>
                          <div className="truncate">
                            <strong className="text-[var(--ink)]">الاثنين:</strong> {plan.mondayAm || '—'}
                          </div>
                        </div>

                        {plan.managerNotes && (
                          <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                            <strong>ملاحظات المدير:</strong> {plan.managerNotes}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[var(--line)]">
                        <button
                          type="button"
                          onClick={() => setSelectedPlanPreview(plan)}
                          className="text-xs font-bold text-[var(--gold-dark)] hover:underline cursor-pointer"
                        >
                          👁️ معاينة كاملة
                        </button>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={`/api/weekly-plans/${plan.id}/export`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 text-xs font-bold bg-[#E8F3FF] hover:bg-[#D5E9FF] text-[#1D5E99] border border-[#B9DAFF] rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <span>📊</span>
                            <span>إكسل</span>
                          </a>

                          {plan.status !== 'Approved' && (
                            <button
                              type="button"
                              onClick={() => handleApprovePlan(plan.id)}
                              className="px-2.5 py-1 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                            >
                              ✓ اعتماد
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detailed Plan Preview Modal */}
                {selectedPlanPreview && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[var(--line)] p-6 animate-fade-in">
                      <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-4">
                        <div>
                          <h3 className="text-base font-black text-[var(--ink)]">
                            WEEKLY PLAN — {selectedPlanPreview.rep}
                          </h3>
                          <p className="text-xs font-mono text-[var(--gold-dark)] font-bold">
                            {selectedPlanPreview.weekLabel || `${selectedPlanPreview.startDate} to ${selectedPlanPreview.endDate}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedPlanPreview(null)}
                          className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer p-1"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="overflow-x-auto border border-[#DDD5C0] rounded-xl mb-4">
                        <table className="w-full text-xs text-start border-collapse">
                          <thead>
                            <tr className="bg-[#EFE9DA] text-[#4A3B18] border-b border-[#D8CEB9]">
                              <th className="py-2 px-3 text-center font-bold w-[20%]">DAY</th>
                              <th className="py-2 px-3 text-start font-bold w-[40%]">AM</th>
                              <th className="py-2 px-3 text-start font-bold w-[40%]">PM</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--line)]">
                            <tr>
                              <td className="py-2 px-3 font-bold bg-[#FAF7F0] text-center">SATURDAY</td>
                              <td className="py-2 px-3">{selectedPlanPreview.saturdayAm || '—'}</td>
                              <td className="py-2 px-3">{selectedPlanPreview.saturdayPm || '—'}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-bold bg-[#FAF7F0] text-center">SUNDAY</td>
                              <td className="py-2 px-3">{selectedPlanPreview.sundayAm || '—'}</td>
                              <td className="py-2 px-3">{selectedPlanPreview.sundayPm || '—'}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-bold bg-[#FAF7F0] text-center">MONDAY</td>
                              <td className="py-2 px-3">{selectedPlanPreview.mondayAm || '—'}</td>
                              <td className="py-2 px-3">{selectedPlanPreview.mondayPm || '—'}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-bold bg-[#FAF7F0] text-center">TUESDAY</td>
                              <td className="py-2 px-3">{selectedPlanPreview.tuesdayAm || '—'}</td>
                              <td className="py-2 px-3">{selectedPlanPreview.tuesdayPm || '—'}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-bold bg-[#FAF7F0] text-center">WEDNESDAY</td>
                              <td className="py-2 px-3">{selectedPlanPreview.wednesdayAm || '—'}</td>
                              <td className="py-2 px-3">{selectedPlanPreview.wednesdayPm || '—'}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-bold bg-[#FAF7F0] text-center">THURSDAY</td>
                              <td className="py-2 px-3">{selectedPlanPreview.thursdayAm || '—'}</td>
                              <td className="py-2 px-3">{selectedPlanPreview.thursdayPm || '—'}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-bold bg-[#FAF7F0] text-center">FRIDAY</td>
                              <td className="py-2 px-3">{selectedPlanPreview.fridayAm || '—'}</td>
                              <td className="py-2 px-3">{selectedPlanPreview.fridayPm || '—'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--line)]">
                        <a
                          href={`/api/weekly-plans/${selectedPlanPreview.id}/export`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 text-xs font-bold bg-[#E8F3FF] hover:bg-[#D5E9FF] text-[#1D5E99] border border-[#B9DAFF] rounded-xl transition-colors inline-flex items-center gap-1.5"
                        >
                          <span>📊</span>
                          <span>تحميل ملف إكسل رسمي</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setSelectedPlanPreview(null)}
                          className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                        >
                          إغلاق
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
