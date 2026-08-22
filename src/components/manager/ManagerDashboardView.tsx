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
import { calculateRepCoverage } from '@/lib/coverage';

interface ManagerDashboardViewProps {
  reps: Representative[];
  onLock: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export function ManagerDashboardView({ reps, onLock, onError, onSuccess }: ManagerDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<ActivityType>('hospital');
  const [filterRep, setFilterRep] = useState<string>('');
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
      onError('فشل تحميل بيانات المدير');
    } finally {
      setLoading(false);
    }
  }, [onError]);

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
      a.download = `Rep_Tracking_Combined_${stamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      onSuccess('تم تحميل ملف الإكسل الشامل بنجاح ✓');
    } catch (e) {
      console.error('Export error:', e);
      onError('حصل خطأ أثناء تصدير ملف الإكسل');
    } finally {
      setExporting(false);
    }
  };

  const repSummaries = useMemo(() => {
    return reps.map((r) => {
      const hc = data.hospitals.filter((x) => x.rep.trim().toLowerCase() === r.name.trim().toLowerCase()).length;
      const pc = data.pharmacies.filter((x) => x.rep.trim().toLowerCase() === r.name.trim().toLowerCase()).length;
      const dc = data.doctors.filter((x) => x.rep.trim().toLowerCase() === r.name.trim().toLowerCase()).length;
      const cov = calculateRepCoverage(r, hc, pc, dc);
      return { rep: r, cov };
    });
  }, [reps, data.hospitals, data.pharmacies, data.doctors]);

  const filteredHospitals = useMemo(() => {
    if (!filterRep) return data.hospitals;
    return data.hospitals.filter((x) => x.rep.trim().toLowerCase() === filterRep.trim().toLowerCase());
  }, [data.hospitals, filterRep]);

  const filteredPharmacies = useMemo(() => {
    if (!filterRep) return data.pharmacies;
    return data.pharmacies.filter((x) => x.rep.trim().toLowerCase() === filterRep.trim().toLowerCase());
  }, [data.pharmacies, filterRep]);

  const filteredDoctors = useMemo(() => {
    if (!filterRep) return data.doctors;
    return data.doctors.filter((x) => x.rep.trim().toLowerCase() === filterRep.trim().toLowerCase());
  }, [data.doctors, filterRep]);

  const filteredBranches = useMemo(() => {
    if (!filterRep) return data.branches;
    return data.branches.filter((x) => x.rep.trim().toLowerCase() === filterRep.trim().toLowerCase());
  }, [data.branches, filterRep]);

  const filteredAvailabilities = useMemo(() => {
    if (!filterRep) return data.availabilities;
    return data.availabilities.filter((x) => x.rep.trim().toLowerCase() === filterRep.trim().toLowerCase());
  }, [data.availabilities, filterRep]);

  return (
    <div>
      {/* Top Stat Strip */}
      <div className="flex gap-3 flex-wrap mb-4">
        <StatPill label="إجمالي زيارات المستشفيات" value={data.hospitals.length} />
        <StatPill label="إجمالي زيارات الصيدليات" value={data.pharmacies.length} />
        <StatPill label="إجمالي زيارات الدكاترة" value={data.doctors.length} />
        <StatPill label="إجمالي زيارات فروع التوزيع" value={data.branches.length} />
        <StatPill label="إجمالي تقارير توافر المنتج" value={data.availabilities.length} />
        <StatPill label="عدد المندوبين" value={reps.length} />
      </div>

      {/* Coverage Section */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 mb-4 shadow-xs">
        <div className="flex justify-between items-center gap-3 mb-4 flex-wrap">
          <div>
            <h2 className="text-base font-bold text-[var(--ink)]">تغطية كل مندوب</h2>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5">
              معدلات التغطية ونسب الزيارات الفعلية مقارنة بالتارجت المعين
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="px-4 py-2 rounded-lg text-xs md:text-sm font-bold bg-white text-[var(--ink)] border border-[var(--line)] hover:border-[var(--ink-soft)] shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>{exporting ? '⏳' : '⬇'}</span>
              <span>{exporting ? 'جاري التجهيز...' : 'تحميل ملف إكسل شامل'}</span>
            </button>
            <button
              onClick={onLock}
              className="px-3 py-2 rounded-lg text-xs font-bold text-[var(--coral)] bg-[var(--coral-tint)] hover:bg-[var(--coral)] hover:text-white transition-all cursor-pointer"
            >
              قفل اللوحة
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--ink-soft)]">
            <div className="inline-block w-6 h-6 border-2 border-[var(--teal)] border-t-transparent rounded-full animate-spin mb-2" />
            <div>بيتم تحميل بيانات التغطية...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {repSummaries.map(({ rep, cov }) => (
              <div key={rep.id || rep.name} className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-3.5 shadow-2xs">
                <div className="flex items-center gap-3 mb-2.5">
                  <CoverageRing percentage={cov.overallCoveragePct} />
                  <div>
                    <div className="font-bold text-xs md:text-sm text-[var(--ink)]">{rep.name}</div>
                    <div className="text-[11px] text-[var(--ink-soft)]">{rep.area}</div>
                  </div>
                </div>
                <ProgressBar label="مستشفيات" actual={cov.actualHospitals} assigned={cov.assignedHospitals} />
                <ProgressBar label="صيدليات" actual={cov.actualPharmacies} assigned={cov.assignedPharmacies} />
                <ProgressBar label="دكاترة" actual={cov.actualDrs} assigned={cov.assignedDrs} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Records Data Table */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 shadow-xs">
        <div className="flex justify-between items-center gap-3 mb-4 flex-wrap">
          <EntityTabs activeTab={activeTab} onChange={setActiveTab} />
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-[var(--ink-soft)]">فلترة بالمندوب:</label>
            <select
              value={filterRep}
              onChange={(e) => setFilterRep(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-[var(--line)] rounded-lg font-medium"
            >
              <option value="">كل المندوبين</option>
              {reps.map((r) => (
                <option key={r.id || r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-[var(--line)] rounded-xl">
          {activeTab === 'hospital' && (
            filteredHospitals.length === 0 ? (
              <div className="p-10 text-center text-[var(--ink-soft)] text-xs">
                لسه مفيش زيارات متسجلة من النوع ده {filterRep ? `للمندوب (${filterRep})` : ''}
              </div>
            ) : (
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--bg)] border-b border-[var(--line)] text-[var(--ink-soft)] font-bold text-[11px]">
                    <th className="p-2.5 whitespace-nowrap">المندوب</th>
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
                      <td className="p-2.5 font-bold text-[var(--teal-deep)] whitespace-nowrap">{r.rep}</td>
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
              <div className="p-10 text-center text-[var(--ink-soft)] text-xs">
                لسه مفيش زيارات متسجلة من النوع ده {filterRep ? `للمندوب (${filterRep})` : ''}
              </div>
            ) : (
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--bg)] border-b border-[var(--line)] text-[var(--ink-soft)] font-bold text-[11px]">
                    <th className="p-2.5 whitespace-nowrap">المندوب</th>
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
                      <td className="p-2.5 font-bold text-[var(--teal-deep)] whitespace-nowrap">{r.rep}</td>
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
              <div className="p-10 text-center text-[var(--ink-soft)] text-xs">
                لسه مفيش زيارات متسجلة من النوع ده {filterRep ? `للمندوب (${filterRep})` : ''}
              </div>
            ) : (
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--bg)] border-b border-[var(--line)] text-[var(--ink-soft)] font-bold text-[11px]">
                    <th className="p-2.5 whitespace-nowrap">المندوب</th>
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
                        <td className="p-2.5 font-bold text-[var(--teal-deep)] whitespace-nowrap">{r.rep}</td>
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
            filteredBranches.length === 0 ? (
              <div className="p-10 text-center text-[var(--ink-soft)] text-xs">
                لسه مفيش زيارات متسجلة من النوع ده {filterRep ? `للمندوب (${filterRep})` : ''}
              </div>
            ) : (
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--bg)] border-b border-[var(--line)] text-[var(--ink-soft)] font-bold text-[11px]">
                    <th className="p-2.5 whitespace-nowrap">المندوب</th>
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
                  {filteredBranches.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--line)] hover:bg-[#FAFAF7]">
                      <td className="p-2.5 font-bold text-[var(--teal-deep)] whitespace-nowrap">{r.rep}</td>
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
            filteredAvailabilities.length === 0 ? (
              <div className="p-10 text-center text-[var(--ink-soft)] text-xs">
                لسه مفيش تقارير توافر مسجلة {filterRep ? `للمندوب (${filterRep})` : ''}
              </div>
            ) : (
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--bg)] border-b border-[var(--line)] text-[var(--ink-soft)] font-bold text-[11px]">
                    <th className="p-2.5 whitespace-nowrap">المندوب</th>
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
                  {filteredAvailabilities.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--line)] hover:bg-[#FAFAF7]">
                      <td className="p-2.5 font-bold text-[var(--teal-deep)] whitespace-nowrap">{r.rep}</td>
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
  );
}
