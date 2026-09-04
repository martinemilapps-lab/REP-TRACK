'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DOCTOR_CLASSES, OUR_PRODUCTS_DISCUSSED_LIST, VISIT_STATUS_OPTIONS, PRESCRIPTION_RATE_OPTIONS } from '@/lib/constants';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { MasterNameCombobox } from '@/components/reports/MasterNameCombobox';
import { VisitObjectiveSelect } from '@/components/reports/VisitObjectiveSelect';
import { MasterDoctor } from '@/types';

interface DoctorFormProps {
  selectedRep: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function addDaysToDate(dateStr: string, days: number): string {
  if (!dateStr || isNaN(days) || days <= 0) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function getDaysBetween(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  try {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diff = end.getTime() - start.getTime();
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  } catch {
    return 0;
  }
}

export function DoctorForm({ selectedRep, onSuccess, onError }: DoctorFormProps) {
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [savedDoctors, setSavedDoctors] = useState<MasterDoctor[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');

  const initialToday = getTodayString();
  const initialNext = addDaysToDate(initialToday, 7);

  const [formData, setFormData] = useState({
    objective: '',
    code: '',
    name: '',
    specialty: '',
    workplace: '',
    area: '',
    mobile: '',
    cls: 'A',
    prescriptionRate: 'Awareness',
    nearbyPharmacy: '',
    visitDate: initialToday,
    cycle: 7,
    nextVisit: initialNext,
    status: 'Visited',
    visitType: 'Single',
    companion: '',
    f1: '',
    f2: '',
    f3: '',
    reminder: '',
    notes: '',
  });

  const draftKey = `rep_track_doctor_draft_${selectedRep || 'guest'}`;

  // Fetch saved master doctors for representative
  useEffect(() => {
    async function fetchMasterDoctors() {
      try {
        const url = selectedRep ? `/api/lists?rep=${encodeURIComponent(selectedRep)}` : '/api/lists';
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok && data.success && data.data?.doctors) {
          setSavedDoctors(data.data.doctors);
        }
      } catch {
        // ignore
      }
    }
    fetchMasterDoctors();
  }, [selectedRep]);

  // Load draft from localStorage
  useEffect(() => {
    if (!selectedRep) return;
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          visitDate: parsed.visitDate || initialToday,
          cycle: parsed.cycle !== undefined ? parsed.cycle : 7,
          nextVisit:
            parsed.nextVisit || addDaysToDate(parsed.visitDate || initialToday, parsed.cycle || 7),
        }));
        setDraftRestored(true);
      } else {
        setDraftRestored(false);
      }
    } catch {
      // ignore
    }
  }, [selectedRep, draftKey, initialToday]);

  const saveDraft = useCallback(
    (data: typeof formData) => {
      if (!selectedRep) return;
      try {
        localStorage.setItem(draftKey, JSON.stringify(data));
      } catch {
        // ignore
      }
    },
    [selectedRep, draftKey]
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [id]: value };
      saveDraft(next);
      return next;
    });
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [id]: value };
      saveDraft(next);
      return next;
    });
  };

  // Two-way automatic calculations for dates and cycle
  const handleVisitDateChange = (newDate: string) => {
    setFormData((prev) => {
      const newNext = prev.cycle > 0 ? addDaysToDate(newDate, prev.cycle) : prev.nextVisit;
      const next = { ...prev, visitDate: newDate, nextVisit: newNext };
      saveDraft(next);
      return next;
    });
  };

  const handleCycleChange = (newCycleVal: number) => {
    const safeCycle = isNaN(newCycleVal) || newCycleVal < 0 ? 0 : newCycleVal;
    setFormData((prev) => {
      const newNext =
        prev.visitDate && safeCycle > 0 ? addDaysToDate(prev.visitDate, safeCycle) : prev.nextVisit;
      const next = { ...prev, cycle: safeCycle, nextVisit: newNext };
      saveDraft(next);
      return next;
    });
  };

  const handleNextVisitChange = (newNextDate: string) => {
    setFormData((prev) => {
      let nextCycle = prev.cycle;
      if (prev.visitDate && newNextDate) {
        const daysDiff = getDaysBetween(prev.visitDate, newNextDate);
        if (daysDiff > 0) {
          nextCycle = daysDiff;
        }
      }
      const next = { ...prev, nextVisit: newNextDate, cycle: nextCycle };
      saveDraft(next);
      return next;
    });
  };

  // Auto-fill from selected master doctor
  const handleSelectMasterDoctor = (doc: MasterDoctor) => {
    setSelectedMasterId(doc.id);
    const products = doc.targetProducts ? doc.targetProducts.split(',').map((p) => p.trim()) : [];
    setFormData((prev) => {
      const nextCycle =
        doc.defaultCycle !== undefined && !isNaN(Number(doc.defaultCycle)) && Number(doc.defaultCycle) > 0
          ? Number(doc.defaultCycle)
          : prev.cycle;
      const next = {
        ...prev,
        name: doc.name,
        code: doc.code || prev.code,
        specialty: doc.specialty || prev.specialty,
        workplace: doc.workplace || prev.workplace,
        area: doc.area || prev.area,
        mobile: doc.mobile || prev.mobile,
        cls: doc.classification || prev.cls,
        cycle: nextCycle,
        nextVisit: prev.visitDate
          ? addDaysToDate(prev.visitDate, nextCycle)
          : addDaysToDate(initialToday, nextCycle),
        f1: products[0] || prev.f1,
        f2: products[1] || prev.f2,
        f3: products[2] || prev.f3,
        reminder: products[3] || prev.reminder,
      };
      saveDraft(next);
      return next;
    });
  };

  const handleClearMasterDoctor = () => {
    setSelectedMasterId('');
  };

  const handleClearDraft = () => {
    setSelectedMasterId('');
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
    const today = getTodayString();
    setFormData({
      objective: '',
      code: '',
      name: '',
      specialty: '',
      workplace: '',
      area: '',
      mobile: '',
      cls: 'A',
      prescriptionRate: 'Awareness',
      nearbyPharmacy: '',
      visitDate: today,
      cycle: 7,
      nextVisit: addDaysToDate(today, 7),
      status: 'Visited',
      visitType: 'Single',
      companion: '',
      f1: '',
      f2: '',
      f3: '',
      reminder: '',
      notes: '',
    });
    setDraftRestored(false);
  };

  const classOptions: SelectOption[] = DOCTOR_CLASSES.map((c) => ({
    value: c,
    label: `Class ${c}`,
  }));

  const prescriptionRateOptions: SelectOption[] = PRESCRIPTION_RATE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: language === 'ar' ? opt.labelAr : opt.labelEn,
  }));

  const productOptions: SelectOption[] = [
    { value: '', label: '-- بدون اختيار --' },
    ...OUR_PRODUCTS_DISCUSSED_LIST.map((p) => ({ value: p, label: p })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRep) {
      onError(t('msg.requiredRep'));
      return;
    }
    if (!formData.name.trim()) {
      onError(t('form.doctorName'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reports/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, rep: selectedRep }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.message || t('msg.visitSaved'));
        setSelectedMasterId('');
        try {
          localStorage.removeItem(draftKey);
        } catch {
          // ignore
        }
        const today = getTodayString();
        setFormData({
          objective: '',
          code: '',
          name: '',
          specialty: '',
          workplace: '',
          area: '',
          mobile: '',
          cls: 'A',
          prescriptionRate: 'Awareness',
          nearbyPharmacy: '',
          visitDate: today,
          cycle: 7,
          nextVisit: addDaysToDate(today, 7),
          status: 'Visited',
          visitType: 'Single',
          companion: '',
          f1: '',
          f2: '',
          f3: '',
          reminder: '',
          notes: '',
        });
        setDraftRestored(false);
      } else {
        onError(data.message || t('msg.errorGeneric'));
      }
    } catch {
      onError(t('msg.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 md:p-6 mb-6 shadow-card animate-fade-in"
    >
      {/* Header Banner & Draft Controls */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--line)] flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xl">🩺</span>
          <div>
            <h2 className="text-base font-extrabold text-[var(--ink)]">
              {t('activity.doctor')} — {t('nav.submit')}
            </h2>
            <p className="text-[11px] text-[var(--ink-muted)]">
              {language === 'ar'
                ? 'توثيق زيارات الأطباء في العيادات والمراكز وتحديد منتجات الترويج'
                : 'Document clinic doctor visits, specialties, and promoted products'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {draftRestored && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-full flex items-center gap-1 shadow-2xs">
              <span>💾</span>
              <span>{language === 'ar' ? 'تم استرجاع المسودة' : 'Draft Restored'}</span>
            </span>
          )}
          {(formData.name || formData.specialty || formData.workplace || formData.objective) && (
            <button
              type="button"
              onClick={handleClearDraft}
              className="text-[10px] text-gray-500 hover:text-red-700 hover:underline cursor-pointer transition-colors"
            >
              {language === 'ar' ? 'مسح المسودة' : 'Clear Form'}
            </button>
          )}
        </div>
      </div>

      {/* 1. Visit Objective (هدف الزيارة) - Multi-Select Field Objectives List */}
      <VisitObjectiveSelect
        section="doctor"
        value={formData.objective}
        onChange={(val) => handleSelectChange('objective', val)}
        isMulti={true}
      />

      {/* Visit Nature (Single vs Double) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 md:p-3.5 bg-[var(--surface-subtle)]/60 rounded-xl border border-[var(--line)]">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-extrabold text-[var(--ink)]">{t('visit.type')} *</span>
          <div className="inline-flex rounded-xl p-1 bg-white border border-[var(--line)] shadow-2xs gap-1">
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => {
                  const next = { ...prev, visitType: 'Single', companion: '' };
                  saveDraft(next);
                  return next;
                });
              }}
              className={`py-1.5 px-3 rounded-lg text-xs md:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                formData.visitType === 'Single'
                  ? 'bg-white text-[var(--gold-dark)] border border-[var(--gold)] shadow-xs'
                  : 'bg-transparent text-[var(--ink-soft)] hover:bg-gray-100'
              }`}
            >
              <span>👤</span>
              <span>{t('visit.single')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => {
                  const next = { ...prev, visitType: 'Double' };
                  saveDraft(next);
                  return next;
                });
              }}
              className={`py-1.5 px-3 rounded-lg text-xs md:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                formData.visitType === 'Double'
                  ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-xs'
                  : 'bg-transparent text-[var(--ink-soft)] hover:bg-gray-100'
              }`}
            >
              <span>👥</span>
              <span>{t('visit.double')}</span>
            </button>
          </div>
        </div>

        {formData.visitType === 'Double' && (
          <div className="flex items-center gap-2 flex-1 min-w-[240px] animate-fade-in">
            <label className="text-xs font-bold text-[var(--ink-secondary)] whitespace-nowrap">
              {t('visit.companion')}:
            </label>
            <input
              type="text"
              id="companion"
              value={formData.companion}
              onChange={handleChange}
              placeholder={t('visit.companionPlaceholder')}
              className="w-full text-xs bg-white border border-[var(--line)] rounded-xl p-2 font-medium outline-none focus:border-[var(--gold)]"
            />
          </div>
        )}
      </div>

      {/* Main Grid Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {/* Doctor Name - Integrated Combobox from My Lists */}
        <MasterNameCombobox<MasterDoctor>
          id="name"
          label={t('form.doctorName')}
          placeholder="مثال: د. حسام فوزي"
          value={formData.name}
          onChange={(val) => {
            setFormData((prev) => {
              const next = { ...prev, name: val };
              saveDraft(next);
              return next;
            });
            setSelectedMasterId('');
          }}
          items={savedDoctors}
          getItemName={(d) => d.name}
          getItemSublabel={(d) =>
            [d.specialty, d.area, d.workplace].filter(Boolean).join(' • ')
          }
          getItemBadge={(d) => (d.classification ? `Class ${d.classification}` : '')}
          onSelectItem={handleSelectMasterDoctor}
          selectedMasterId={selectedMasterId}
          onClearSelection={handleClearMasterDoctor}
          required
        />

        {/* Doctor Code */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.code')}
          </label>
          <input
            id="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="كود الطبيب إن وجد..."
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-mono outline-none"
          />
        </div>

        {/* Specialty */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.specialty')}
          </label>
          <input
            id="specialty"
            value={formData.specialty}
            onChange={handleChange}
            placeholder="مثال: باطنة / قلب / عظام"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-medium outline-none"
          />
        </div>

        {/* Workplace / Clinic */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.workplace')}
          </label>
          <input
            id="workplace"
            value={formData.workplace}
            onChange={handleChange}
            placeholder="اسم العيادة أو المستشفى..."
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-medium outline-none"
          />
        </div>

        {/* Nearby Pharmacy (الصيدلية القريبة) */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5 flex items-center justify-between">
            <span>{t('form.nearbyPharmacy')}</span>
            <span className="text-[10px] text-[var(--gold-deep)] bg-[var(--gold-tint)] px-1.5 py-0.5 rounded font-bold">
              💊 Pharmacy
            </span>
          </label>
          <input
            id="nearbyPharmacy"
            value={formData.nearbyPharmacy}
            onChange={handleChange}
            placeholder="اسم الصيدلية القريبة من العيادة..."
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-medium outline-none"
          />
        </div>

        {/* Area / Region */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.area')}
          </label>
          <input
            id="area"
            value={formData.area}
            onChange={handleChange}
            placeholder="المنطقة أو الحي..."
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-medium outline-none"
          />
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.mobile')}
          </label>
          <input
            id="mobile"
            type="tel"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="01xxxxxxxxx"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-mono outline-none"
          />
        </div>

        {/* Classification */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.class')}
          </label>
          <CustomSelect
            options={classOptions}
            value={formData.cls}
            onChange={(val) => handleSelectChange('cls', val)}
          />
        </div>

        {/* Prescriptions Rate (معدل كتابة الروشتات) */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5 flex items-center justify-between">
            <span>{t('form.prescriptionRate')}</span>
            <span className="text-[10px] font-bold text-[var(--gold-deep)] bg-[var(--gold-tint)] px-1.5 py-0.5 rounded">
              Rx Rate
            </span>
          </label>
          <CustomSelect
            options={prescriptionRateOptions}
            value={formData.prescriptionRate}
            onChange={(val) => handleSelectChange('prescriptionRate', val)}
          />
        </div>

        {/* Visit Cycle (Days) - Auto Calculated & Editable */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5 flex items-center justify-between">
            <span>{t('form.cycle')}</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
              🔄 {language === 'ar' ? 'تلقائي' : 'Auto'}
            </span>
          </label>
          <input
            id="cycle"
            type="number"
            min="0"
            value={formData.cycle || ''}
            onChange={(e) => handleCycleChange(parseInt(e.target.value, 10))}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-mono outline-none"
          />
        </div>

        {/* Visit Date */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5 flex items-center justify-between">
            <span>{t('form.visitDate')}</span>
            <span className="text-[10px] text-gray-500 font-mono">Today / اليوم</span>
          </label>
          <input
            id="visitDate"
            type="date"
            value={formData.visitDate}
            onChange={(e) => handleVisitDateChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-mono outline-none"
          />
        </div>

        {/* Next Visit Date */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5 flex items-center justify-between">
            <span>{t('form.nextVisit')}</span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">
              ✨ {language === 'ar' ? 'محددة تلقائياً' : 'Auto Defined'}
            </span>
          </label>
          <input
            id="nextVisit"
            type="date"
            value={formData.nextVisit}
            onChange={(e) => handleNextVisitChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-mono outline-none text-blue-900 font-bold"
          />
        </div>

        {/* Automated Status - تمت الزيارة */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5 flex items-center justify-between">
            <span>{t('th.status')}</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span>⚡</span>
              <span>{t('form.statusAutomated')}</span>
            </span>
          </label>
          <div className="w-full px-3.5 py-2.5 text-xs md:text-sm bg-emerald-50 border border-emerald-200/90 rounded-xl font-bold text-emerald-800 flex items-center justify-between shadow-2xs">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
              <span>{language === 'ar' ? 'تمت الزيارة' : 'Visited'}</span>
            </span>
            <span className="text-xs text-emerald-700 font-semibold bg-white/80 border border-emerald-200 px-2 py-0.5 rounded-md">
              ✓ {t('form.statusConfirmed')}
            </span>
          </div>
        </div>
      </div>

      {/* Promoted Products (Focus 1, 2, 3 & Reminder) */}
      <div className="bg-[var(--surface-subtle)]/70 p-4 rounded-xl border border-[var(--line)] mb-4 space-y-3">
        <label className="block text-xs font-bold text-[var(--ink)]">
          {t('form.focusProducts')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[var(--ink-muted)] mb-1">
              {t('form.f1')}
            </label>
            <CustomSelect
              options={productOptions}
              value={formData.f1}
              onChange={(val) => handleSelectChange('f1', val)}
              searchable
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[var(--ink-muted)] mb-1">
              {t('form.f2')}
            </label>
            <CustomSelect
              options={productOptions}
              value={formData.f2}
              onChange={(val) => handleSelectChange('f2', val)}
              searchable
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[var(--ink-muted)] mb-1">
              {t('form.f3')}
            </label>
            <CustomSelect
              options={productOptions}
              value={formData.f3}
              onChange={(val) => handleSelectChange('f3', val)}
              searchable
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[var(--ink-muted)] mb-1">
              {t('form.reminder')}
            </label>
            <CustomSelect
              options={productOptions}
              value={formData.reminder}
              onChange={(val) => handleSelectChange('reminder', val)}
              searchable
            />
          </div>
        </div>
      </div>

      {/* Notes & Observations */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
          {t('form.notes')}
        </label>
        <textarea
          id="notes"
          rows={2}
          value={formData.notes}
          onChange={handleChange}
          placeholder="أي تفاصيل أو تعليقات بخصوص الزيارة..."
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-medium outline-none leading-relaxed"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button type="submit" variant="primary" size="md" isLoading={loading} className="px-6 font-extrabold">
          <span>💾</span>
          <span>{t('form.submit')}</span>
        </Button>
        <span className="text-[11px] text-[var(--ink-muted)]">
          {language === 'ar' ? 'يتم حفظ البيانات تلقائياً للمندوب' : 'Data is saved per user'}
        </span>
      </div>
    </form>
  );
}
