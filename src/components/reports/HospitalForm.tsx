'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HOSPITAL_TYPES, VISIT_STATUS_OPTIONS } from '@/lib/constants';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { MultiProductSelect } from '@/components/ui/MultiProductSelect';
import { MasterCustomerPicker } from '@/components/reports/MasterCustomerPicker';
import { MasterHospital } from '@/types';

interface HospitalFormProps {
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

export function HospitalForm({ selectedRep, onSuccess, onError }: HospitalFormProps) {
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [showKnownList, setShowKnownList] = useState(false);
  const [savedHospitals, setSavedHospitals] = useState<MasterHospital[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');
  const hospitalInputRef = useRef<HTMLDivElement>(null);

  const initialToday = getTodayString();
  const initialNext = addDaysToDate(initialToday, 7);

  const [formData, setFormData] = useState({
    name: '',
    area: '',
    type: 'Private',
    dept: '',
    drsVisited: 0,
    doctorNames: '',
    contact: '',
    phone: '',
    cycle: 7,
    lastVisit: initialToday,
    nextVisit: initialNext,
    status: 'Visited',
    visitType: 'Single',
    companion: '',
    ourProducts: '',
    competitor: '',
    notes: '',
  });

  const draftKey = `rep_track_hospital_draft_${selectedRep || 'guest'}`;

  // Fetch saved master hospitals for representative from API
  useEffect(() => {
    async function fetchMasterHospitals() {
      try {
        const url = selectedRep ? `/api/lists?rep=${encodeURIComponent(selectedRep)}` : '/api/lists';
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok && data.success && data.data?.hospitals) {
          setSavedHospitals(data.data.hospitals);
        }
      } catch {
        // ignore
      }
    }
    fetchMasterHospitals();
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
          lastVisit: parsed.lastVisit || initialToday,
          cycle: parsed.cycle !== undefined ? parsed.cycle : 7,
          nextVisit:
            parsed.nextVisit || addDaysToDate(parsed.lastVisit || initialToday, parsed.cycle || 7),
        }));
        setDraftRestored(true);
      } else {
        setDraftRestored(false);
      }
    } catch {
      // ignore
    }
  }, [selectedRep, draftKey, initialToday]);

  // Click outside to dismiss hospital autocomplete
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (hospitalInputRef.current && !hospitalInputRef.current.contains(e.target as Node)) {
        setShowKnownList(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Two-way automatic calculation for Visit Date, Cycle, and Next Visit Date
  const handleVisitDateChange = (newDate: string) => {
    setFormData((prev) => {
      const newNext = prev.cycle > 0 ? addDaysToDate(newDate, prev.cycle) : prev.nextVisit;
      const next = { ...prev, lastVisit: newDate, nextVisit: newNext };
      saveDraft(next);
      return next;
    });
  };

  const handleCycleChange = (newCycleVal: number) => {
    const safeCycle = isNaN(newCycleVal) || newCycleVal < 0 ? 0 : newCycleVal;
    setFormData((prev) => {
      const newNext =
        prev.lastVisit && safeCycle > 0 ? addDaysToDate(prev.lastVisit, safeCycle) : prev.nextVisit;
      const next = { ...prev, cycle: safeCycle, nextVisit: newNext };
      saveDraft(next);
      return next;
    });
  };

  const handleNextVisitChange = (newNextDate: string) => {
    setFormData((prev) => {
      let nextCycle = prev.cycle;
      if (prev.lastVisit && newNextDate) {
        const daysDiff = getDaysBetween(prev.lastVisit, newNextDate);
        if (daysDiff > 0) {
          nextCycle = daysDiff;
        }
      }
      const next = { ...prev, nextVisit: newNextDate, cycle: nextCycle };
      saveDraft(next);
      return next;
    });
  };

  // Auto-fill remembered hospital details from My Lists
  const handleSelectMasterHospital = (h: MasterHospital) => {
    setSelectedMasterId(h.id);
    setFormData((prev) => {
      const nextCycle =
        h.defaultCycle !== undefined && !isNaN(Number(h.defaultCycle)) && Number(h.defaultCycle) > 0
          ? Number(h.defaultCycle)
          : prev.cycle;
      const next = {
        ...prev,
        name: h.name,
        area: h.area || prev.area,
        type: h.type || prev.type,
        dept: h.dept || prev.dept,
        contact: h.contact || prev.contact,
        phone: h.phone || prev.phone,
        doctorNames: h.doctorNames || prev.doctorNames,
        cycle: nextCycle,
        nextVisit: prev.lastVisit
          ? addDaysToDate(prev.lastVisit, nextCycle)
          : addDaysToDate(initialToday, nextCycle),
        ourProducts: h.targetProducts || prev.ourProducts,
      };
      saveDraft(next);
      return next;
    });
    setShowKnownList(false);
  };

  const handleClearMasterHospital = () => {
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
      name: '',
      area: '',
      type: 'Private',
      dept: '',
      drsVisited: 0,
      doctorNames: '',
      contact: '',
      phone: '',
      cycle: 7,
      lastVisit: today,
      nextVisit: addDaysToDate(today, 7),
      status: 'Visited',
      visitType: 'Single',
      companion: '',
      ourProducts: '',
      competitor: '',
      notes: '',
    });
    setDraftRestored(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRep) {
      onError(t('msg.requiredRep'));
      return;
    }
    if (!formData.name.trim()) {
      onError(t('form.hospitalName'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reports/hospital', {
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
          name: '',
          area: '',
          type: 'Private',
          dept: '',
          drsVisited: 0,
          doctorNames: '',
          contact: '',
          phone: '',
          cycle: 7,
          lastVisit: today,
          nextVisit: addDaysToDate(today, 7),
          status: 'Visited',
          visitType: 'Single',
          companion: '',
          ourProducts: '',
          competitor: '',
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

  const matchingHospitals = savedHospitals.filter((h) =>
    h.name.toLowerCase().includes(formData.name.toLowerCase().trim())
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 md:p-6 mb-6 shadow-card animate-fade-in"
    >
      {/* Header Banner & Draft Controls */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--line)] flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏥</span>
          <div>
            <h2 className="text-base font-extrabold text-[var(--ink)]">
              {t('activity.hospital')} — {t('nav.submit')}
            </h2>
            <p className="text-[11px] text-[var(--ink-muted)]">
              {language === 'ar'
                ? 'توثيق زيارات المستشفيات والمراكز الطبية وقسم الصيدلة والمشتريات'
                : 'Document hospital visits, clinical departments, pharmacy & purchasing'}
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
          {(formData.name || formData.doctorNames || formData.contact) && (
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

      {/* Visit Nature / Type (Single vs Double) */}
      <div className="bg-[var(--surface-subtle)]/70 p-4 rounded-xl border border-[var(--line)] mb-5">
        <label className="block text-xs font-bold text-[var(--ink)] mb-2">
          {t('visit.type')} *
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => {
              setFormData((prev) => {
                const next = { ...prev, visitType: 'Single', companion: '' };
                saveDraft(next);
                return next;
              });
            }}
            className={`py-2.5 px-3 rounded-xl text-xs md:text-sm font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              formData.visitType === 'Single'
                ? 'bg-[var(--surface)] text-[var(--gold-dark)] border-[var(--gold)] shadow-sm'
                : 'bg-transparent text-[var(--ink-soft)] border-transparent hover:bg-[var(--surface-hover)]'
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
            className={`py-2.5 px-3 rounded-xl text-xs md:text-sm font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              formData.visitType === 'Double'
                ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white border-[var(--gold-dark)] shadow-sm'
                : 'bg-transparent text-[var(--ink-soft)] border-transparent hover:bg-[var(--surface-hover)]'
            }`}
          >
            <span>👥</span>
            <span>{t('visit.double')}</span>
          </button>
        </div>
        {formData.visitType === 'Double' && (
          <div className="mt-3.5 pt-3 border-t border-[var(--line)] animate-fade-in">
            <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1">
              {t('visit.companion')}
            </label>
            <input
              type="text"
              id="companion"
              value={formData.companion}
              onChange={handleChange}
              placeholder={t('visit.companionPlaceholder')}
              className="w-full text-xs md:text-sm bg-[var(--surface)] border border-[var(--line)] rounded-lg p-2.5"
            />
          </div>
        )}
      </div>

      {/* Master Hospital Selector (My Lists) */}
      <MasterCustomerPicker
        category="hospitals"
        items={savedHospitals}
        selectedId={selectedMasterId}
        onSelect={handleSelectMasterHospital}
        onClear={handleClearMasterHospital}
        selectedRep={selectedRep}
      />

      {/* Main Grid Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {/* Hospital Name with Autocomplete from My Lists */}
        <div className="relative" ref={hospitalInputRef}>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5 flex items-center justify-between">
            <span>{t('form.hospitalName')}</span>
            {matchingHospitals.length > 0 && !showKnownList && (
              <button
                type="button"
                onClick={() => setShowKnownList(true)}
                className="text-[10px] text-[var(--gold-deep)] hover:underline font-bold cursor-pointer"
              >
                {language === 'ar' ? 'سجل المستشفيات' : 'History'}
              </button>
            )}
          </label>
          <input
            id="name"
            value={formData.name}
            onChange={(e) => {
              handleChange(e);
              setShowKnownList(true);
            }}
            onFocus={() => setShowKnownList(true)}
            placeholder="مثال: مستشفى دار الشفاء"
            required
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-medium outline-none"
          />

          {/* Autocomplete Dropdown from My Lists */}
          {showKnownList && matchingHospitals.length > 0 && (
            <div className="absolute z-30 top-full mt-1 inset-x-0 bg-white border border-[var(--line)] rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-1.5 bg-[#FAF7F0] text-[10px] font-bold text-[var(--ink-muted)]">
                {language === 'ar' ? 'مستشفيات من قائمتك (اضغط للاسترجاع والتعبئة الفورية):' : 'Saved Hospitals (Click to auto-fill):'}
              </div>
              {matchingHospitals.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectMasterHospital(item)}
                  className="p-2.5 hover:bg-[var(--gold-tint)] cursor-pointer transition-colors text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-[var(--ink)] block">{item.name}</span>
                    <span className="text-[10px] text-[var(--ink-muted)]">
                      {item.area || '—'} {item.contact ? `• ${item.contact}` : ''}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--gold-deep)] font-extrabold">استرجاع ⚡</span>
                </div>
              ))}
            </div>
          )}
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
            placeholder="مثال: مدينة نصر - القاهرة"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-medium outline-none"
          />
        </div>

        {/* Type / Category */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.type')}
          </label>
          <CustomSelect
            options={HOSPITAL_TYPES}
            value={formData.type}
            onChange={(val) => handleSelectChange('type', val)}
          />
        </div>

        {/* Target Department / Specialty */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.dept')}
          </label>
          <input
            id="dept"
            value={formData.dept}
            onChange={handleChange}
            placeholder="مثال: الباطنة / الرعاية"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-medium outline-none"
          />
        </div>

        {/* Doctors Visited Count */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.drsVisited')}
          </label>
          <input
            id="drsVisited"
            type="number"
            min="0"
            value={formData.drsVisited || ''}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-mono outline-none"
          />
        </div>

        {/* Visited Doctor Names */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.doctorNames')}
          </label>
          <input
            id="doctorNames"
            value={formData.doctorNames}
            onChange={handleChange}
            placeholder="مثال: د. أحمد سامي، د. شريف عادل..."
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-medium outline-none"
          />
        </div>

        {/* Pharmacist / Purchasing */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5 flex items-center justify-between">
            <span>{t('form.contact')}</span>
            <span className="text-[10px] text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded font-mono">
              Pharm/Purchasing
            </span>
          </label>
          <input
            id="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="اسم الصيدلي أو مسؤول المشتريات..."
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-medium outline-none"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.phone')}
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="01xxxxxxxxx"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-mono outline-none"
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
            id="lastVisit"
            type="date"
            value={formData.lastVisit}
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

        {/* Status */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('th.status')}
          </label>
          <CustomSelect
            options={VISIT_STATUS_OPTIONS}
            value={formData.status}
            onChange={(val) => handleSelectChange('status', val)}
          />
        </div>

        {/* Our Products Discussed - Multi-Select */}
        <div className="sm:col-span-2 md:col-span-2">
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5 flex items-center justify-between">
            <span>{t('form.ourProducts')}</span>
            <span className="text-[10px] font-bold text-[var(--gold-deep)] bg-[var(--gold-tint)] px-2 py-0.5 rounded">
              {language === 'ar' ? 'قائمة منتجات مجموعة صني الطبية' : 'Sunny Medical Group Catalog'}
            </span>
          </label>
          <MultiProductSelect
            value={formData.ourProducts}
            onChange={(val) => {
              setFormData((prev) => {
                const next = { ...prev, ourProducts: val };
                saveDraft(next);
                return next;
              });
            }}
            placeholder="اختر منتج أو عدة منتجات من قائمة صني (Nitrong, Sugammadex, Danasetron...)..."
          />
        </div>

        {/* Competitor Product */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink-secondary)] mb-1.5">
            {t('form.competitor')}
          </label>
          <input
            id="competitor"
            value={formData.competitor}
            onChange={handleChange}
            placeholder="المنتج المنافس"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl font-medium outline-none"
          />
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

      {/* Form Submission Action */}
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
