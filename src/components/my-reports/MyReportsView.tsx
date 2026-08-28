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
  }>({
    hospitals: [],
    pharmacies: [],
    doctors: [],
    branches: [],
    availabilities: [],
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
    return calculateRepCoverage(
      repObj,
      data.hospitals.length,
      data.pharmacies.length,
      data.doctors.length
    );
  }, [repObj, data.hospitals.length, data.pharmacies.length, data.doctors.length]);

  const stats = useMemo(() => {
    const allVisits = [...data.hospitals, ...data.pharmacies, ...data.doctors, ...data.branches];
    return calculateRepOverviewStats(allVisits, data.availabilities.length);
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
                            <td className="font-bold text-[var(--ink)] whitespace-nowrap">{r.name}</td>
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
                              <td className="font-mono whitespace-nowrap">{r.code}</td>
                              <td className="font-bold text-[var(--ink)] whitespace-nowrap">{r.name}</td>
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
                (data.branches.length === 0 ? (
                  <EmptyState title={t('empty.noVisits')} icon="🏢" className="border-none shadow-none" />
                ) : (
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
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
                        {data.branches.map((r) => (
                          <tr key={r.id}>
                            <td className="font-bold text-[var(--ink)] whitespace-nowrap">{r.name}</td>
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
                  <EmptyState title={t('empty.noAvailability')} icon="📦" className="border-none shadow-none" />
                ) : (
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
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
                        {data.availabilities.map((r) => (
                          <tr key={r.id}>
                            <td className="font-bold text-[var(--ink)] whitespace-nowrap">{r.hospital}</td>
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
      )}
    </div>
  );
}
