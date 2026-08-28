'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Representative, WeeklyPlanRecord } from '@/types';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { EmptyState } from '@/components/ui/EmptyState';

interface WeeklyPlanViewProps {
  reps: Representative[];
  selectedRep: string;
  onSelectRep?: (name: string) => void;
  isManager?: boolean;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

interface DayPlan {
  dayKey: string;
  dayNameEn: string;
  dayNameAr: string;
  amKey: keyof WeeklyPlanFormState;
  pmKey: keyof WeeklyPlanFormState;
}

interface WeeklyPlanFormState {
  saturdayAm: string;
  saturdayPm: string;
  sundayAm: string;
  sundayPm: string;
  mondayAm: string;
  mondayPm: string;
  tuesdayAm: string;
  tuesdayPm: string;
  wednesdayAm: string;
  wednesdayPm: string;
  thursdayAm: string;
  thursdayPm: string;
  fridayAm: string;
  fridayPm: string;
}

type ItemBuilderTab = 'single' | 'double' | 'meeting' | 'training' | 'others';
type ShiftTargetOption = 'am' | 'pm' | 'both';
type InsertModeOption = 'append' | 'replace';

const DAYS: DayPlan[] = [
  { dayKey: 'saturday', dayNameEn: 'SATURDAY', dayNameAr: 'السبت', amKey: 'saturdayAm', pmKey: 'saturdayPm' },
  { dayKey: 'sunday', dayNameEn: 'SUNDAY', dayNameAr: 'الأحد', amKey: 'sundayAm', pmKey: 'sundayPm' },
  { dayKey: 'monday', dayNameEn: 'MONDAY', dayNameAr: 'الاثنين', amKey: 'mondayAm', pmKey: 'mondayPm' },
  { dayKey: 'tuesday', dayNameEn: 'TUESDAY', dayNameAr: 'الثلاثاء', amKey: 'tuesdayAm', pmKey: 'tuesdayPm' },
  { dayKey: 'wednesday', dayNameEn: 'WEDNESDAY', dayNameAr: 'الأربعاء', amKey: 'wednesdayAm', pmKey: 'wednesdayPm' },
  { dayKey: 'thursday', dayNameEn: 'THURSDAY', dayNameAr: 'الخميس', amKey: 'thursdayAm', pmKey: 'thursdayPm' },
  { dayKey: 'friday', dayNameEn: 'FRIDAY', dayNameAr: 'الجمعة', amKey: 'fridayAm', pmKey: 'fridayPm' },
];

const COMMON_AREAS = [
  'المهندسين (Mohandseen)',
  'الدقي (Dokki)',
  'مدينة نصر (Nasr City)',
  'مصر الجديدة (Heliopolis)',
  'المعادي (Maadi)',
  'الجيزة (Giza)',
  'وسط البلد (Downtown)',
  'شبرا (Shubra)',
  'الهرم وفيصل (Haram & Faisal)',
  'التجمع الخامس (New Cairo)',
  'الإسكندرية (Alexandria)',
  'المنصورة (Mansoura)',
  'طنطا (Tanta)',
  'الزقازيق (Zagazig)',
  'أسيوط (Assiut)',
];

const COMMON_COMPANIONS = [
  'د. فوزي ناصر (Line Manager)',
  'سارة عادل (Product Specialist)',
  'Field Trainer (مدرب ميداني)',
  'Area Sales Manager (مدير المنطقة)',
  'Medical Director (المدير الطبي)',
];

/**
 * Calculates current or specified Saturday start date and Friday end date (YYYY-MM-DD)
 */
function getWeekRange(baseDate = new Date()): { startDate: string; endDate: string; label: string } {
  const d = new Date(baseDate);
  const day = d.getDay(); // 0 is Sunday, 6 is Saturday
  // Distance back to last Saturday (if Saturday, diff is 0)
  const diffToSaturday = (day + 1) % 7;
  const sat = new Date(d);
  sat.setDate(d.getDate() - diffToSaturday);

  const fri = new Date(sat);
  fri.setDate(sat.getDate() + 6);

  const format = (date: Date) => date.toISOString().split('T')[0];
  const formatDisplay = (date: Date) => {
    const dayNum = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${dayNum}-${month}-${year}`;
  };

  return {
    startDate: format(sat),
    endDate: format(fri),
    label: `${formatDisplay(sat)} to ${formatDisplay(fri)}`,
  };
}

export function WeeklyPlanView({
  reps,
  selectedRep,
  onSelectRep,
  isManager = false,
  onSuccess,
  onError,
}: WeeklyPlanViewProps) {
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plansHistory, setPlansHistory] = useState<WeeklyPlanRecord[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  const initialRange = useMemo(() => getWeekRange(), []);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [weekLabel, setWeekLabel] = useState(initialRange.label);
  const [managerNotes, setManagerNotes] = useState('');
  const [planStatus, setPlanStatus] = useState('Submitted');
  const [focusedCell, setFocusedCell] = useState<keyof WeeklyPlanFormState>('saturdayAm');

  // Universal Smart Item Builder Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [activeItemTab, setActiveItemTab] = useState<ItemBuilderTab>('single');
  const [builderTargetDay, setBuilderTargetDay] = useState<string>('saturday');
  const [builderTargetShift, setBuilderTargetShift] = useState<ShiftTargetOption>('am');
  const [insertMode, setInsertMode] = useState<InsertModeOption>('append');

  // Single Visit Builder fields
  const [singlePrefix, setSinglePrefix] = useState<string>('');
  const [singleArea, setSingleArea] = useState<string>('');
  const [singleNotes, setSingleNotes] = useState<string>('');

  // Double Visit Builder fields
  const [doublePrefix, setDoublePrefix] = useState<string>('');
  const [doubleCompanion, setDoubleCompanion] = useState<string>('د. فوزي ناصر (Line Manager)');
  const [doubleArea, setDoubleArea] = useState<string>('');

  // Meeting Builder fields
  const [meetingType, setMeetingType] = useState<string>('Line 1 meeting');
  const [meetingAfter, setMeetingAfter] = useState<string>('then office working');

  // Training Builder fields
  const [trainingTopic, setTrainingTopic] = useState<string>('Product Knowledge & Scientific Workshop');
  const [trainingCustom, setTrainingCustom] = useState<string>('');

  // Others Builder fields
  const [othersType, setOthersType] = useState<string>('Medical Conference (مؤتمر طبي)');
  const [othersDetails, setOthersDetails] = useState<string>('');

  const [formData, setFormData] = useState<WeeklyPlanFormState>({
    saturdayAm: 'Line 1 meeting then office working',
    saturdayPm: 'Office working',
    sundayAm: 'Line 2 meeting then Am double visit with Sara Adel',
    sundayPm: 'Pm double visit with Sara Adel',
    mondayAm: 'Line 3 meeting then Am single visits in Mohandseen',
    mondayPm: 'Pm single visits in Mohandseen',
    tuesdayAm: 'Line 1 meeting then Am double visit with Dr. Fawzy Nasser',
    tuesdayPm: 'Pm double visit with Dr. Fawzy Nasser',
    wednesdayAm: 'Line 2 meeting then office working',
    wednesdayPm: 'Office working',
    thursdayAm: 'Line 3 meeting then office working',
    thursdayPm: 'Office working',
    fridayAm: 'Field visits / Follow-up',
    fridayPm: 'Off / Weekly summary',
  });

  // Find rep details
  const currentRepObj = useMemo(() => {
    return reps.find((r) => r.name === selectedRep);
  }, [reps, selectedRep]);

  // Set default single area to rep area if available
  useEffect(() => {
    if (currentRepObj?.area && !singleArea) {
      setSingleArea(currentRepObj.area);
    }
  }, [currentRepObj, singleArea]);

  const repOptions: SelectOption[] = useMemo(() => {
    return reps.map((r) => ({
      value: r.name,
      label: r.name,
      sublabel: r.area,
    }));
  }, [reps]);

  // Load plans history for selected rep
  const loadPlans = useCallback(async () => {
    if (!selectedRep && !isManager) return;
    setLoading(true);
    try {
      const url = selectedRep
        ? `/api/weekly-plans?rep=${encodeURIComponent(selectedRep)}`
        : `/api/weekly-plans`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.plans) {
        setPlansHistory(data.plans);
        // If there's a plan for the current week, populate it
        const currentMatch = data.plans.find(
          (p: WeeklyPlanRecord) => p.startDate === startDate && (!selectedRep || p.rep === selectedRep)
        );
        if (currentMatch) {
          setActivePlanId(currentMatch.id);
          setPlanStatus(currentMatch.status || 'Submitted');
          setManagerNotes(currentMatch.managerNotes || '');
          setFormData({
            saturdayAm: currentMatch.saturdayAm || '',
            saturdayPm: currentMatch.saturdayPm || '',
            sundayAm: currentMatch.sundayAm || '',
            sundayPm: currentMatch.sundayPm || '',
            mondayAm: currentMatch.mondayAm || '',
            mondayPm: currentMatch.mondayPm || '',
            tuesdayAm: currentMatch.tuesdayAm || '',
            tuesdayPm: currentMatch.tuesdayPm || '',
            wednesdayAm: currentMatch.wednesdayAm || '',
            wednesdayPm: currentMatch.wednesdayPm || '',
            thursdayAm: currentMatch.thursdayAm || '',
            thursdayPm: currentMatch.thursdayPm || '',
            fridayAm: currentMatch.fridayAm || '',
            fridayPm: currentMatch.fridayPm || '',
          });
        }
      }
    } catch (err) {
      console.error('Failed to load weekly plans:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRep, isManager, startDate]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    try {
      const d = new Date(newStart);
      const range = getWeekRange(d);
      setEndDate(range.endDate);
      setWeekLabel(range.label);
    } catch {
      // ignore
    }
  };

  const handleDayChange = (key: keyof WeeklyPlanFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyPreset = (key: keyof WeeklyPlanFormState, text: string) => {
    setFormData((prev) => {
      const current = (prev[key] || '').trim();
      const next = current ? `${current} | ${text}` : text;
      return { ...prev, [key]: next };
    });
  };

  const handleClearCell = (key: keyof WeeklyPlanFormState) => {
    setFormData((prev) => ({ ...prev, [key]: '' }));
  };

  // Open builder targeting specific day and shift
  const handleOpenBuilderForCell = (dayKey: string, shift: 'am' | 'pm') => {
    setBuilderTargetDay(dayKey);
    setBuilderTargetShift(shift);
    setShowItemModal(true);
  };

  // Open builder from top quick preset
  const handleOpenBuilderForTab = (tab: ItemBuilderTab) => {
    setActiveItemTab(tab);
    // Determine target day and shift from focusedCell
    const dayMatch = DAYS.find((d) => d.amKey === focusedCell || d.pmKey === focusedCell);
    if (dayMatch) {
      setBuilderTargetDay(dayMatch.dayKey);
      setBuilderTargetShift(focusedCell === dayMatch.amKey ? 'am' : 'pm');
    }
    setShowItemModal(true);
  };

  // Generate constructed text for preview and insertion
  const constructItemText = (shiftType: 'am' | 'pm' | 'both') => {
    const shiftLabel = shiftType === 'am' ? 'Am ' : shiftType === 'pm' ? 'Pm ' : '';

    switch (activeItemTab) {
      case 'single': {
        const area = singleArea.trim() || currentRepObj?.area || 'Field Area';
        const prefix = singlePrefix ? `${singlePrefix} ` : '';
        const notes = singleNotes.trim() ? ` (${singleNotes.trim()})` : '';
        return `${prefix}${shiftLabel}single visits in ${area}${notes}`;
      }
      case 'double': {
        const companion = doubleCompanion.trim() || 'Line Manager';
        const prefix = doublePrefix ? `${doublePrefix} ` : '';
        const area = doubleArea.trim() ? ` in ${doubleArea.trim()}` : '';
        return `${prefix}${shiftLabel}double visit with ${companion}${area}`;
      }
      case 'meeting': {
        if (meetingAfter === 'only') {
          return meetingType;
        }
        return `${meetingType} ${meetingAfter}`;
      }
      case 'training': {
        const custom = trainingCustom.trim() ? ` - ${trainingCustom.trim()}` : '';
        return `Training: ${trainingTopic}${custom}`;
      }
      case 'others': {
        const cleanType = othersType.replace(/\s*\(.*?\)\s*/g, '').trim();
        const details = othersDetails.trim() ? `: ${othersDetails.trim()}` : '';
        return `Others: ${cleanType}${details}`;
      }
    }
  };

  // Handle final insertion into form data
  const handleInsertItemIntoPlan = () => {
    const targetDayObj = DAYS.find((d) => d.dayKey === builderTargetDay) || DAYS[0];
    const amKey = targetDayObj.amKey;
    const pmKey = targetDayObj.pmKey;

    setFormData((prev) => {
      const nextState = { ...prev };

      const applyToKey = (key: keyof WeeklyPlanFormState, text: string) => {
        const current = (nextState[key] || '').trim();
        if (insertMode === 'replace' || !current) {
          nextState[key] = text;
        } else {
          nextState[key] = `${current} | ${text}`;
        }
      };

      if (builderTargetShift === 'am') {
        const text = constructItemText('am');
        applyToKey(amKey, text);
      } else if (builderTargetShift === 'pm') {
        const text = constructItemText('pm');
        applyToKey(pmKey, text);
      } else if (builderTargetShift === 'both') {
        const amText = constructItemText('am');
        const pmText = constructItemText('pm');
        applyToKey(amKey, amText);
        applyToKey(pmKey, pmText);
      }

      return nextState;
    });

    setShowItemModal(false);
    onSuccess?.(
      language === 'ar' ? 'تمت إضافة البند إلى الخطة بنجاح ✓' : 'Item added to weekly plan successfully ✓'
    );
  };

  // Apply Full-Week Schedule Templates
  const handleApplyWeekTemplate = (
    templateType: 'standard' | 'fieldIntensive' | 'doubleFocus' | 'clear'
  ) => {
    const repArea = currentRepObj?.area || 'Assigned Territory';

    if (templateType === 'clear') {
      setFormData({
        saturdayAm: '',
        saturdayPm: '',
        sundayAm: '',
        sundayPm: '',
        mondayAm: '',
        mondayPm: '',
        tuesdayAm: '',
        tuesdayPm: '',
        wednesdayAm: '',
        wednesdayPm: '',
        thursdayAm: '',
        thursdayPm: '',
        fridayAm: '',
        fridayPm: '',
      });
      onSuccess?.(language === 'ar' ? 'تم تفريغ الجدول للبدء من جديد' : 'Week schedule cleared');
      return;
    }

    if (templateType === 'standard') {
      setFormData({
        saturdayAm: 'Line 1 meeting then office working',
        saturdayPm: 'Office working',
        sundayAm: 'Line 2 meeting then Am double visit with Sara Adel',
        sundayPm: 'Pm double visit with Sara Adel',
        mondayAm: `Line 3 meeting then Am single visits in ${repArea}`,
        mondayPm: `Pm single visits in ${repArea}`,
        tuesdayAm: 'Line 1 meeting then Am double visit with Dr. Fawzy Nasser',
        tuesdayPm: 'Pm double visit with Dr. Fawzy Nasser',
        wednesdayAm: 'Line 2 meeting then office working',
        wednesdayPm: 'Office working',
        thursdayAm: 'Line 3 meeting then office working',
        thursdayPm: 'Office working',
        fridayAm: 'Field visits / Follow-up',
        fridayPm: 'Off / Weekly summary',
      });
      onSuccess?.(
        language === 'ar' ? 'تم تطبيق الجدول النموذجي المعتمد ✓' : 'Standard schedule template applied ✓'
      );
    } else if (templateType === 'fieldIntensive') {
      setFormData({
        saturdayAm: `Field visits & coverage in ${repArea}`,
        saturdayPm: `Single visits in ${repArea}`,
        sundayAm: `Line 2 meeting then Am single visits in ${repArea}`,
        sundayPm: `Pm single visits in ${repArea}`,
        mondayAm: `Line 3 meeting then Am single visits in ${repArea}`,
        mondayPm: `Pm single visits in ${repArea}`,
        tuesdayAm: `Line 1 meeting then Am single visits in ${repArea}`,
        tuesdayPm: `Pm single visits in ${repArea}`,
        wednesdayAm: `Line 2 meeting then Am single visits in ${repArea}`,
        wednesdayPm: `Pm single visits in ${repArea}`,
        thursdayAm: `Line 3 meeting then Am single visits in ${repArea}`,
        thursdayPm: `Pm single visits in ${repArea}`,
        fridayAm: 'Field follow-up / Key accounts',
        fridayPm: 'Off / Weekly summary',
      });
      onSuccess?.(
        language === 'ar' ? 'تم تطبيق نموذج الحقل المكثف ✓' : 'Field Intensive template applied ✓'
      );
    } else if (templateType === 'doubleFocus') {
      setFormData({
        saturdayAm: 'Line 1 meeting then office working',
        saturdayPm: 'Office working',
        sundayAm: 'Line 2 meeting then Am double visit with د. فوزي ناصر (Line Manager)',
        sundayPm: 'Pm double visit with د. فوزي ناصر (Line Manager)',
        mondayAm: 'Line 3 meeting then Am double visit with سارة عادل (Product Specialist)',
        mondayPm: 'Pm double visit with سارة عادل (Product Specialist)',
        tuesdayAm: 'Line 1 meeting then Am double visit with Field Trainer',
        tuesdayPm: 'Pm double visit with Field Trainer',
        wednesdayAm: `Line 2 meeting then Am single visits in ${repArea}`,
        wednesdayPm: `Pm single visits in ${repArea}`,
        thursdayAm: 'Line 3 meeting then Am double visit with Area Sales Manager',
        thursdayPm: 'Office working / Cycle evaluation',
        fridayAm: 'Field visits / Follow-up',
        fridayPm: 'Off / Weekly summary',
      });
      onSuccess?.(
        language === 'ar' ? 'تم تطبيق نموذج المرافقة الإشرافية ✓' : 'Double Focus template applied ✓'
      );
    }
  };

  const handleSelectHistoryPlan = (plan: WeeklyPlanRecord) => {
    setActivePlanId(plan.id);
    setStartDate(plan.startDate);
    setEndDate(plan.endDate);
    setWeekLabel(plan.weekLabel || `${plan.startDate} to ${plan.endDate}`);
    setPlanStatus(plan.status || 'Submitted');
    setManagerNotes(plan.managerNotes || '');
    setFormData({
      saturdayAm: plan.saturdayAm || '',
      saturdayPm: plan.saturdayPm || '',
      sundayAm: plan.sundayAm || '',
      sundayPm: plan.sundayPm || '',
      mondayAm: plan.mondayAm || '',
      mondayPm: plan.mondayPm || '',
      tuesdayAm: plan.tuesdayAm || '',
      tuesdayPm: plan.tuesdayPm || '',
      wednesdayAm: plan.wednesdayAm || '',
      wednesdayPm: plan.wednesdayPm || '',
      thursdayAm: plan.thursdayAm || '',
      thursdayPm: plan.thursdayPm || '',
      fridayAm: plan.fridayAm || '',
      fridayPm: plan.fridayPm || '',
    });
  };

  const handleSavePlan = async () => {
    if (!selectedRep && !isManager) {
      onError?.(t('msg.requiredRep'));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/weekly-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rep: selectedRep,
          startDate,
          endDate,
          weekLabel,
          ...formData,
          status: 'Submitted',
          managerNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess?.(data.message || t('msg.planSaved'));
        if (data.plan) {
          setActivePlanId(data.plan.id);
        }
        loadPlans();
      } else {
        onError?.(data.message || t('msg.errorGeneric'));
      }
    } catch {
      onError?.(t('msg.errorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  const handleExportPlanExcel = async () => {
    if (activePlanId) {
      window.open(`/api/weekly-plans/${activePlanId}/export`, '_blank');
      onSuccess?.(t('msg.exportPlanSuccess'));
      return;
    }

    // If not saved yet, save first then export
    await handleSavePlan();
    onSuccess?.(t('msg.exportPlanSuccess'));
  };

  const handleCopyLastWeek = () => {
    if (plansHistory.length > 0) {
      const latest = plansHistory[0];
      setFormData({
        saturdayAm: latest.saturdayAm || '',
        saturdayPm: latest.saturdayPm || '',
        sundayAm: latest.sundayAm || '',
        sundayPm: latest.sundayPm || '',
        mondayAm: latest.mondayAm || '',
        mondayPm: latest.mondayPm || '',
        tuesdayAm: latest.tuesdayAm || '',
        tuesdayPm: latest.tuesdayPm || '',
        wednesdayAm: latest.wednesdayAm || '',
        wednesdayPm: latest.wednesdayPm || '',
        thursdayAm: latest.thursdayAm || '',
        thursdayPm: latest.thursdayPm || '',
        fridayAm: latest.fridayAm || '',
        fridayPm: latest.fridayPm || '',
      });
      onSuccess?.('تم استرجاع بيانات آخر خطة سابقة ✓');
    } else {
      onError?.('لا توجد خطط سابقة لنسخها');
    }
  };

  const handleApprovePlan = async () => {
    if (!activePlanId) return;
    try {
      const res = await fetch(`/api/weekly-plans/${activePlanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved', managerNotes }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPlanStatus('Approved');
        onSuccess?.('تم اعتماد الخطة الأسبوعية بنجاح ✓');
        loadPlans();
      } else {
        onError?.(data.message || t('msg.errorGeneric'));
      }
    } catch {
      onError?.(t('msg.errorGeneric'));
    }
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Identity Selector */}
      {onSelectRep && (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">👤</span>
            <h2 className="text-base font-extrabold text-[var(--ink)]">
              {t('rep.selector.title')}
            </h2>
          </div>
          <p className="text-xs text-[var(--ink-soft)] mb-3.5 leading-relaxed">
            {t('weekly.desc')}
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
      )}

      {!selectedRep && !isManager ? (
        <EmptyState
          title={t('rep.myReports.emptyPrompt')}
          description={t('weekly.desc')}
          icon="📅"
        />
      ) : (
        <>
          {/* Main Weekly Plan Sheet Card (Restricted & Identical to Template) */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-lg)] shadow-hover overflow-hidden transition-all">
            {/* Top Sheet Header Banner (Matching XLS Gold/Beige Style) */}
            <div className="bg-gradient-to-r from-[#E5D7B7] via-[#DFCEAA] to-[#E5D7B7] border-b border-[#C8B68E] p-4 text-center">
              <h1 className="text-lg md:text-2xl font-black tracking-widest text-[#4A3B18] uppercase">
                WEEKLY PLAN
              </h1>
              <p className="text-xs text-[#6B5726] font-bold mt-0.5">
                {language === 'ar' ? 'خطة العمل الأسبوعية للمندوب الطبي' : 'Medical Representative Weekly Field Schedule'}
              </p>
            </div>

            {/* Subheader: Rep Name & Date Range Inputs */}
            <div className="bg-[#FAF7F0] border-b border-[#E8E2D2] px-5 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-sm font-black text-[#5C4A1E] uppercase tracking-wide whitespace-nowrap">
                  NAME :-
                </span>
                <span className="font-extrabold text-sm md:text-base text-[var(--ink)] px-3 py-1 bg-white border border-[#DDD5C0] rounded-lg shadow-xs">
                  {selectedRep || (language === 'ar' ? 'المندوب الطبي' : 'Medical Rep')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-[#1D5E99] uppercase tracking-wide whitespace-nowrap font-mono">
                    DATE:-
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-[#DDD5C0] rounded-lg text-[#1D5E99]"
                  />
                  <span className="text-xs font-bold text-[#6B5726]">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-[#DDD5C0] rounded-lg text-[#1D5E99]"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      planStatus === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {planStatus === 'Approved' ? `✓ ${t('status.approved')}` : t('status.submitted')}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Fill & Full-Week Templates Toolbar */}
            <div className="bg-white px-4 md:px-5 py-3 border-b border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
              {/* Left side: Quick item builders */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--ink-secondary)] shrink-0 flex items-center gap-1 me-1">
                  <span>⚡</span>
                  <span>{t('weekly.quickFill')}</span>
                </span>

                {/* Universal Plan Item Builder Primary Button */}
                <button
                  type="button"
                  onClick={() => setShowItemModal(true)}
                  className="text-xs font-extrabold px-3 py-1.5 bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white hover:from-[var(--gold-dark)] hover:to-[var(--gold)] rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-98"
                >
                  <span>✨</span>
                  <span>{t('weekly.addItem')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenBuilderForTab('single')}
                  className="text-[11px] font-bold px-2.5 py-1 bg-[var(--surface-subtle)] hover:bg-[var(--gold-tint)] border border-[var(--line)] hover:border-[var(--gold)] rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
                >
                  <span>🏃</span>
                  <span>Single visits...</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenBuilderForTab('double')}
                  className="text-[11px] font-bold px-2.5 py-1 bg-[var(--surface-subtle)] hover:bg-[var(--gold-tint)] border border-[var(--line)] hover:border-[var(--gold)] rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
                >
                  <span>👥</span>
                  <span>Double visit...</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(focusedCell, 'Line 1 meeting then office working')}
                  className="text-[11px] font-medium px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Line 1
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(focusedCell, 'Line 2 meeting then office working')}
                  className="text-[11px] font-medium px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Line 2
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(focusedCell, 'Line 3 meeting then office working')}
                  className="text-[11px] font-medium px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Line 3
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(focusedCell, 'Office working')}
                  className="text-[11px] font-medium px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Office
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenBuilderForTab('training')}
                  className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
                >
                  <span>🎓</span>
                  <span>Training</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenBuilderForTab('others')}
                  className="text-[11px] font-bold px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
                >
                  <span>🎯</span>
                  <span>Others...</span>
                </button>
              </div>

              {/* Right side: Full-Week Presets */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-[var(--ink-muted)] uppercase tracking-wider hidden lg:inline">
                  {language === 'ar' ? 'نماذج جاهزة:' : 'Week Presets:'}
                </span>
                <button
                  type="button"
                  onClick={() => handleApplyWeekTemplate('standard')}
                  title="تطبيق الجدول النموذجي"
                  className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg transition-all cursor-pointer shadow-2xs"
                >
                  {language === 'ar' ? '📋 المعتمد' : '📋 Standard'}
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyWeekTemplate('fieldIntensive')}
                  title="تطبيق جدول حقل مكثف"
                  className="text-[11px] font-bold px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-lg transition-all cursor-pointer shadow-2xs"
                >
                  {language === 'ar' ? '🏃 حقل مكثف' : '🏃 Field Focus'}
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyWeekTemplate('doubleFocus')}
                  title="تطبيق جدول مرافقة إشرافية"
                  className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg transition-all cursor-pointer shadow-2xs"
                >
                  {language === 'ar' ? '👥 مرافقة' : '👥 Double Focus'}
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyWeekTemplate('clear')}
                  title="تفريغ كامل الأسبوع"
                  className="text-[11px] font-medium px-2 py-1 text-gray-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'ar' ? '🗑️ تفريغ' : '🗑️ Clear'}
                </button>
              </div>
            </div>

            {/* Template Table: DAY | AM | PM (Saturday to Friday) */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#EFE9DA] text-[#4A3B18] border-b-2 border-[#D8CEB9]">
                    <th className="py-3 px-4 text-center font-black text-xs md:text-sm uppercase tracking-wider w-[18%] border-r border-[#E0D7C4]">
                      {t('weekly.day')} (DAY)
                    </th>
                    <th className="py-3 px-4 text-start font-black text-xs md:text-sm uppercase tracking-wider w-[41%] border-r border-[#E0D7C4]">
                      {t('weekly.am')}
                    </th>
                    <th className="py-3 px-4 text-start font-black text-xs md:text-sm uppercase tracking-wider w-[41%]">
                      {t('weekly.pm')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] bg-white text-xs md:text-sm">
                  {DAYS.map((dayItem, idx) => {
                    const isEven = idx % 2 === 0;
                    const isAmFocused = focusedCell === dayItem.amKey;
                    const isPmFocused = focusedCell === dayItem.pmKey;
                    const amVal = formData[dayItem.amKey] || '';
                    const pmVal = formData[dayItem.pmKey] || '';

                    return (
                      <tr
                        key={dayItem.dayKey}
                        className={`transition-colors hover:bg-[#FAF9F5] ${
                          isEven ? 'bg-white' : 'bg-[#FCFAF6]'
                        }`}
                      >
                        {/* Day Column */}
                        <td className="py-3.5 px-4 font-black text-[#5C4A1E] text-center uppercase tracking-wide border-r border-[var(--line)] bg-[#FAF7F0]">
                          <div className="flex flex-col items-center justify-center">
                            <span className="font-mono text-xs md:text-sm font-extrabold">
                              {dayItem.dayNameEn}
                            </span>
                            <span className="text-[11px] text-[var(--ink-muted)] font-normal">
                              {dayItem.dayNameAr}
                            </span>
                          </div>
                        </td>

                        {/* AM Input Cell */}
                        <td className="py-2.5 px-3 border-r border-[var(--line)] align-top relative group">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-100/60 px-1.5 py-0.5 rounded">
                              AM
                            </span>
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleOpenBuilderForCell(dayItem.dayKey, 'am')}
                                title="إضافة بند مخصص للفترة الصباحية"
                                className="text-[10px] font-bold px-1.5 py-0.5 text-[var(--gold-deep)] hover:bg-[var(--gold-tint)] border border-transparent hover:border-[var(--gold-light)] rounded cursor-pointer transition-colors"
                              >
                                + {language === 'ar' ? 'إضافة' : 'Add'}
                              </button>
                              {amVal && (
                                <button
                                  type="button"
                                  onClick={() => handleClearCell(dayItem.amKey)}
                                  title="مسح هذه الخلية"
                                  className="text-[10px] text-gray-400 hover:text-red-600 px-1 rounded cursor-pointer"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                          <textarea
                            rows={2}
                            value={amVal}
                            onFocus={() => setFocusedCell(dayItem.amKey)}
                            onChange={(e) => handleDayChange(dayItem.amKey, e.target.value)}
                            placeholder={`e.g. Line 1 meeting then Am single visits in...`}
                            className={`w-full text-xs md:text-sm p-2 bg-transparent rounded-lg resize-none transition-all outline-none leading-relaxed ${
                              isAmFocused
                                ? 'border border-[var(--gold)] ring-1 ring-[var(--gold-tint)] bg-amber-50/20'
                                : 'border border-transparent hover:border-[var(--line)] focus:border-[var(--gold)] focus:bg-white'
                            }`}
                          />
                          {/* Inline Micro-Presets for AM */}
                          <div className="flex flex-wrap items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleApplyPreset(dayItem.amKey, 'Office working')}
                              className="text-[9px] px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                            >
                              + Office
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyPreset(
                                  dayItem.amKey,
                                  `Am single visits in ${currentRepObj?.area || 'Field'}`
                                )
                              }
                              className="text-[9px] px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded transition-colors"
                            >
                              + Single
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyPreset(
                                  dayItem.amKey,
                                  'Am double visit with د. فوزي ناصر (Line Manager)'
                                )
                              }
                              className="text-[9px] px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded transition-colors"
                            >
                              + Double
                            </button>
                          </div>
                        </td>

                        {/* PM Input Cell */}
                        <td className="py-2.5 px-3 align-top relative group">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-blue-900 bg-blue-100/60 px-1.5 py-0.5 rounded">
                              PM
                            </span>
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleOpenBuilderForCell(dayItem.dayKey, 'pm')}
                                title="إضافة بند مخصص للفترة المسائية"
                                className="text-[10px] font-bold px-1.5 py-0.5 text-[var(--gold-deep)] hover:bg-[var(--gold-tint)] border border-transparent hover:border-[var(--gold-light)] rounded cursor-pointer transition-colors"
                              >
                                + {language === 'ar' ? 'إضافة' : 'Add'}
                              </button>
                              {pmVal && (
                                <button
                                  type="button"
                                  onClick={() => handleClearCell(dayItem.pmKey)}
                                  title="مسح هذه الخلية"
                                  className="text-[10px] text-gray-400 hover:text-red-600 px-1 rounded cursor-pointer"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                          <textarea
                            rows={2}
                            value={pmVal}
                            onFocus={() => setFocusedCell(dayItem.pmKey)}
                            onChange={(e) => handleDayChange(dayItem.pmKey, e.target.value)}
                            placeholder={`e.g. Pm double visit with... or Office working`}
                            className={`w-full text-xs md:text-sm p-2 bg-transparent rounded-lg resize-none transition-all outline-none leading-relaxed ${
                              isPmFocused
                                ? 'border border-[var(--gold)] ring-1 ring-[var(--gold-tint)] bg-amber-50/20'
                                : 'border border-transparent hover:border-[var(--line)] focus:border-[var(--gold)] focus:bg-white'
                            }`}
                          />
                          {/* Inline Micro-Presets for PM */}
                          <div className="flex flex-wrap items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleApplyPreset(dayItem.pmKey, 'Office working')}
                              className="text-[9px] px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                            >
                              + Office
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyPreset(
                                  dayItem.pmKey,
                                  `Pm single visits in ${currentRepObj?.area || 'Field'}`
                                )
                              }
                              className="text-[9px] px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded transition-colors"
                            >
                              + Single
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyPreset(
                                  dayItem.pmKey,
                                  'Pm double visit with د. فوزي ناصر (Line Manager)'
                                )
                              }
                              className="text-[9px] px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded transition-colors"
                            >
                              + Double
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Manager Notes / Directives Box (If Any) */}
            {(isManager || managerNotes) && (
              <div className="bg-[#FFFDF7] border-t border-[var(--gold-border)] p-4">
                <label className="block text-xs font-bold text-[var(--gold-deep)] mb-1.5 flex items-center gap-1.5">
                  <span>📝</span>
                  <span>{t('weekly.managerNotes')}</span>
                </label>
                {isManager ? (
                  <textarea
                    rows={2}
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    placeholder="ملاحظات وتوجيهات الإدارة على هذه الخطة الأسبوعية..."
                    className="w-full text-xs md:text-sm p-2.5 bg-white border border-[var(--gold-border)] rounded-xl"
                  />
                ) : (
                  <div className="p-3 bg-white border border-[var(--gold-border)] rounded-xl text-xs md:text-sm text-[var(--ink-secondary)] leading-relaxed">
                    {managerNotes}
                  </div>
                )}
              </div>
            )}

            {/* Actions Footer Bar */}
            <div className="bg-[#FAF7F0] border-t border-[#E8E2D2] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyLastWeek}
                  className="text-xs font-bold"
                >
                  <span>📋</span>
                  <span>{t('weekly.copyLastWeek')}</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportPlanExcel}
                  className="text-xs font-bold bg-[#E8F3FF] hover:bg-[#D5E9FF] text-[#1D5E99] border-[#B9DAFF]"
                >
                  <span>📊</span>
                  <span>{t('weekly.exportExcel')}</span>
                </Button>
              </div>

              <div className="flex items-center gap-2.5">
                {isManager && planStatus !== 'Approved' && activePlanId && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleApprovePlan}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs md:text-sm"
                  >
                    <span>✓</span>
                    <span>{t('manager.approvePlan')}</span>
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSavePlan}
                  isLoading={saving}
                  className="font-extrabold text-xs md:text-sm px-6"
                >
                  <span>💾</span>
                  <span>{t('weekly.savePlan')}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Past Plans History for this Representative */}
          {plansHistory.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 shadow-card animate-fade-in">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📜</span>
                  <h3 className="text-sm font-extrabold text-[var(--ink)]">
                    {t('weekly.history')} ({plansHistory.length})
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {plansHistory.map((plan) => {
                  const isActive = plan.id === activePlanId;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => handleSelectHistoryPlan(plan)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                        isActive
                           ? 'border-[var(--gold)] bg-[var(--gold-tint)] shadow-xs'
                          : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--gold-light)] hover:bg-[#FAF9F5]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-[var(--ink)]">
                          📅 {plan.weekLabel || `${plan.startDate} to ${plan.endDate}`}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            plan.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {plan.status === 'Approved' ? 'معتمدة ✓' : 'مرسلة'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--ink-muted)] flex items-center justify-between mt-1">
                        <span>{plan.rep}</span>
                        <span className="text-[10px]">
                          {plan.submittedAt ? new Date(plan.submittedAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* Universal Smart Plan Item Builder Modal */}
          {/* ========================================================================= */}
          {showItemModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
              <div
                className="bg-white rounded-2xl border border-[var(--line)] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Top Header */}
                <div className="bg-gradient-to-r from-[#EFE9DA] via-[#F7F4EB] to-[#EFE9DA] px-5 py-3.5 border-b border-[#E0D7C4] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <div>
                      <h3 className="font-extrabold text-sm md:text-base text-[#4A3B18]">
                        {t('weekly.itemBuilderTitle')}
                      </h3>
                      <p className="text-[10px] text-[#6B5726] font-medium">
                        {t('weekly.itemBuilderDesc')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowItemModal(false)}
                    className="text-gray-400 hover:text-gray-700 w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer text-base font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Target Day, Shift & Mode Row */}
                <div className="bg-[#FAF7F0] px-5 py-3 border-b border-[#E8E2D2] grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
                  {/* Day Target */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#5C4A1E] mb-1">
                      {t('weekly.targetDay')}
                    </label>
                    <select
                      value={builderTargetDay}
                      onChange={(e) => setBuilderTargetDay(e.target.value)}
                      className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-[#DDD5C0] rounded-lg outline-none focus:border-[var(--gold)]"
                    >
                      {DAYS.map((d) => (
                        <option key={d.dayKey} value={d.dayKey}>
                          {d.dayNameEn} ({d.dayNameAr})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Shift Target */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#5C4A1E] mb-1">
                      {t('weekly.targetShift')}
                    </label>
                    <select
                      value={builderTargetShift}
                      onChange={(e) => setBuilderTargetShift(e.target.value as ShiftTargetOption)}
                      className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-[#DDD5C0] rounded-lg outline-none focus:border-[var(--gold)]"
                    >
                      <option value="am">{t('weekly.shiftAm')}</option>
                      <option value="pm">{t('weekly.shiftPm')}</option>
                      <option value="both">{t('weekly.shiftBoth')}</option>
                    </select>
                  </div>

                  {/* Mode Target */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#5C4A1E] mb-1">
                      {t('weekly.insertMode')}
                    </label>
                    <select
                      value={insertMode}
                      onChange={(e) => setInsertMode(e.target.value as InsertModeOption)}
                      className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-[#DDD5C0] rounded-lg outline-none focus:border-[var(--gold)]"
                    >
                      <option value="append">{t('weekly.modeAppend')}</option>
                      <option value="replace">{t('weekly.modeReplace')}</option>
                    </select>
                  </div>
                </div>

                {/* Navigation Category Tabs */}
                <div className="bg-[#F2ECE1] px-4 pt-2 border-b border-[#DDD5C0] flex items-center gap-1.5 overflow-x-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveItemTab('single')}
                    className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
                      activeItemTab === 'single'
                        ? 'bg-white text-[var(--gold-deep)] shadow-xs border-t border-x border-[#DDD5C0]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                    }`}
                  >
                    {t('weekly.tab.single')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveItemTab('double')}
                    className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
                      activeItemTab === 'double'
                        ? 'bg-white text-[var(--gold-deep)] shadow-xs border-t border-x border-[#DDD5C0]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                    }`}
                  >
                    {t('weekly.tab.double')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveItemTab('meeting')}
                    className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
                      activeItemTab === 'meeting'
                        ? 'bg-white text-[var(--gold-deep)] shadow-xs border-t border-x border-[#DDD5C0]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                    }`}
                  >
                    {t('weekly.tab.meeting')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveItemTab('training')}
                    className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
                      activeItemTab === 'training'
                        ? 'bg-white text-[var(--gold-deep)] shadow-xs border-t border-x border-[#DDD5C0]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                    }`}
                  >
                    {t('weekly.tab.training')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveItemTab('others')}
                    className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
                      activeItemTab === 'others'
                        ? 'bg-white text-[var(--gold-deep)] shadow-xs border-t border-x border-[#DDD5C0]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                    }`}
                  >
                    {t('weekly.tab.others')}
                  </button>
                </div>

                {/* Tab Specific Content Form */}
                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                  {/* TAB 1: SINGLE VISITS */}
                  {activeItemTab === 'single' && (
                    <div className="space-y-3.5">
                      {/* Meeting Prefix */}
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                          {t('weekly.meetingPrefix')}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: t('weekly.meetingNone'), val: '' },
                            { label: 'Line 1 meeting then', val: 'Line 1 meeting then' },
                            { label: 'Line 2 meeting then', val: 'Line 2 meeting then' },
                            { label: 'Line 3 meeting then', val: 'Line 3 meeting then' },
                            { label: 'Cycle meeting then', val: 'Cycle meeting then' },
                          ].map((p, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setSinglePrefix(p.val)}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                                singlePrefix === p.val
                                  ? 'bg-[var(--gold-tint)] border-[var(--gold)] text-[var(--gold-deep)]'
                                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Area Input & Chips */}
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                          {t('weekly.areaTarget')} *
                        </label>
                        <input
                          type="text"
                          value={singleArea}
                          onChange={(e) => setSingleArea(e.target.value)}
                          placeholder="اكتب اسم المنطقة أو المستشفى المستهدفة..."
                          className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                        />
                        {/* Quick Area Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {currentRepObj?.area && (
                            <button
                              type="button"
                              onClick={() => setSingleArea(currentRepObj.area)}
                              className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md cursor-pointer"
                            >
                              ⭐ {currentRepObj.area} (منطقتك)
                            </button>
                          )}
                          {COMMON_AREAS.map((a, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setSingleArea(a.split(' ')[0])}
                              className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-[var(--gold-tint)] text-gray-700 rounded-md border border-gray-200 cursor-pointer transition-colors"
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Additional Custom Note */}
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                          {language === 'ar' ? 'ملاحظة إضافية (اختياري):' : 'Custom Note (Optional):'}
                        </label>
                        <input
                          type="text"
                          value={singleNotes}
                          onChange={(e) => setSingleNotes(e.target.value)}
                          placeholder="مثال: Key Opinion Leaders / Ortho Clinics..."
                          className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[var(--gold)] rounded-xl outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DOUBLE VISITS */}
                  {activeItemTab === 'double' && (
                    <div className="space-y-3.5">
                      {/* Meeting Prefix */}
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                          {t('weekly.meetingPrefix')}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: t('weekly.meetingNone'), val: '' },
                            { label: 'Line 1 meeting then', val: 'Line 1 meeting then' },
                            { label: 'Line 2 meeting then', val: 'Line 2 meeting then' },
                            { label: 'Line 3 meeting then', val: 'Line 3 meeting then' },
                          ].map((p, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setDoublePrefix(p.val)}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                                doublePrefix === p.val
                                  ? 'bg-[var(--gold-tint)] border-[var(--gold)] text-[var(--gold-deep)]'
                                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Companion Selector & Chips */}
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                          {t('weekly.companion')} *
                        </label>
                        <input
                          type="text"
                          value={doubleCompanion}
                          onChange={(e) => setDoubleCompanion(e.target.value)}
                          placeholder="اكتب أو اختر اسم المرافق أو دوره..."
                          className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                        />
                        {/* Quick Companion Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {COMMON_COMPANIONS.map((c, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setDoubleCompanion(c)}
                              className="text-[10px] font-medium px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-md border border-amber-200 cursor-pointer transition-colors"
                            >
                              👥 {c}
                            </button>
                          ))}
                          {reps
                            .filter((r) => r.name !== selectedRep)
                            .slice(0, 4)
                            .map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => setDoubleCompanion(r.name)}
                                className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-200 cursor-pointer transition-colors"
                              >
                                {r.name}
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Area for Double Visit */}
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                          {language === 'ar' ? 'منطقة الزيارة المشتركة (اختياري):' : 'Double Visit Territory (Optional):'}
                        </label>
                        <input
                          type="text"
                          value={doubleArea}
                          onChange={(e) => setDoubleArea(e.target.value)}
                          placeholder="مثال: Mohandseen / Dokki..."
                          className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[var(--gold)] rounded-xl outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: MEETINGS & OFFICE */}
                  {activeItemTab === 'meeting' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                          {language === 'ar' ? 'نوع الاجتماع:' : 'Meeting Type:'}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            'Line 1 meeting',
                            'Line 2 meeting',
                            'Line 3 meeting',
                            'All Lines meeting',
                            'Cycle Review meeting',
                            'Monthly Strategy meeting',
                          ].map((m, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setMeetingType(m)}
                              className={`p-2 rounded-xl text-xs font-bold text-start border transition-all cursor-pointer ${
                                meetingType === m
                                  ? 'bg-[var(--gold-tint)] border-[var(--gold)] text-[var(--gold-deep)] shadow-2xs'
                                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              🏢 {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                          {language === 'ar' ? 'النشاط التابع للاجتماع:' : 'Followed by / Activity:'}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { label: 'then office working (ثم عمل مكتبي)', val: 'then office working' },
                            { label: 'Office working only (عمل مكتبي فقط)', val: 'only' },
                            { label: 'then administrative tasks (ثم مهام إدارية)', val: 'then administrative tasks' },
                            { label: 'then Field visits (ثم زيارات حقلية)', val: 'then Field visits' },
                          ].map((a, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setMeetingAfter(a.val)}
                              className={`p-2 rounded-xl text-xs font-semibold text-start border transition-all cursor-pointer ${
                                meetingAfter === a.val
                                  ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: TRAINING & CME */}
                  {activeItemTab === 'training' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                          {language === 'ar' ? 'موضوع التدريب والتطوير:' : 'Training Topic:'}
                        </label>
                        <div className="space-y-1.5">
                          {[
                            'Product Knowledge & Scientific Workshop',
                            'Sales & Negotiation Skills Training',
                            'CME (Continuing Medical Education)',
                            'New Product Launch Orientation',
                            'Compliance & Reporting Excellence',
                          ].map((tTopic, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setTrainingTopic(tTopic)}
                              className={`w-full p-2.5 rounded-xl text-xs text-start border transition-all cursor-pointer flex items-center justify-between ${
                                trainingTopic === tTopic
                                  ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <span>🎓 {tTopic}</span>
                              {trainingTopic === tTopic && <span className="text-amber-600 font-bold">✓</span>}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                          {language === 'ar' ? 'تفاصيل إضافية عن التدريب (اختياري):' : 'Custom Details (Optional):'}
                        </label>
                        <input
                          type="text"
                          value={trainingCustom}
                          onChange={(e) => setTrainingCustom(e.target.value)}
                          placeholder="مثال: Session with Marketing Dept / Product Specialist..."
                          className="w-full text-xs px-3 py-2 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 5: EVENTS & OTHERS */}
                  {activeItemTab === 'others' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                          {language === 'ar' ? 'نوع النشاط الإضافي:' : 'Activity Category:'}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            'Medical Conference (مؤتمر طبي)',
                            'Round Table Discussion (طاولة نقاش علمية)',
                            'Scientific Symposium (ندوة علمية)',
                            'Tenders Follow-up (متابعة مناقصات)',
                            'Stock Inventory (جرد مستودع وصيدليات)',
                            'Official / Annual Leave (إجازة رسمية)',
                            'Special Assignment (مهمة خاصة)',
                          ].map((oType, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setOthersType(oType)}
                              className={`p-2 rounded-xl text-xs text-start border transition-all cursor-pointer ${
                                othersType === oType
                                  ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold'
                                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              🎯 {oType}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                          {language === 'ar' ? 'تفاصيل النشاط (اختياري أو تفصيلي):' : 'Activity Details:'}
                        </label>
                        <textarea
                          rows={2}
                          value={othersDetails}
                          onChange={(e) => setOthersDetails(e.target.value)}
                          placeholder="اكتب اسم المؤتمر أو الجهة أو أي ملاحظات تفصيلية..."
                          className="w-full text-xs p-2.5 bg-white border border-[var(--line)] focus:border-[var(--gold)] rounded-xl outline-none leading-relaxed"
                        />
                      </div>
                    </div>
                  )}

                  {/* Live Formatted Output Preview Banner */}
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1 text-amber-900 font-bold text-xs">
                      <span>👁️</span>
                      <span>{t('weekly.preview')}</span>
                    </div>
                    <div className="space-y-1 font-mono text-xs text-amber-950">
                      {builderTargetShift === 'am' && (
                        <div className="bg-white/90 p-2 rounded border border-amber-200">
                          <span className="font-bold text-amber-800 me-2">AM:</span>
                          {constructItemText('am')}
                        </div>
                      )}
                      {builderTargetShift === 'pm' && (
                        <div className="bg-white/90 p-2 rounded border border-amber-200">
                          <span className="font-bold text-blue-800 me-2">PM:</span>
                          {constructItemText('pm')}
                        </div>
                      )}
                      {builderTargetShift === 'both' && (
                        <>
                          <div className="bg-white/90 p-2 rounded border border-amber-200">
                            <span className="font-bold text-amber-800 me-2">AM:</span>
                            {constructItemText('am')}
                          </div>
                          <div className="bg-white/90 p-2 rounded border border-amber-200">
                            <span className="font-bold text-blue-800 me-2">PM:</span>
                            {constructItemText('pm')}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="bg-[#FAF7F0] px-5 py-3.5 border-t border-[#E8E2D2] flex items-center justify-between gap-2 shrink-0">
                  <span className="text-[11px] text-[var(--ink-muted)]">
                    {insertMode === 'append' ? 'سيتم إلحاق النص بالخلية' : 'سيتم استبدال محتوى الخلية'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowItemModal(false)}
                    >
                      {t('action.cancel')}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleInsertItemIntoPlan}
                      className="font-extrabold px-5 text-xs bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white shadow-xs"
                    >
                      <span>✓</span>
                      <span>{t('weekly.insertActivity')}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
