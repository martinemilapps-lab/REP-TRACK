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
import { calculateRepCoverage, calculateRepOverviewStats, statusBucket } from '@/lib/coverage';

interface MyReportsViewProps {
  reps: Representative[];
  selectedRep: string;
  onSelectRep: (name: string) => void;
}

export function MyReportsView({ reps, selectedRep, onSelectRep }: MyReportsViewProps) {
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
    <div>
      {/* Rep Selection Header Card */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 mb-4 shadow-xs">
        <h2 className="text-base font-bold text-[var(--ink)] mb-1">تقاريري أنا بس</h2>
        <p className="text-xs text-[var(--ink-soft)] mb-3.5">
          اختار اسمك عشان تشوف بس الزيارات اللي انت سجلتها، ومفيش حد تاني هيشوف بياناتك
        </p>
        <div className="max-w-xs">
          <select
            value={selectedRep}
            onChange={(e) => onSelectRep(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-2 focus:outline-[var(--teal)] font-medium"
          >
            <option value="">-- اختار اسمك --</option>
            {reps.map((r) => (
              <option key={r.id || r.name} value={r.name}>
                {r.name} — {r.area}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedRep ? (
        <div className="bg-white border border-[var(--line)] rounded-[var(--radius)] p-12 text-center text-[var(--ink-soft)] text-sm shadow-xs">
          من فضلك اختار اسمك من القائمة لعرض تقاريرك والتغطية الخاصة بك
        </div>
      ) : loading ? (
        <div className="bg-white border border-[var(--line)] rounded-[var(--radius)] p-12 text-center text-[var(--ink-soft)] text-sm shadow-xs">
          <div className="inline-block w-6 h-6 border-2 border-[var(--teal)] border-t-transparent rounded-full animate-spin mb-2" />
          <div>بيتم تحميل بياناتك...</div>
        </div>
      ) : (
        <div>
          {/* Stat Strip */}
          <div className="flex gap-3 flex-wrap mb-4">
            <StatPill label="إجمالي الزيارات المسجلة" value={stats.totalVisits} />
            <StatPill label="تم الزيارة" value={stats.visitedCount} />
            <StatPill label="لسه ماتزارتش" value={stats.notVisitedCount} />
            <StatPill label="متأخرة" value={stats.overdueCount} />
          </div>

          {/* Coverage Summary Card */}
          {repObj && coverage && (
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-4 mb-4 shadow-xs max-w-sm">
              <div className="flex items-center gap-3.5 mb-3">
                <CoverageRing percentage={coverage.overallCoveragePct} />
                <div>
                  <div className="font-bold text-sm text-[var(--ink)]">{repObj.name}</div>
                  <div className="text-xs text-[var(--ink-soft)]">{repObj.area}</div>
                </div>
              </div>
              <ProgressBar label="مستشفيات" actual={coverage.actualHospitals} assigned={coverage.assignedHospitals} />
              <ProgressBar label="صيدليات" actual={coverage.actualPharmacies} assigned={coverage.assignedPharmacies} />
              <ProgressBar label="دكاترة" actual={coverage.actualDrs} assigned={coverage.assignedDrs} />
            </div>
          )}

          {/* Records Table Card */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 shadow-xs">
            <div className="flex justify-between items-center gap-3 mb-3.5 flex-wrap">
              <EntityTabs activeTab={activeTab} onChange={setActiveTab} />
              {activeTab !== 'availability' && activeTab !== 'branch' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-[var(--line)] rounded-lg font-medium"
                >
                  <option value="">كل الحالات</option>
                  <option value="visited">تم الزيارة بس</option>
                  <option value="notvisited">لسه ماتزارتش بس</option>
                  <option value="overdue">متأخرة بس</option>
                </select>
              )}
            </div>

            <div className="overflow-x-auto border border-[var(--line)] rounded-xl">
              {activeTab === 'hospital' && (
                filteredHospitals.length === 0 ? (
                  <div className="p-10 text-center text-[var(--ink-soft)] text-xs">لسه مفيش زيارات متسجلة من النوع ده</div>
                ) : (
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--bg)] border-b border-[var(--line)] text-[var(--ink-soft)] font-bold text-[11px]">
                        <th className="p-2.5 whitespace-nowrap">المستشفى</th>
                        <th className="p-2.5 whitespace-nowrap">المنطقة</th>
                        <th className="p-2.5 whitespace-nowrap">النوع</th>
                        <th className="p-2.5 whitespace-nowrap">القسم</th>
                        <th className="p-2.5 whitespace-nowrap">د. زاروا</th>
                        <th className="p-2.5 whitespace-nowrap">المسؤول</th>
                        <th className="p-2.5 whitespace-nowrap">التليفون</th>
                        <th className="p-2.5 whitespace-nowrap">آخر زيارة</th>
                        <th className="p-2.5 whitespace-nowrap">الزيارة الجاية</th>
                        <th className="p-2.5 whitespace-nowrap">الحالة</th>
                        <th className="p-2.5 whitespace-nowrap">منتجاتنا</th>
                        <th className="p-2.5 whitespace-nowrap">المنافس</th>
                        <th className="p-2.5 whitespace-nowrap">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHospitals.map((r) => (
                        <tr key={r.id} className="border-b border-[var(--line)] hover:bg-[#FAFAF7]">
                          <td className="p-2.5 font-bold whitespace-nowrap">{r.name}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.area}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.type}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.dept}</td>
                          <td className="p-2.5 font-mono whitespace-nowrap">{r.drsVisited}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.contact}</td>
                          <td className="p-2.5 font-mono whitespace-nowrap">{r.phone}</td>
                          <td className="p-2.5 font-mono whitespace-nowrap">{r.lastVisit}</td>
                          <td className="p-2.5 font-mono whitespace-nowrap">{r.nextVisit}</td>
                          <td className="p-2.5 whitespace-nowrap"><Badge status={r.status} /></td>
                          <td className="p-2.5 whitespace-nowrap">{r.ourProducts}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.competitor}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {activeTab === 'pharmacy' && (
                filteredPharmacies.length === 0 ? (
                  <div className="p-10 text-center text-[var(--ink-soft)] text-xs">لسه مفيش زيارات متسجلة من النوع ده</div>
                ) : (
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--bg)] border-b border-[var(--line)] text-[var(--ink-soft)] font-bold text-[11px]">
                        <th className="p-2.5 whitespace-nowrap">الصيدلية</th>
                        <th className="p-2.5 whitespace-nowrap">المنطقة</th>
                        <th className="p-2.5 whitespace-nowrap">العنوان</th>
                        <th className="p-2.5 whitespace-nowrap">الصيدلي</th>
                        <th className="p-2.5 whitespace-nowrap">الموبايل</th>
                        <th className="p-2.5 whitespace-nowrap">التصنيف</th>
                        <th className="p-2.5 whitespace-nowrap">آخر زيارة</th>
                        <th className="p-2.5 whitespace-nowrap">الزيارة الجاية</th>
                        <th className="p-2.5 whitespace-nowrap">الحالة</th>
                        <th className="p-2.5 whitespace-nowrap">منتجاتنا</th>
                        <th className="p-2.5 whitespace-nowrap">المنافس</th>
                        <th className="p-2.5 whitespace-nowrap">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPharmacies.map((r) => (
                        <tr key={r.id} className="border-b border-[var(--line)] hover:bg-[#FAFAF7]">
                          <td className="p-2.5 font-bold whitespace-nowrap">{r.name}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.area}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.address}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.pharmacist}</td>
                          <td className="p-2.5 font-mono whitespace-nowrap">{r.mobile}</td>
                          <td className="p-2.5 font-bold whitespace-nowrap">{r.cls}</td>
                          <td className="p-2.5 font-mono whitespace-nowrap">{r.lastVisit}</td>
                          <td className="p-2.5 font-mono whitespace-nowrap">{r.nextVisit}</td>
                          <td className="p-2.5 whitespace-nowrap"><Badge status={r.status} /></td>
                          <td className="p-2.5 whitespace-nowrap">{r.ourProducts}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.competitor}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {activeTab === 'doctor' && (
                filteredDoctors.length === 0 ? (
                  <div className="p-10 text-center text-[var(--ink-soft)] text-xs">لسه مفيش زيارات متسجلة من النوع ده</div>
                ) : (
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--bg)] border-b border-[var(--line)] text-[var(--ink-soft)] font-bold text-[11px]">
                        <th className="p-2.5 whitespace-nowrap">كود</th>
                        <th className="p-2.5 whitespace-nowrap">الدكتور</th>
                        <th className="p-2.5 whitespace-nowrap">التخصص</th>
                        <th className="p-2.5 whitespace-nowrap">مكان العمل</th>
                        <th className="p-2.5 whitespace-nowrap">المنطقة</th>
                        <th className="p-2.5 whitespace-nowrap">الموبايل</th>
                        <th className="p-2.5 whitespace-nowrap">التصنيف</th>
                        <th className="p-2.5 whitespace-nowrap">تاريخ الزيارة</th>
                        <th className="p-2.5 whitespace-nowrap">الزيارة الجاية</th>
                        <th className="p-2.5 whitespace-nowrap">الحالة</th>
                        <th className="p-2.5 whitespace-nowrap">المنتجات المعروضة</th>
                        <th className="p-2.5 whitespace-nowrap">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDoctors.map((r) => {
                        const prods = [r.f1, r.f2, r.f3, r.reminder].filter(Boolean).join(', ');
                        return (
                          <tr key={r.id} className="border-b border-[var(--line)] hover:bg-[#FAFAF7]">
                            <td className="p-2.5 font-mono whitespace-nowrap">{r.code}</td>
                            <td className="p-2.5 font-bold whitespace-nowrap">{r.name}</td>
                            <td className="p-2.5 whitespace-nowrap">{r.specialty}</td>
                            <td className="p-2.5 whitespace-nowrap">{r.workplace}</td>
                            <td className="p-2.5 whitespace-nowrap">{r.area}</td>
                            <td className="p-2.5 font-mono whitespace-nowrap">{r.mobile}</td>
                            <td className="p-2.5 font-bold whitespace-nowrap">{r.cls}</td>
                            <td className="p-2.5 font-mono whitespace-nowrap">{r.visitDate}</td>
                            <td className="p-2.5 font-mono whitespace-nowrap">{r.nextVisit}</td>
                            <td className="p-2.5 whitespace-nowrap"><Badge status={r.status} /></td>
                            <td className="p-2.5 whitespace-nowrap">{prods}</td>
                            <td className="p-2.5 whitespace-nowrap">{r.notes}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              )}

              {activeTab === 'branch' && (
                data.branches.length === 0 ? (
                  <div className="p-10 text-center text-[var(--ink-soft)] text-xs">لسه مفيش زيارات متسجلة من النوع ده</div>
                ) : (
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--bg)] border-b border-[var(--line)] text-[var(--ink-soft)] font-bold text-[11px]">
                        <th className="p-2.5 whitespace-nowrap">الفرع / الموزّع</th>
                        <th className="p-2.5 whitespace-nowrap">منطقة التغطية</th>
                        <th className="p-2.5 whitespace-nowrap">المسؤول</th>
                        <th className="p-2.5 whitespace-nowrap">التليفون</th>
                        <th className="p-2.5 whitespace-nowrap">المنتجات الموزّعة</th>
                        <th className="p-2.5 whitespace-nowrap">آخر زيارة</th>
                        <th className="p-2.5 whitespace-nowrap">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.branches.map((r) => (
                        <tr key={r.id} className="border-b border-[var(--line)] hover:bg-[#FAFAF7]">
                          <td className="p-2.5 font-bold whitespace-nowrap">{r.name}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.area}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.contact}</td>
                          <td className="p-2.5 font-mono whitespace-nowrap">{r.phone}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.products}</td>
                          <td className="p-2.5 font-mono whitespace-nowrap">{r.lastVisit}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {activeTab === 'availability' && (
                data.availabilities.length === 0 ? (
                  <div className="p-10 text-center text-[var(--ink-soft)] text-xs">لسه مفيش تقارير توافر مسجلة للمندوب ده</div>
                ) : (
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--bg)] border-b border-[var(--line)] text-[var(--ink-soft)] font-bold text-[11px]">
                        <th className="p-2.5 whitespace-nowrap">المستشفى</th>
                        <th className="p-2.5 whitespace-nowrap">المنطقة</th>
                        <th className="p-2.5 whitespace-nowrap">المنتج</th>
                        <th className="p-2.5 whitespace-nowrap">الشهر</th>
                        <th className="p-2.5 whitespace-nowrap">المبيعات</th>
                        <th className="p-2.5 whitespace-nowrap">التوافر</th>
                        <th className="p-2.5 whitespace-nowrap">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.availabilities.map((r) => (
                        <tr key={r.id} className="border-b border-[var(--line)] hover:bg-[#FAFAF7]">
                          <td className="p-2.5 font-bold whitespace-nowrap">{r.hospital}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.area}</td>
                          <td className="p-2.5 font-bold text-[var(--teal-deep)] whitespace-nowrap">{r.product}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.month}</td>
                          <td className="p-2.5 font-mono whitespace-nowrap">{r.sales ?? 0}</td>
                          <td className="p-2.5 whitespace-nowrap"><Badge status={r.status} type="availability" /></td>
                          <td className="p-2.5 whitespace-nowrap">{r.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
