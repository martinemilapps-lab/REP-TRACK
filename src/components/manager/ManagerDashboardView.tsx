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
} from '@/types';
import { StatPill } from '@/components/ui/StatPill';
import { CoverageRing } from '@/components/ui/CoverageRing';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { EntityTabs } from '@/components/ui/EntityTabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/lib/i18nContext';
import { calculateRepCoverage } from '@/lib/coverage';

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
  const [activeTab, setActiveTab] = useState<ActivityType>('hospital');
  const [filterRep, setFilterRep] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [data, setData] = useState<{
    hospitals: HospitalVisitRecord[];
    pharmacies: PharmacyVisitRecord[];
    doctors: DoctorVisitRecord[];
    branches: BranchVisitRecord[];
    availabilities: ProductAvailabilityRecord[];
  }>({
    hospitals: [],
    pharmacies: [],
    doctors: [],
    branches: [],
    availabilities: [],
  });

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const resData = await res.json();
      setData(resData);
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

  // Filters
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

  return (
    <div className="animate-fade-in">
      {/* Top Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <StatPill label={t('kpi.hospitalCoverage')} value={data.hospitals.length} icon="🏥" />
        <StatPill label={t('kpi.pharmacyCoverage')} value={data.pharmacies.length} icon="💊" />
        <StatPill label={t('kpi.doctorCoverage')} value={data.doctors.length} icon="🩺" />
        <StatPill label={t('kpi.branchVisits')} value={data.branches.length} icon="🏢" />
        <StatPill label={t('kpi.availabilityReports')} value={data.availabilities.length} icon="📦" />
        <StatPill label={t('kpi.repsCount')} value={reps.length} icon="👥" highlight />
      </div>

      {/* Coverage Matrix Section */}
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

      {/* Historical Logs & Master Activity Data Table */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 shadow-card">
        <div className="flex justify-between items-center gap-3 mb-4 flex-wrap">
          <EntityTabs activeTab={activeTab} onChange={setActiveTab} />
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('manager.search')}
              className="px-3 py-1.5 text-xs bg-white border border-[var(--line)] rounded-lg font-medium w-44 md:w-56"
            />

            {/* Rep Selector Filter */}
            <div className="flex items-center gap-1.5">
              <select
                value={filterRep}
                onChange={(e) => setFilterRep(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-[var(--line)] rounded-lg font-medium"
              >
                <option value="">{t('manager.allReps')}</option>
                {reps.map((r) => (
                  <option key={r.id || r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
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
                        <td className="whitespace-nowrap">{r.area}</td>
                        <td className="whitespace-nowrap">{r.type}</td>
                        <td className="whitespace-nowrap">{r.dept}</td>
                        <td className="font-mono whitespace-nowrap">{r.drsVisited}</td>
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
        </div>
      </div>
    </div>
  );
}
