'use client';

import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, CheckCircle, Info, X, ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/lib/i18nContext';
import { getReportingWindowStatus, type ReportingWindowStatus } from '@/lib/business/reportingWindow';

function getStyleConfig(urgency: 'normal' | 'warning' | 'urgent') {
  if (urgency === 'urgent') {
    return {
      container: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/15',
      dot: 'bg-rose-500 animate-ping',
      dotSolid: 'bg-rose-600',
      badge: 'bg-rose-500 text-white',
      text: 'text-rose-700 dark:text-rose-300',
      isUrgent: true,
    };
  }
  if (urgency === 'warning') {
    return {
      container: 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200 hover:bg-amber-500/15',
      dot: 'bg-amber-500 animate-pulse',
      dotSolid: 'bg-amber-600',
      badge: 'bg-amber-500 text-white',
      text: 'text-amber-800 dark:text-amber-200',
      isUrgent: false,
    };
  }
  return {
    container: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/15',
    dot: 'bg-emerald-500',
    dotSolid: 'bg-emerald-600',
    badge: 'bg-emerald-500 text-white',
    text: 'text-emerald-800 dark:text-emerald-200',
    isUrgent: false,
  };
}

export function ReportingTimer() {
  const { language } = useTranslation();
  const ar = language === 'ar';

  // Guaranteed non-null initial state - no hook order violation
  const [status, setStatus] = useState<ReportingWindowStatus>(() => getReportingWindowStatus());
  const [showModal, setShowModal] = useState(false);

  // Live 1-second interval ticker
  useEffect(() => {
    // Initial calculate to synchronize with client clock immediately
    setStatus(getReportingWindowStatus());

    const interval = setInterval(() => {
      setStatus(getReportingWindowStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const { urgency, formattedCountdown, isMorningGracePeriod, cairo, activeDeadlineLabel } = status;
  const styleConfig = getStyleConfig(urgency);

  return (
    <>
      {/* Top Header Timer Trigger Pill */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        title={ar ? 'اضغط لعرض تفاصيل مهلة تسجيل التقارير وسياسة الإغلاق' : 'Click to view reporting deadline details and policy'}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer select-none ${styleConfig.container}`}
      >
        {/* Animated Beacon Dot */}
        <span className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${styleConfig.dot}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${styleConfig.dotSolid}`} />
        </span>

        {styleConfig.isUrgent ? (
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 animate-bounce" />
        ) : (
          <Clock className="w-3.5 h-3.5" />
        )}

        {/* Dynamic Context Label */}
        <span className="hidden sm:inline-block font-semibold">
          {ar ? activeDeadlineLabel.ar : activeDeadlineLabel.en}:
        </span>

        {/* Digital Monospace Countdown */}
        <span className="font-mono font-black tracking-wider px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-xs sm:text-sm">
          {formattedCountdown}
        </span>

        <Info className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Detailed Modal / Popover */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in text-[var(--ink)]"
            onClick={(e) => e.stopPropagation()}
            dir={ar ? 'rtl' : 'ltr'}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-2xl ${styleConfig.container}`}>
                  <Clock className="w-5 h-5 text-[var(--gold-dark)]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--ink)]">
                    {ar ? 'مؤقت مهلة تسجيل التقارير والأنشطة' : 'Reporting & Activity Submission Timer'}
                  </h3>
                  <p className="text-xs text-[var(--ink-soft)] font-medium">
                    {ar ? 'بتوقيت القاهرة (Africa/Cairo)' : 'Timezone: Africa/Cairo'} · {cairo.timeStr}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Policy Box */}
            <div className="bg-[var(--gold-tint)] border border-[var(--gold-border)] rounded-2xl p-4 space-y-2 text-xs text-[var(--ink)]">
              <div className="flex items-center gap-2 font-bold text-[var(--gold-dark)]">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{ar ? 'قاعدة تسجيل وإرسال البيانات المعتمدة' : 'Authoritative Reporting Submission Policy'}</span>
              </div>
              <p className="leading-relaxed font-medium">
                {ar
                  ? 'يتم تسجيل جميع التقارير في "تسجيل الزيارة" (Submit visit) للمندوبين و"تسجيل النشاط" (Submit Activity) للمديرين بحد أقصى اليوم التالي الساعة 9:00 صباحاً (فترة السماح من 12:00 ص حتى 9:00 ص).'
                  : 'All reporting in "Submit visit" for MRs and "Submit Activity" for Managers must be submitted at the latest by 9:00 AM the next day (grace period from 12:00 AM to 9:00 AM).'}
              </p>
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                {ar
                  ? '⚠️ بعد هذا الوقت (9:00 صباحاً) لا يقبل النظام أي تقارير عن الأيام السابقة ويتم إغلاق التسجيل تلقائياً.'
                  : '⚠️ After this time (9:00 AM), the system will NOT accept reporting for previous days and submission is automatically locked.'}
              </p>
            </div>

            {/* Current Status Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Yesterday Status */}
              <div className="border border-[var(--line)] bg-[var(--surface-muted)] rounded-2xl p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-[var(--ink-soft)]">
                  {ar ? 'تقارير يوم الأمس' : "Yesterday's Reports"} ({status.yesterdayDate})
                </div>
                <div className="flex items-center gap-2">
                  {isMorningGracePeriod ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-black text-emerald-600">
                        {ar ? 'متاح حتى 9:00 ص' : 'Open until 9:00 AM'}
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-black text-rose-600">
                        {ar ? 'مغلق (انتهت المهلة 9:00 ص)' : 'Closed (Past 9:00 AM)'}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-[var(--ink-soft)] leading-tight">
                  {isMorningGracePeriod
                    ? (ar ? `متبقي ${formattedCountdown} قبل إغلاق تقارير الأمس نهائياً` : `${formattedCountdown} left before yesterday's reports lock permanently`)
                    : (ar ? 'لا يقبل النظام تسجيل زيارات ليوم الأمس بعد الساعة 9:00 صباحاً' : 'System does not accept visits for yesterday past 9:00 AM')}
                </p>
              </div>

              {/* Today Status */}
              <div className="border border-[var(--line)] bg-[var(--surface-muted)] rounded-2xl p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-[var(--ink-soft)]">
                  {ar ? 'تقارير اليوم' : "Today's Reports"} ({status.todayDate})
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black text-emerald-600">
                    {ar ? 'متاح للتسجيل' : 'Active & Open'}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ink-soft)] leading-tight">
                  {isMorningGracePeriod
                    ? (ar ? 'يمكنك تسجيل تقارير اليوم طوال اليوم وحتى غداً 9:00 ص' : 'You can report today all day and until tomorrow 9:00 AM')
                    : (ar ? `مهلة التقديم حتى غداً 9:00 صباحاً (متبقي ${formattedCountdown})` : `Open until tomorrow 9:00 AM (${formattedCountdown} left)`)}
                </p>
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white text-xs font-bold shadow-xs hover:brightness-105 transition-all cursor-pointer"
              >
                {ar ? 'فهمت ذلك' : 'Understood'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
