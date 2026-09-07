'use client';

import React, { useState } from 'react';
import { ManagerActivityType } from '@/types';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';

interface ManagerActivityFormProps {
  currentUser?: {
    id: string;
    name: string;
    username: string;
    positionCode?: string | null;
    role?: string;
  } | null;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
  onSubmitted?: () => void;
}

export function ManagerActivityForm({
  currentUser,
  onSuccess,
  onError,
  onSubmitted,
}: ManagerActivityFormProps) {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [saving, setSaving] = useState(false);
  const [activityType, setActivityType] = useState<ManagerActivityType>('Visit');
  const [activityDate, setActivityDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Visit specific state
  const [visitType, setVisitType] = useState<'Single' | 'Double'>('Single');
  const [accompaniedPerson, setAccompaniedPerson] = useState('');

  // Visit - Morning / AM Block
  const [morningHospitalName, setMorningHospitalName] = useState('');
  const [morningDoctorNames, setMorningDoctorNames] = useState('');
  const [morningSpecialty, setMorningSpecialty] = useState('');
  const [morningHospitalComment, setMorningHospitalComment] = useState('');

  // Visit - Afternoon / PM Block
  const [afternoonDoctorNames, setAfternoonDoctorNames] = useState('');
  const [afternoonSpecialty, setAfternoonSpecialty] = useState('');
  const [afternoonDoctorComment, setAfternoonDoctorComment] = useState('');
  const [afternoonPharmacyName, setAfternoonPharmacyName] = useState('');
  const [afternoonPharmacyComment, setAfternoonPharmacyComment] = useState('');

  // Visit - General
  const [generalComment, setGeneralComment] = useState('');

  // Event specific state
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('Medical Conference');
  const [eventLocation, setEventLocation] = useState('');
  const [eventAttendees, setEventAttendees] = useState('');
  const [eventBudget, setEventBudget] = useState('');

  // Training specific state
  const [trainingTopic, setTrainingTopic] = useState('');
  const [trainingType, setTrainingType] = useState('Product Knowledge');
  const [trainingLocation, setTrainingLocation] = useState('');
  const [trainingParticipants, setTrainingParticipants] = useState('');

  // Office Working state
  const [workSummary, setWorkSummary] = useState('');

  // Others state
  const [otherDescription, setOtherDescription] = useState('');

  // Notes
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setVisitType('Single');
    setAccompaniedPerson('');
    setMorningHospitalName('');
    setMorningDoctorNames('');
    setMorningSpecialty('');
    setMorningHospitalComment('');
    setAfternoonDoctorNames('');
    setAfternoonSpecialty('');
    setAfternoonDoctorComment('');
    setAfternoonPharmacyName('');
    setAfternoonPharmacyComment('');
    setGeneralComment('');
    setEventName('');
    setEventType('Medical Conference');
    setEventLocation('');
    setEventAttendees('');
    setEventBudget('');
    setTrainingTopic('');
    setTrainingType('Product Knowledge');
    setTrainingLocation('');
    setTrainingParticipants('');
    setWorkSummary('');
    setOtherDescription('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activityDate.trim()) {
      onError?.(isAr ? 'يرجى تحديد تاريخ النشاط' : 'Activity date is required');
      return;
    }

    if (activityType === 'Visit' && visitType === 'Double' && !accompaniedPerson.trim()) {
      onError?.(isAr ? 'في الزيارة المشتركة (Double Visit) يجب تحديد الشخص المرافق' : 'Accompanied person is required for double visits');
      return;
    }

    if (activityType === 'Event' && !eventName.trim()) {
      onError?.(isAr ? 'يرجى إدخال اسم الفعالية' : 'Event name is required');
      return;
    }

    if (activityType === 'Training' && !trainingTopic.trim()) {
      onError?.(isAr ? 'يرجى إدخال موضوع التدريب' : 'Training topic is required');
      return;
    }

    if (activityType === 'Office Working' && !workSummary.trim()) {
      onError?.(isAr ? 'يرجى إدخال ملخص العمل المكتبي' : 'Work summary is required');
      return;
    }

    if (activityType === 'Others' && !otherDescription.trim()) {
      onError?.(isAr ? 'يرجى إدخال وصف النشاط' : 'Description is required');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        activityType,
        activityDate,
        notes,
      };

      if (activityType === 'Visit') {
        payload.visitType = visitType;
        payload.accompaniedPerson = visitType === 'Double' ? accompaniedPerson.trim() : '';
        payload.morningHospitalName = morningHospitalName.trim();
        payload.morningDoctorNames = morningDoctorNames.trim();
        payload.morningSpecialty = morningSpecialty.trim();
        payload.morningHospitalComment = morningHospitalComment.trim();
        payload.afternoonDoctorNames = afternoonDoctorNames.trim();
        payload.afternoonSpecialty = afternoonSpecialty.trim();
        payload.afternoonDoctorComment = afternoonDoctorComment.trim();
        payload.afternoonPharmacyName = afternoonPharmacyName.trim();
        payload.afternoonPharmacyComment = afternoonPharmacyComment.trim();
        payload.generalComment = generalComment.trim();
      } else if (activityType === 'Event') {
        payload.eventName = eventName.trim();
        payload.eventType = eventType.trim();
        payload.location = eventLocation.trim();
        payload.attendees = eventAttendees.trim();
        payload.budget = eventBudget.trim();
      } else if (activityType === 'Training') {
        payload.trainingTopic = trainingTopic.trim();
        payload.trainingType = trainingType.trim();
        payload.trainingLocation = trainingLocation.trim();
        payload.participants = trainingParticipants.trim();
      } else if (activityType === 'Office Working') {
        payload.workSummary = workSummary.trim();
      } else if (activityType === 'Others') {
        payload.description = otherDescription.trim();
      }

      const res = await fetch('/api/manager/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess?.(data.message || (isAr ? 'تم حفظ التقرير بنجاح ✓' : 'Activity report saved successfully ✓'));
        resetForm();
        onSubmitted?.();
      } else {
        onError?.(data.message || (isAr ? 'حدث خطأ أثناء حفظ التقرير' : 'Failed to save activity'));
      }
    } catch {
      onError?.(isAr ? 'حدث خطأ غير متوقع أثناء الاتصال' : 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const activityTabs: { type: ManagerActivityType; labelAr: string; labelEn: string; icon: string }[] = [
    { type: 'Visit', labelAr: 'زيارة ميدانية', labelEn: 'Visit', icon: '🚗' },
    { type: 'Event', labelAr: 'فعالية / مؤتمر', labelEn: 'Event', icon: '🎪' },
    { type: 'Training', labelAr: 'تدريب', labelEn: 'Training', icon: '🎓' },
    { type: 'Office Working', labelAr: 'عمل مكتبي', labelEn: 'Office Working', icon: '🏢' },
    { type: 'Others', labelAr: 'أخرى', labelEn: 'Others', icon: '📋' },
  ];

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-lg)] shadow-hover overflow-hidden transition-all">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#1D5E99] via-[#2A6FA8] to-[#1D5E99] text-white p-5 border-b border-[#164775]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <h2 className="text-lg md:text-xl font-black tracking-wide">
                {isAr ? 'تقرير نشاط الإدارة الميداني والمكتبي' : 'Manager Activity & Field Report'}
              </h2>
            </div>
            <p className="text-xs text-blue-100 font-medium mt-1">
              {isAr
                ? 'توثيق الزيارات الميدانية (صباحاً وبعد الظهر)، الفعاليات، التدريب، والعمل المكتبي للمديرين'
                : 'Log field visits (AM/PM blocks), events, trainings, and office work for managers'}
            </p>
          </div>
          {currentUser && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-bold text-white self-start md:self-auto backdrop-blur-xs">
              <span>👤 {currentUser.name || currentUser.username}</span>
              {currentUser.positionCode && (
                <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-black uppercase">
                  {currentUser.positionCode}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="p-5 md:p-7 space-y-6">
        {/* 1. Activity Type Selector Tabs */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-[var(--ink-secondary)] mb-2.5">
            {isAr ? 'نوع النشاط الإداري' : 'Manager Activity Type'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {activityTabs.map((tab) => {
              const isActive = activityType === tab.type;
              return (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => setActivityType(tab.type)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-gradient-to-br from-[#1D5E99] to-[#144877] text-white border-[#1D5E99] shadow-md scale-102 font-extrabold'
                      : 'bg-white hover:bg-[var(--surface-hover)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--line-strong)] font-bold'
                  }`}
                >
                  <span className="text-2xl mb-1">{tab.icon}</span>
                  <span className="text-xs md:text-sm">{isAr ? tab.labelAr : tab.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Row (Required for all activity types) */}
        <div className="bg-[var(--surface-subtle)] p-4 rounded-xl border border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📅</span>
            <label className="text-xs md:text-sm font-black text-[var(--ink)]">
              {isAr ? 'تاريخ النشاط *' : 'Activity Date *'}
            </label>
          </div>
          <input
            type="date"
            required
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            className="px-3 py-2 bg-white border border-[var(--line)] rounded-lg text-sm font-bold text-[var(--ink)] focus:outline-hidden focus:border-[#1D5E99] max-w-xs"
          />
        </div>

        {/* ========================================================= */}
        {/* 2. VISIT ACTIVITY TYPE */}
        {/* ========================================================= */}
        {activityType === 'Visit' && (
          <div className="space-y-6">
            {/* Visit Type: Single or Double */}
            <div className="bg-white p-5 rounded-xl border border-[var(--line)] shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black uppercase text-[#1D5E99] tracking-wider block mb-1">
                    {isAr ? 'نوع الزيارة' : 'Visit Type'}
                  </span>
                  <p className="text-xs text-[var(--ink-secondary)]">
                    {isAr ? 'اختر ما إذا كانت الزيارة فردية أو مشتركة' : 'Select whether single or double accompanied visit'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setVisitType('Single')}
                    className={`px-4 py-2 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer ${
                      visitType === 'Single'
                        ? 'bg-[#1D5E99] text-white shadow-xs'
                        : 'bg-[var(--surface-subtle)] text-[var(--ink)] border border-[var(--line)] hover:bg-gray-100'
                    }`}
                  >
                    👤 {isAr ? 'فردية (Single)' : 'Single'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitType('Double')}
                    className={`px-4 py-2 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer ${
                      visitType === 'Double'
                        ? 'bg-[#1D5E99] text-white shadow-xs'
                        : 'bg-[var(--surface-subtle)] text-[var(--ink)] border border-[var(--line)] hover:bg-gray-100'
                    }`}
                  >
                    👥 {isAr ? 'مشتركة (Double)' : 'Double'}
                  </button>
                </div>
              </div>

              {/* If Double: Require Accompanied Person */}
              {visitType === 'Double' && (
                <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 animate-fade-in">
                  <label className="block text-xs font-black text-blue-900 mb-1.5">
                    {isAr ? 'الشخص المرافق * (مطلوب)' : 'Accompanied Person * (Required)'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'أدخل اسم المندوب أو المدير المرافق...' : 'Enter accompanied rep or manager name...'}
                    value={accompaniedPerson}
                    onChange={(e) => setAccompaniedPerson(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-lg text-sm font-bold text-[var(--ink)] focus:outline-hidden focus:border-[#1D5E99]"
                  />
                </div>
              )}
            </div>

            {/* MORNING / AM BLOCK */}
            <div className="bg-gradient-to-b from-amber-50/40 to-white p-5 rounded-xl border border-amber-200/70 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-amber-200/60 pb-3">
                <span className="text-xl">🌅</span>
                <div>
                  <h3 className="text-sm font-black text-[#6B5726] uppercase tracking-wide">
                    {isAr ? 'الفترة الصباحية (MORNING / AM BLOCK)' : 'MORNING / AM BLOCK'}
                  </h3>
                  <span className="text-[11px] text-[#8C7338]">
                    {isAr ? 'زيارات المستشفيات والأطباء الصباحية' : 'Hospital visits, doctors visited & specialty'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                    {isAr ? 'اسم المستشفى (Hospital Name)' : 'Hospital Name'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'اسم المستشفى أو المركز الطبي...' : 'e.g. Al-Salam International Hospital...'}
                    value={morningHospitalName}
                    onChange={(e) => setMorningHospitalName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                    {isAr ? 'التخصص (Specialty)' : 'Specialty'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'مثل: باطنة، أورام، جراحة...' : 'e.g. Internal Medicine, Oncology, Surgery...'}
                    value={morningSpecialty}
                    onChange={(e) => setMorningSpecialty(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                  {isAr ? 'أسماء الأطباء الذين تمت زيارتهم (Doctors Names Visited)' : 'Doctors Names Visited'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'د. فلان، د. فلانة...' : 'e.g. Dr. Ahmed Samir, Dr. Hoda Ali...'}
                  value={morningDoctorNames}
                  onChange={(e) => setMorningDoctorNames(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                  {isAr ? 'تعليق / ملاحظات المستشفى (Comment / Hospital)' : 'Comment / Hospital'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isAr ? 'ملاحظات حول المستشفى، الأقسام، أو الصيدلية الداخلية...' : 'Notes regarding hospital, departments, or formulary...'}
                  value={morningHospitalComment}
                  onChange={(e) => setMorningHospitalComment(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-amber-600 resize-y"
                />
              </div>
            </div>

            {/* AFTERNOON / PM BLOCK */}
            <div className="bg-gradient-to-b from-indigo-50/40 to-white p-5 rounded-xl border border-indigo-200/70 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-indigo-200/60 pb-3">
                <span className="text-xl">🌇</span>
                <div>
                  <h3 className="text-sm font-black text-[#2A4375] uppercase tracking-wide">
                    {isAr ? 'فترة بعد الظهر (AFTERNOON / PM BLOCK)' : 'AFTERNOON / PM BLOCK'}
                  </h3>
                  <span className="text-[11px] text-[#425F9C]">
                    {isAr ? 'زيارات العيادات الخاصة، الصيدليات، والمراكز المسائية' : 'Private clinics, specialty, doctor feedback & pharmacies'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                    {isAr ? 'أسماء الأطباء (Doctors Names)' : 'Doctors Names'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'أسماء أطباء العيادات المسائية...' : 'Evening clinic doctors...'}
                    value={afternoonDoctorNames}
                    onChange={(e) => setAfternoonDoctorNames(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-[#2A4375]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                    {isAr ? 'التخصص (Specialty)' : 'Specialty'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'التخصص الطبي...' : 'Medical specialty...'}
                    value={afternoonSpecialty}
                    onChange={(e) => setAfternoonSpecialty(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-[#2A4375]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                  {isAr ? 'تعليق / ملاحظات الطبيب (Comment / Doctor)' : 'Comment / Doctor'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isAr ? 'ملاحظات حول ردود فعل الأطباء وتفضيلاتهم...' : 'Doctor feedback, prescriptions, product responses...'}
                  value={afternoonDoctorComment}
                  onChange={(e) => setAfternoonDoctorComment(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-[#2A4375] resize-y"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-indigo-100">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                    {isAr ? 'الصيدلية (Pharmacy)' : 'Pharmacy'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'اسم الصيدلية المزارة...' : 'Pharmacy name visited...'}
                    value={afternoonPharmacyName}
                    onChange={(e) => setAfternoonPharmacyName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-[#2A4375]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                    {isAr ? 'تعليق / ملاحظات الصيدلية (Comment / Pharmacy)' : 'Comment / Pharmacy'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'توافر الأصناف، حركة البيع، النواقص...' : 'Stock availability, sales movement, shortages...'}
                    value={afternoonPharmacyComment}
                    onChange={(e) => setAfternoonPharmacyComment(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-[#2A4375]"
                  />
                </div>
              </div>
            </div>

            {/* GENERAL COMMENT BLOCK */}
            <div className="bg-white p-5 rounded-xl border border-[var(--line)] shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">📝</span>
                <label className="text-xs font-black uppercase text-[var(--ink)]">
                  {isAr ? 'التعليق العام لليوم (General Comment / Day)' : 'General Comment / Day'}
                </label>
              </div>
              <textarea
                rows={3}
                placeholder={isAr ? 'ملخص عام لمجريات اليوم الميداني، التحديات، والتوصيات...' : 'Overall summary of the field day, market findings, recommendations...'}
                value={generalComment}
                onChange={(e) => setGeneralComment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-[#1D5E99] resize-y"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. EVENT ACTIVITY TYPE */}
        {/* ========================================================= */}
        {activityType === 'Event' && (
          <div className="bg-white p-5 md:p-6 rounded-xl border border-[var(--line)] shadow-2xs space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
              <span className="text-2xl">🎪</span>
              <div>
                <h3 className="text-sm font-black text-[var(--ink)]">
                  {isAr ? 'بيانات الفعالية / المؤتمر (Event Details)' : 'Event Details'}
                </h3>
                <span className="text-xs text-[var(--ink-secondary)]">
                  {isAr ? 'توثيق المؤتمرات والندوات واللقاءات العلمية' : 'Capture scientific meetings, symposiums and conferences'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-[var(--ink)] mb-1.5">
                  {isAr ? 'اسم الفعالية * (مطلوب)' : 'Event Name / Title * (Required)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'اسم المؤتمر أو الحدث الطبي...' : 'e.g. Annual Cardiology Conference...'}
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-bold text-[var(--ink)] focus:outline-hidden focus:border-[#1D5E99]"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[var(--ink)] mb-1.5">
                  {isAr ? 'نوع الفعالية' : 'Event Type'}
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-bold text-[var(--ink)] focus:outline-hidden focus:border-[#1D5E99]"
                >
                  <option value="Medical Conference">{isAr ? 'مؤتمر طبي (Medical Conference)' : 'Medical Conference'}</option>
                  <option value="Symposium">{isAr ? 'ندوة علمية (Symposium)' : 'Symposium'}</option>
                  <option value="Roundtable">{isAr ? 'طاولة مستديرة (Roundtable)' : 'Roundtable'}</option>
                  <option value="Booth / Exhibition">{isAr ? 'جناح / معرض (Booth / Exhibition)' : 'Booth / Exhibition'}</option>
                  <option value="Product Launch">{isAr ? 'إطلاق منتج (Product Launch)' : 'Product Launch'}</option>
                  <option value="Advisory Board">{isAr ? 'مجلس استشاري (Advisory Board)' : 'Advisory Board'}</option>
                  <option value="Other">{isAr ? 'أخرى (Other)' : 'Other'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                  {isAr ? 'المكان / القاعة (Location)' : 'Location'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'اسم الفندق أو المركز أو القاعة...' : 'e.g. Semiramis InterContinental Cairo...'}
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-[#1D5E99]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                  {isAr ? 'الحضور المستهدف / العدد (Attendees)' : 'Attendees'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'عدد الحضور وتخصصاتهم...' : 'e.g. 45 Cardiologists & Key Opinion Leaders...'}
                  value={eventAttendees}
                  onChange={(e) => setEventAttendees(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-[#1D5E99]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                  {isAr ? 'الميزانية أو التكلفة التقريبية (Budget)' : 'Budget / Costs'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'الميزانية المخصصة أو المصروفات...' : 'Allocated budget or expenses...'}
                  value={eventBudget}
                  onChange={(e) => setEventBudget(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-[#1D5E99]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. TRAINING ACTIVITY TYPE */}
        {/* ========================================================= */}
        {activityType === 'Training' && (
          <div className="bg-white p-5 md:p-6 rounded-xl border border-[var(--line)] shadow-2xs space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
              <span className="text-2xl">🎓</span>
              <div>
                <h3 className="text-sm font-black text-[var(--ink)]">
                  {isAr ? 'بيانات التدريب (Training Details)' : 'Training Details'}
                </h3>
                <span className="text-xs text-[var(--ink-secondary)]">
                  {isAr ? 'تدريب الفريق، ورش العمل العلمية، وبرامج التطوير الميداني' : 'Team coaching, product knowledge, and developmental workshops'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-[var(--ink)] mb-1.5">
                  {isAr ? 'موضوع التدريب * (مطلوب)' : 'Training Topic * (Required)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'موضوع الدورة أو ورشة العمل التدريبية...' : 'e.g. New Molecule Indications & Field Objections...'}
                  value={trainingTopic}
                  onChange={(e) => setTrainingTopic(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-bold text-[var(--ink)] focus:outline-hidden focus:border-[#1D5E99]"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[var(--ink)] mb-1.5">
                  {isAr ? 'نوع التدريب' : 'Training Type'}
                </label>
                <select
                  value={trainingType}
                  onChange={(e) => setTrainingType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-bold text-[var(--ink)] focus:outline-hidden focus:border-[#1D5E99]"
                >
                  <option value="Product Knowledge">{isAr ? 'معرفة بالمنتجات (Product Knowledge)' : 'Product Knowledge'}</option>
                  <option value="Scientific Workshop">{isAr ? 'ورشة عمل علمية (Scientific Workshop)' : 'Scientific Workshop'}</option>
                  <option value="Selling Skills">{isAr ? 'مهارات بيعية وتفاوض (Selling Skills)' : 'Selling Skills'}</option>
                  <option value="Field Coaching">{isAr ? 'تدريب ميداني وتوجيه (Field Coaching)' : 'Field Coaching'}</option>
                  <option value="Leadership & Management">{isAr ? 'قيادة وإدارة (Leadership & Management)' : 'Leadership & Management'}</option>
                  <option value="Other">{isAr ? 'أخرى (Other)' : 'Other'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                  {isAr ? 'مكان التدريب (Location)' : 'Training Location'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'المقر الرئيسي، قاعة خارجية، أونلاين...' : 'Head office, conference room, online...'}
                  value={trainingLocation}
                  onChange={(e) => setTrainingLocation(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-[#1D5E99]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                  {isAr ? 'المشاركون / الحضور (Participants)' : 'Participants'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'أسماء المتدربين أو الفريق المستهدف...' : 'Names of trainees or target sales reps...'}
                  value={trainingParticipants}
                  onChange={(e) => setTrainingParticipants(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-[#1D5E99]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. OFFICE WORKING ACTIVITY TYPE */}
        {/* ========================================================= */}
        {activityType === 'Office Working' && (
          <div className="bg-white p-5 md:p-6 rounded-xl border border-[var(--line)] shadow-2xs space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
              <span className="text-2xl">🏢</span>
              <div>
                <h3 className="text-sm font-black text-[var(--ink)]">
                  {isAr ? 'بيانات العمل المكتبي والإداري (Office Working)' : 'Office Working Summary'}
                </h3>
                <span className="text-xs text-[var(--ink-secondary)]">
                  {isAr ? 'ملخص المهام الإدارية، التحليلات، الاجتماعات الداخلية، ومراجعة الخطط' : 'Capture administrative tasks, data reviews, plan approvals and office meetings'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[var(--ink)] mb-1.5">
                {isAr ? 'ملخص العمل المكتبي * (مطلوب)' : 'Work Summary * (Required)'}
              </label>
              <textarea
                rows={4}
                required
                placeholder={isAr ? 'سجل تفاصيل المهام الإدارية والتحليلية والاجتماعات المنفذة خلال اليوم...' : 'Summary of internal meetings, report reviews, strategic planning, or operational tasks...'}
                value={workSummary}
                onChange={(e) => setWorkSummary(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-[#1D5E99] resize-y"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. OTHERS ACTIVITY TYPE */}
        {/* ========================================================= */}
        {activityType === 'Others' && (
          <div className="bg-white p-5 md:p-6 rounded-xl border border-[var(--line)] shadow-2xs space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
              <span className="text-2xl">📋</span>
              <div>
                <h3 className="text-sm font-black text-[var(--ink)]">
                  {isAr ? 'نشاط إداري آخر (Other Activity)' : 'Other Activity'}
                </h3>
                <span className="text-xs text-[var(--ink-secondary)]">
                  {isAr ? 'أي نشاط إداري لا يندرج تحت التصنيفات السابقة' : 'Any custom or special managerial activity'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[var(--ink)] mb-1.5">
                {isAr ? 'وصف النشاط * (مطلوب)' : 'Description * (Required)'}
              </label>
              <textarea
                rows={4}
                required
                placeholder={isAr ? 'تفاصيل النشاط أو المهمة المنفذة...' : 'Detailed description of the activity or special mission...'}
                value={otherDescription}
                onChange={(e) => setOtherDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-[#1D5E99] resize-y"
              />
            </div>
          </div>
        )}

        {/* Notes (Universal across all types) */}
        <div className="bg-[var(--surface-subtle)] p-4 rounded-xl border border-[var(--line)]">
          <label className="block text-xs font-black text-[var(--ink-secondary)] mb-1.5 uppercase tracking-wider">
            {isAr ? 'ملاحظات إضافية (اختياري)' : 'Additional Notes (Optional)'}
          </label>
          <textarea
            rows={2}
            placeholder={isAr ? 'أي ملاحظات إضافية تريد إرفاقها بهذا النشاط...' : 'Any additional comments or notes...'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-[var(--line)] rounded-lg text-xs md:text-sm font-medium text-[var(--ink)] focus:outline-hidden focus:border-[#1D5E99] resize-y"
          />
        </div>

        {/* Submit and Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={resetForm}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--line)] text-xs md:text-sm font-bold text-[var(--ink-secondary)] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {isAr ? 'إعادة تعيين الحقول' : 'Reset Form'}
          </button>
          <Button
            type="submit"
            isLoading={saving}
            size="md"
            className="w-full sm:w-auto !bg-gradient-to-r !from-[#1D5E99] !to-[#144877] !hover:from-[#154673] !hover:to-[#0F3558] text-white shadow-sm font-extrabold px-6"
          >
            ✓ {isAr ? 'حفظ تقرير النشاط' : 'Submit Activity Report'}
          </Button>
        </div>
      </form>
    </div>
  );
}
