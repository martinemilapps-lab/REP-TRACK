'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ManagerActivityRecord, WeeklyPlanRecord } from '@/types';
import { useTranslation } from '@/lib/i18nContext';
import { EmptyState } from '@/components/ui/EmptyState';

interface ManagerMyReportsViewProps {
  currentUser?: {
    id: string;
    name: string;
    username: string;
    position?: string;
    role?: string;
  } | null;
  onOpenPlan?: (plan: WeeklyPlanRecord) => void;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export function ManagerMyReportsView({
  currentUser,
  onOpenPlan,
  onSuccess,
  onError,
}: ManagerMyReportsViewProps) {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'activities' | 'plans'>('activities');
  const [loading, setLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('All');
  const [planStatusFilter, setPlanStatusFilter] = useState('All');

  // Data
  const [activities, setActivities] = useState<ManagerActivityRecord[]>([]);
  const [plans, setPlans] = useState<WeeklyPlanRecord[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load Manager Activities
  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (activityTypeFilter && activityTypeFilter !== 'All') params.set('activityType', activityTypeFilter);

      const res = await fetch(`/api/manager/activities?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.activities) {
        setActivities(data.activities);
      } else {
        onError?.(data.message || (isAr ? 'فشل جلب الأنشطة' : 'Failed to load activities'));
      }
    } catch {
      onError?.(isAr ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, activityTypeFilter, isAr, onError]);

  // Load Manager Personal Weekly Plans
  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/weekly-plans?personal=true');
      const data = await res.json();
      if (res.ok && data.plans) {
        let filtered = data.plans as WeeklyPlanRecord[];
        if (startDate) {
          filtered = filtered.filter((p) => p.startDate >= startDate);
        }
        if (endDate) {
          filtered = filtered.filter((p) => p.endDate <= endDate || p.startDate <= endDate);
        }
        if (planStatusFilter && planStatusFilter !== 'All') {
          filtered = filtered.filter((p) => p.status === planStatusFilter);
        }
        setPlans(filtered);
      } else {
        onError?.(data.message || (isAr ? 'فشل جلب الخطط' : 'Failed to load weekly plans'));
      }
    } catch {
      onError?.(isAr ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, planStatusFilter, isAr, onError]);

  useEffect(() => {
    if (activeTab === 'activities') {
      loadActivities();
    } else {
      loadPlans();
    }
  }, [activeTab, loadActivities, loadPlans]);

  // Delete an activity
  const handleDeleteActivity = async (id: string) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من رغبتك في حذف هذا التقرير؟' : 'Are you sure you want to delete this activity report?')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/manager/activities/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess?.(data.message || (isAr ? 'تم حذف التقرير بنجاح' : 'Report deleted successfully'));
        loadActivities();
      } else {
        onError?.(data.message || (isAr ? 'فشل حذف التقرير' : 'Failed to delete report'));
      }
    } catch {
      onError?.(isAr ? 'خطأ أثناء الحذف' : 'Error deleting report');
    } finally {
      setDeletingId(null);
    }
  };

  // Delete a weekly plan
  const handleDeletePlan = async (id: string) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذه الخطة الأسبوعية؟' : 'Are you sure you want to delete this weekly plan?')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/weekly-plans/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess?.(data.message || (isAr ? 'تم حذف الخطة بنجاح' : 'Weekly plan deleted successfully'));
        loadPlans();
      } else {
        onError?.(data.message || (isAr ? 'فشل حذف الخطة' : 'Failed to delete plan'));
      }
    } catch {
      onError?.(isAr ? 'خطأ أثناء الحذف' : 'Error deleting plan');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportPlan = (id: string) => {
    window.open(`/api/weekly-plans/${id}/export`, '_blank');
    onSuccess?.(isAr ? 'جارٍ تحميل ملف الخطة بصيغة Excel...' : 'Downloading weekly plan Excel...');
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setActivityTypeFilter('All');
    setPlanStatusFilter('All');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Banner Header */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-lg)] p-5 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📑</span>
              <h2 className="text-lg md:text-xl font-black text-[var(--ink)]">
                {isAr ? 'تقاريري الإدارية الخاصة' : 'My Managerial Reports'}
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] mt-1">
              {isAr
                ? 'استعراض وإدارة كافة الأنشطة الإدارية والخطط الأسبوعية المقدمة من قبلك فقط'
                : 'View and manage all your submitted activities and personal weekly plans'}
            </p>
          </div>

          {currentUser && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--line)] text-xs font-bold text-[var(--ink)] self-start md:self-auto">
              <span>👤 {currentUser.name || currentUser.username}</span>
              {currentUser.position && (
                <span className="px-1.5 py-0.5 rounded bg-[#1D5E99]/10 text-[#1D5E99] text-[10px] font-black uppercase">
                  {currentUser.position}
                </span>
              )}
            </div>
          )}
        </div>

        {/* View Toggle Tabs (Activities vs Weekly Plans) */}
        <div className="flex items-center gap-2 mt-5 border-b border-[var(--line)] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('activities')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'activities'
                ? 'bg-[#1D5E99] text-white shadow-xs'
                : 'bg-[var(--surface-subtle)] text-[var(--ink)] hover:bg-gray-100 border border-[var(--line)]'
            }`}
          >
            <span>📋</span>
            <span>{isAr ? 'تقارير الأنشطة' : 'Activities'}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'activities' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {activities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'plans'
                ? 'bg-[#1D5E99] text-white shadow-xs'
                : 'bg-[var(--surface-subtle)] text-[var(--ink)] hover:bg-gray-100 border border-[var(--line)]'
            }`}
          >
            <span>📅</span>
            <span>{isAr ? 'الخطط الأسبوعية' : 'Weekly Plans'}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'plans' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {plans.length}
            </span>
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="mt-4 pt-2 flex flex-wrap items-center gap-3 bg-[var(--surface-subtle)] p-3.5 rounded-xl border border-[var(--line)]">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--ink-secondary)]">
              {isAr ? 'من:' : 'From:'}
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[var(--line)] rounded-lg text-xs font-bold text-[var(--ink)]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--ink-secondary)]">
              {isAr ? 'إلى:' : 'To:'}
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[var(--line)] rounded-lg text-xs font-bold text-[var(--ink)]"
            />
          </div>

          {activeTab === 'activities' ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[var(--ink-secondary)]">
                {isAr ? 'النوع:' : 'Type:'}
              </span>
              <select
                value={activityTypeFilter}
                onChange={(e) => setActivityTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[var(--line)] rounded-lg text-xs font-bold text-[var(--ink)]"
              >
                <option value="All">{isAr ? 'جميع الأنواع' : 'All Types'}</option>
                <option value="Visit">{isAr ? 'زيارة ميدانية' : 'Visit'}</option>
                <option value="Event">{isAr ? 'فعالية / مؤتمر' : 'Event'}</option>
                <option value="Training">{isAr ? 'تدريب' : 'Training'}</option>
                <option value="Office Working">{isAr ? 'عمل مكتبي' : 'Office Working'}</option>
                <option value="Others">{isAr ? 'أخرى' : 'Others'}</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[var(--ink-secondary)]">
                {isAr ? 'الحالة:' : 'Status:'}
              </span>
              <select
                value={planStatusFilter}
                onChange={(e) => setPlanStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[var(--line)] rounded-lg text-xs font-bold text-[var(--ink)]"
              >
                <option value="All">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="Submitted">{isAr ? 'مقدمة (Submitted)' : 'Submitted'}</option>
                <option value="Approved">{isAr ? 'معتمدة (Approved)' : 'Approved'}</option>
                <option value="Draft">{isAr ? 'مسودة (Draft)' : 'Draft'}</option>
              </select>
            </div>
          )}

          <div className="ms-auto flex items-center gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-bold px-3 py-1.5 bg-white hover:bg-gray-100 border border-[var(--line)] rounded-lg text-[var(--ink-secondary)] transition-colors cursor-pointer"
            >
              {isAr ? 'تفريغ الفلتر' : 'Clear'}
            </button>
            <button
              type="button"
              onClick={activeTab === 'activities' ? loadActivities : loadPlans}
              className="text-xs font-bold px-3 py-1.5 bg-[#1D5E99] hover:bg-[#154673] text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              🔄 {isAr ? 'تحديث' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-10 text-center bg-white rounded-xl border border-[var(--line)]">
          <span className="w-6 h-6 border-2 border-[#1D5E99] border-t-transparent rounded-full animate-spin inline-block mb-2" />
          <p className="text-xs text-[var(--ink-secondary)] font-bold">
            {isAr ? 'جارٍ تحميل التقارير...' : 'Loading reports...'}
          </p>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. ACTIVITIES LIST */}
      {/* ========================================================= */}
      {!loading && activeTab === 'activities' && (
        <>
          {activities.length === 0 ? (
            <EmptyState
              title={isAr ? 'لا توجد تقارير أنشطة مسجلة' : 'No activity reports found'}
              description={
                isAr
                  ? 'لم تقم بتسجيل أي أنشطة إدارية تطابق الفلتر المحدد حتى الآن.'
                  : 'You have not submitted any manager activities matching the current filter.'
              }
              icon="📋"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {activities.map((act) => {
                const isDeleting = deletingId === act.id;
                return (
                  <div
                    key={act.id}
                    className="bg-white border border-[var(--line)] rounded-xl p-5 shadow-2xs hover:shadow-card transition-all space-y-3 relative overflow-hidden"
                  >
                    {/* Top Row: Type Badge, Date, Delete Button */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                            act.activityType === 'Visit'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : act.activityType === 'Event'
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : act.activityType === 'Training'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : act.activityType === 'Office Working'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-gray-100 text-gray-900 border border-gray-300'
                          }`}
                        >
                          {act.activityType === 'Visit' && '🚗 '}
                          {act.activityType === 'Event' && '🎪 '}
                          {act.activityType === 'Training' && '🎓 '}
                          {act.activityType === 'Office Working' && '🏢 '}
                          {act.activityType === 'Others' && '📋 '}
                          {act.activityType}
                        </span>

                        {act.activityType === 'Visit' && act.visitType && (
                          <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-[11px] font-bold text-gray-700">
                            {act.visitType === 'Double' ? `👥 Double (${act.accompaniedPerson || 'Accompanied'})` : '👤 Single'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-[var(--ink-secondary)]">
                          📅 {act.activityDate}
                        </span>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDeleteActivity(act.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors border border-transparent hover:border-red-200 cursor-pointer disabled:opacity-50"
                        >
                          {isDeleting ? '...' : (isAr ? 'حذف' : 'Delete')}
                        </button>
                      </div>
                    </div>

                    {/* Content Body Based on Activity Type */}
                    {act.activityType === 'Visit' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* AM Block Summary */}
                        <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/60 space-y-1">
                          <span className="font-bold text-amber-900 block">🌅 Morning / AM</span>
                          {act.morningHospitalName && (
                            <p className="text-[var(--ink)]">
                              <strong className="text-[var(--ink-secondary)]">{isAr ? 'المستشفى: ' : 'Hospital: '}</strong>
                              {act.morningHospitalName}
                            </p>
                          )}
                          {act.morningDoctorNames && (
                            <p className="text-[var(--ink)]">
                              <strong className="text-[var(--ink-secondary)]">{isAr ? 'الأطباء: ' : 'Doctors: '}</strong>
                              {act.morningDoctorNames}
                            </p>
                          )}
                          {act.morningSpecialty && (
                            <p className="text-[var(--ink)]">
                              <strong className="text-[var(--ink-secondary)]">{isAr ? 'التخصص: ' : 'Specialty: '}</strong>
                              {act.morningSpecialty}
                            </p>
                          )}
                          {act.morningHospitalComment && (
                            <p className="text-[var(--ink-soft)] italic mt-1 bg-white/70 p-1.5 rounded">
                              "{act.morningHospitalComment}"
                            </p>
                          )}
                        </div>

                        {/* PM Block Summary */}
                        <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-200/60 space-y-1">
                          <span className="font-bold text-indigo-900 block">🌇 Afternoon / PM</span>
                          {act.afternoonDoctorNames && (
                            <p className="text-[var(--ink)]">
                              <strong className="text-[var(--ink-secondary)]">{isAr ? 'الأطباء: ' : 'Doctors: '}</strong>
                              {act.afternoonDoctorNames}
                            </p>
                          )}
                          {act.afternoonSpecialty && (
                            <p className="text-[var(--ink)]">
                              <strong className="text-[var(--ink-secondary)]">{isAr ? 'التخصص: ' : 'Specialty: '}</strong>
                              {act.afternoonSpecialty}
                            </p>
                          )}
                          {act.afternoonPharmacyName && (
                            <p className="text-[var(--ink)]">
                              <strong className="text-[var(--ink-secondary)]">{isAr ? 'الصيدلية: ' : 'Pharmacy: '}</strong>
                              {act.afternoonPharmacyName}
                            </p>
                          )}
                          {act.afternoonDoctorComment && (
                            <p className="text-[var(--ink-soft)] italic mt-1 bg-white/70 p-1.5 rounded">
                              "{act.afternoonDoctorComment}"
                            </p>
                          )}
                        </div>

                        {/* General Comment */}
                        {act.generalComment && (
                          <div className="md:col-span-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs text-[var(--ink)]">
                            <strong className="text-[var(--ink-secondary)]">{isAr ? 'التعليق العام: ' : 'General Comment: '}</strong>
                            {act.generalComment}
                          </div>
                        )}
                      </div>
                    )}

                    {act.activityType === 'Event' && (
                      <div className="p-3 rounded-lg bg-purple-50/40 border border-purple-200/60 text-xs space-y-1">
                        <p className="text-sm font-black text-purple-950">{act.eventName}</p>
                        <p className="text-[var(--ink)]">
                          <span className="font-bold text-[var(--ink-secondary)]">{isAr ? 'النوع: ' : 'Type: '}</span>
                          {act.eventType} | <span className="font-bold text-[var(--ink-secondary)]">{isAr ? 'المكان: ' : 'Location: '}</span>
                          {act.location || '—'}
                        </p>
                        {act.attendees && (
                          <p className="text-[var(--ink)]">
                            <span className="font-bold text-[var(--ink-secondary)]">{isAr ? 'الحضور: ' : 'Attendees: '}</span>
                            {act.attendees}
                          </p>
                        )}
                        {act.budget && (
                          <p className="text-[var(--ink)]">
                            <span className="font-bold text-[var(--ink-secondary)]">{isAr ? 'الميزانية: ' : 'Budget: '}</span>
                            {act.budget}
                          </p>
                        )}
                      </div>
                    )}

                    {act.activityType === 'Training' && (
                      <div className="p-3 rounded-lg bg-amber-50/40 border border-amber-200/60 text-xs space-y-1">
                        <p className="text-sm font-black text-amber-950">{act.trainingTopic}</p>
                        <p className="text-[var(--ink)]">
                          <span className="font-bold text-[var(--ink-secondary)]">{isAr ? 'النوع: ' : 'Type: '}</span>
                          {act.trainingType} | <span className="font-bold text-[var(--ink-secondary)]">{isAr ? 'المكان: ' : 'Location: '}</span>
                          {act.trainingLocation || '—'}
                        </p>
                        {act.participants && (
                          <p className="text-[var(--ink)]">
                            <span className="font-bold text-[var(--ink-secondary)]">{isAr ? 'المشاركون: ' : 'Participants: '}</span>
                            {act.participants}
                          </p>
                        )}
                      </div>
                    )}

                    {act.activityType === 'Office Working' && (
                      <div className="p-3 rounded-lg bg-emerald-50/40 border border-emerald-200/60 text-xs space-y-1">
                        <span className="font-bold text-emerald-950 block">{isAr ? 'ملخص العمل المكتبي:' : 'Work Summary:'}</span>
                        <p className="text-[var(--ink)] whitespace-pre-wrap">{act.workSummary}</p>
                      </div>
                    )}

                    {act.activityType === 'Others' && (
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-1">
                        <span className="font-bold text-gray-900 block">{isAr ? 'الوصف:' : 'Description:'}</span>
                        <p className="text-[var(--ink)] whitespace-pre-wrap">{act.description}</p>
                      </div>
                    )}

                    {/* Notes if any */}
                    {act.notes && (
                      <p className="text-[11px] text-[var(--ink-soft)] bg-gray-50 p-2 rounded border border-dashed border-gray-200">
                        💬 {act.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* 2. WEEKLY PLANS LIST */}
      {/* ========================================================= */}
      {!loading && activeTab === 'plans' && (
        <>
          {plans.length === 0 ? (
            <EmptyState
              title={isAr ? 'لا توجد خطط أسبوعية مسجلة' : 'No weekly plans found'}
              description={
                isAr
                  ? 'لم تقم بإنشاء أي خطة عمل أسبوعية خاصة بك حتى الآن.'
                  : 'You have not submitted any personal weekly plans yet.'
              }
              icon="📅"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {plans.map((plan) => {
                const isDeleting = deletingId === plan.id;
                return (
                  <div
                    key={plan.id}
                    className="bg-white border border-[var(--line)] rounded-xl p-5 shadow-2xs hover:shadow-card transition-all space-y-3"
                  >
                    {/* Plan Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-[#5C4A1E]">
                            📅 {plan.weekLabel || `${plan.startDate} to ${plan.endDate}`}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                              plan.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {plan.status === 'Approved' ? '✓ Approved' : 'Submitted'}
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--ink-secondary)]">
                          {isAr ? 'خطة أسبوعية معتمدة للإدارة' : 'Manager personal weekly plan'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExportPlan(plan.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>📊</span>
                          <span>{isAr ? 'تصدير Excel' : 'Export Excel'}</span>
                        </button>

                        {onOpenPlan && (
                          <button
                            type="button"
                            onClick={() => onOpenPlan(plan)}
                            className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-blue-50 text-[#1D5E99] border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>✏️</span>
                            <span>{isAr ? 'عرض وتعديل' : 'View / Edit'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDeletePlan(plan.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors border border-transparent hover:border-red-200 cursor-pointer disabled:opacity-50"
                        >
                          {isDeleting ? '...' : (isAr ? 'حذف' : 'Delete')}
                        </button>
                      </div>
                    </div>

                    {/* Schedule Quick Snippet */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                      {plan.saturdayAm && (
                        <div className="p-2 bg-gray-50 rounded border border-gray-200">
                          <span className="font-bold text-[#5C4A1E] block">Sat AM:</span>
                          <span className="text-[var(--ink-secondary)]">{plan.saturdayAm}</span>
                        </div>
                      )}
                      {plan.sundayAm && (
                        <div className="p-2 bg-gray-50 rounded border border-gray-200">
                          <span className="font-bold text-[#5C4A1E] block">Sun AM:</span>
                          <span className="text-[var(--ink-secondary)]">{plan.sundayAm}</span>
                        </div>
                      )}
                      {plan.mondayAm && (
                        <div className="p-2 bg-gray-50 rounded border border-gray-200">
                          <span className="font-bold text-[#5C4A1E] block">Mon AM:</span>
                          <span className="text-[var(--ink-secondary)]">{plan.mondayAm}</span>
                        </div>
                      )}
                      {plan.tuesdayAm && (
                        <div className="p-2 bg-gray-50 rounded border border-gray-200">
                          <span className="font-bold text-[#5C4A1E] block">Tue AM:</span>
                          <span className="text-[var(--ink-secondary)]">{plan.tuesdayAm}</span>
                        </div>
                      )}
                      {plan.wednesdayAm && (
                        <div className="p-2 bg-gray-50 rounded border border-gray-200">
                          <span className="font-bold text-[#5C4A1E] block">Wed AM:</span>
                          <span className="text-[var(--ink-secondary)]">{plan.wednesdayAm}</span>
                        </div>
                      )}
                      {plan.thursdayAm && (
                        <div className="p-2 bg-gray-50 rounded border border-gray-200">
                          <span className="font-bold text-[#5C4A1E] block">Thu AM:</span>
                          <span className="text-[var(--ink-secondary)]">{plan.thursdayAm}</span>
                        </div>
                      )}
                    </div>

                    {plan.managerNotes && (
                      <div className="p-2.5 bg-amber-50/60 rounded border border-amber-200 text-xs text-amber-950">
                        <strong>{isAr ? 'ملاحظات إدارية: ' : 'Manager Notes: '}</strong>
                        {plan.managerNotes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
