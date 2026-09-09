'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Representative, WeeklyPlanRecord } from '@/types';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
import { WeekSelector, PlanStatus, PlanActions } from './PlanControls';
import { SectionCard } from '@/components/ui/SectionCard';
import { FormField } from '@/components/ui/FormField';
import { Drawer } from '@/components/ui/Drawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ReportDetails } from '@/components/reports/ReportExplorer';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { Skeleton } from '@/components/ui/Skeleton';
import { WeeklyPlanGrid, type DayPlan, type WeeklyPlanFormState } from './WeeklyPlanGrid';
interface WeeklyPlanViewProps {
    reps?: Representative[];
    selectedRep?: string;
    isManager?: boolean;
    isManagerPersonal?: boolean;
    currentUser?: {
        id: string;
        name: string;
        username: string;
        position?: string;
        role?: string;
    } | null;
    initialPlan?: WeeklyPlanRecord | null;
    onSuccess?: (msg: string) => void;
    onError?: (msg: string) => void;
}
type ItemBuilderTab = 'single' | 'double' | 'meeting' | 'training' | 'others';
type ShiftTargetOption = 'am' | 'pm' | 'both';
type InsertModeOption = 'append' | 'replace';
const DAYS: DayPlan[] = [
    {
        dayKey: 'saturday', dayNameEn: 'SATURDAY', dayNameAr: 'السبت', amKey: 'saturdayAm', pmKey: 'saturdayPm'
    },
    {
        dayKey: 'sunday', dayNameEn: 'SUNDAY', dayNameAr: 'الأحد', amKey: 'sundayAm', pmKey: 'sundayPm'
    },
    {
        dayKey: 'monday', dayNameEn: 'MONDAY', dayNameAr: 'الاثنين', amKey: 'mondayAm', pmKey: 'mondayPm'
    },
    {
        dayKey: 'tuesday', dayNameEn: 'TUESDAY', dayNameAr: 'الثلاثاء', amKey: 'tuesdayAm', pmKey: 'tuesdayPm'
    },
    {
        dayKey: 'wednesday', dayNameEn: 'WEDNESDAY', dayNameAr: 'الأربعاء', amKey: 'wednesdayAm', pmKey: 'wednesdayPm'
    },
    {
        dayKey: 'thursday', dayNameEn: 'THURSDAY', dayNameAr: 'الخميس', amKey: 'thursdayAm', pmKey: 'thursdayPm'
    },
    {
        dayKey: 'friday', dayNameEn: 'FRIDAY', dayNameAr: 'الجمعة', amKey: 'fridayAm', pmKey: 'fridayPm'
    },
];
/**
 * Calculates current or specified Saturday start date and Friday end date (YYYY-MM-DD)
 */
function getWeekRange(baseDate = new Date()): {
    startDate: string;
    endDate: string;
    label: string;
} {
    const d = new Date(baseDate);
    const day = d.getDay(); // 0 is Sunday, 6 is Saturday
    // Distance back to last Saturday (if Saturday, diff is 0)
    const diffToSaturday = (day + 1) % 7;
    const sat = new Date(d);
    sat.setDate(d.getDate() - diffToSaturday);
    const fri = new Date(sat);
    fri.setDate(sat.getDate() + 6);
    const format = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
export function WeeklyPlanView({ reps = [], selectedRep = '', isManager = false, isManagerPersonal = false, currentUser = null, initialPlan = null, onSuccess, onError, }: WeeklyPlanViewProps) {
    const { t, language } = useTranslation();
    const [preview, setPreview] = useState(false);
    const [confirmation, setConfirmation] = useState<{
        action: () => void;
    } | null>(null);
    const [dirty, setDirty] = useState(false);
    const protect = (action: () => void) => { if (Object.values(formData).some(value => value.trim()))
        setConfirmation({
            action
        });
    else
        action(); };
    useEffect(() => { if (!dirty)
        return; const warn = (event: BeforeUnloadEvent) => event.preventDefault(); window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const [saving, setSaving] = useState(false);
    const [plansHistory, setPlansHistory] = useState<WeeklyPlanRecord[]>([]);
    const [activePlanId, setActivePlanId] = useState<string | null>(initialPlan?.id ?? null);
    const initialRange = useMemo(() => getWeekRange(), []);
    const [startDate, setStartDate] = useState(initialPlan?.startDate ?? initialRange.startDate);
    const [endDate, setEndDate] = useState(initialPlan?.endDate ?? initialRange.endDate);
    const [weekLabel, setWeekLabel] = useState(initialPlan?.weekLabel ?? initialRange.label);
    const [managerNotes, setManagerNotes] = useState(initialPlan?.managerNotes ?? '');
    const [planStatus, setPlanStatus] = useState(initialPlan?.status ?? 'Submitted');
    const [focusedCell, setFocusedCell] = useState<keyof WeeklyPlanFormState>('saturdayAm');
    // Universal Smart Item Builder Modal State
    const [showItemModal, setShowItemModal] = useState(false);
    const [activeItemTab, setActiveItemTab] = useState<ItemBuilderTab>('single');
    const [builderTargetDay, setBuilderTargetDay] = useState<string>('saturday');
    const [builderTargetShift, setBuilderTargetShift] = useState<ShiftTargetOption>('am');
    const [insertMode, setInsertMode] = useState<InsertModeOption>('append');
    // Single Visit Builder fields
    const [singlePrefix, setSinglePrefix] = useState<string>('');
    const [singleArea, setSingleArea] = useState<string>(() => reps.find(r => r.name === selectedRep)?.area ?? '');
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
        saturdayAm: initialPlan ? (initialPlan.saturdayAm ?? '') : isManagerPersonal ? '' : 'Line 1 meeting then office working',
        saturdayPm: initialPlan ? (initialPlan.saturdayPm ?? '') : isManagerPersonal ? '' : 'Office working',
        sundayAm: initialPlan ? (initialPlan.sundayAm ?? '') : isManagerPersonal ? '' : 'Line 2 meeting then Am double visit with Sara Adel',
        sundayPm: initialPlan ? (initialPlan.sundayPm ?? '') : isManagerPersonal ? '' : 'Pm double visit with Sara Adel',
        mondayAm: initialPlan ? (initialPlan.mondayAm ?? '') : isManagerPersonal ? '' : 'Line 3 meeting then Am single visits in Mohandseen',
        mondayPm: initialPlan ? (initialPlan.mondayPm ?? '') : isManagerPersonal ? '' : 'Pm single visits in Mohandseen',
        tuesdayAm: initialPlan ? (initialPlan.tuesdayAm ?? '') : isManagerPersonal ? '' : 'Line 1 meeting then Am double visit with Dr. Fawzy Nasser',
        tuesdayPm: initialPlan ? (initialPlan.tuesdayPm ?? '') : isManagerPersonal ? '' : 'Pm double visit with Dr. Fawzy Nasser',
        wednesdayAm: initialPlan ? (initialPlan.wednesdayAm ?? '') : isManagerPersonal ? '' : 'Line 2 meeting then office working',
        wednesdayPm: initialPlan ? (initialPlan.wednesdayPm ?? '') : isManagerPersonal ? '' : 'Office working',
        thursdayAm: initialPlan ? (initialPlan.thursdayAm ?? '') : isManagerPersonal ? '' : 'Line 3 meeting then office working',
        thursdayPm: initialPlan ? (initialPlan.thursdayPm ?? '') : isManagerPersonal ? '' : 'Office working',
        fridayAm: initialPlan ? (initialPlan.fridayAm ?? '') : isManagerPersonal ? '' : 'Field visits / Follow-up',
        fridayPm: initialPlan ? (initialPlan.fridayPm ?? '') : isManagerPersonal ? '' : 'Off / Weekly summary',
    });
    // Find rep details
    const currentRepObj = useMemo(() => {
        return (reps || []).find((r) => r.name === selectedRep);
    }, [reps, selectedRep]);
    // Parent keys this editor by initialPlan.id; initialize all fields together on mount.
    const loadSequence = useRef(0);
    const cancelPendingLoad = useCallback(() => { loadSequence.current++; }, []);
    // Load plans history for selected rep or manager personal
    const loadPlans = useCallback(async () => {
        if (!isManagerPersonal && !selectedRep && !isManager)
            return;
        const sequence = ++loadSequence.current;
        try {
            const url = isManagerPersonal
                ? '/api/weekly-plans?personal=true'
                : selectedRep
                    ? `/api/weekly-plans?rep=${encodeURIComponent(selectedRep)}`
                    : `/api/weekly-plans`;
            const res = await fetch(url);
            const data = await res.json();
            if (sequence !== loadSequence.current)
                return;
            if (res.ok && data.plans) {
                setLoadFailed(false);
                setDirty(false);
                setPlansHistory(data.plans);
                // If there's a plan for the current week, populate it
                const currentMatch = data.plans.find((p: WeeklyPlanRecord) => p.startDate === startDate && (isManagerPersonal || !selectedRep || p.rep === selectedRep));
                if (currentMatch) {
                    setActivePlanId(currentMatch.id);
                    setEndDate(currentMatch.endDate);
                    setWeekLabel(currentMatch.weekLabel || `${currentMatch.startDate} to ${currentMatch.endDate}`);
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
                else {
                    setActivePlanId(null);
                    setPlanStatus('Submitted');
                    setManagerNotes('');
                    {
                        setFormData({
                            saturdayAm: '', saturdayPm: '', sundayAm: '', sundayPm: '',
                            mondayAm: '', mondayPm: '', tuesdayAm: '', tuesdayPm: '',
                            wednesdayAm: '', wednesdayPm: '', thursdayAm: '', thursdayPm: '',
                            fridayAm: '', fridayPm: '',
                        });
                    }
                }
            }
            else {
                setLoadFailed(true);
            }
        }
        catch (err) {
            if (sequence === loadSequence.current)
                setLoadFailed(true);
            console.error('Failed to load weekly plans:', err);
        }
        finally {
            if (sequence === loadSequence.current)
                setLoading(false);
        }
    }, [selectedRep, isManager, isManagerPersonal, startDate, setDirty, setLoadFailed, setPlansHistory, setActivePlanId, setEndDate, setWeekLabel, setPlanStatus, setManagerNotes, setFormData, setLoading]);
    useEffect(() => {
        // The loader updates state only after its external fetch resolves.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadPlans();
        return cancelPendingLoad;
    }, [loadPlans, cancelPendingLoad]);
    const handleStartDateChange = (newStart: string) => {
        const range = getWeekRange(new Date(newStart + 'T12:00:00'));
        if (range.startDate === startDate)
            return;
        cancelPendingLoad();
        setLoading(true);
        setStartDate(range.startDate);
        setEndDate(range.endDate);
        setWeekLabel(range.label);
    };
    const handleDayChange = (key: keyof WeeklyPlanFormState, value: string) => {
        setDirty(true);
        setFormData((prev) => ({
            ...prev, [key]: value
        }));
    };
    const handleApplyPreset = (key: keyof WeeklyPlanFormState, text: string) => {
        setDirty(true);
        setFormData((prev) => {
            const current = (prev[key] || '').trim();
            const next = current ? `${current} | ${text}` : text;
            return {
                ...prev, [key]: next
            };
        });
    };
    const handleClearCell = (key: keyof WeeklyPlanFormState) => {
        setDirty(true);
        setFormData((prev) => ({
            ...prev, [key]: ''
        }));
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
        setDirty(true);
        setFormData((prev) => {
            const nextState = {
                ...prev
            };
            const applyToKey = (key: keyof WeeklyPlanFormState, text: string) => {
                const current = (nextState[key] || '').trim();
                if (insertMode === 'replace' || !current) {
                    nextState[key] = text;
                }
                else {
                    nextState[key] = `${current} | ${text}`;
                }
            };
            if (builderTargetShift === 'am') {
                const text = constructItemText('am');
                applyToKey(amKey, text);
            }
            else if (builderTargetShift === 'pm') {
                const text = constructItemText('pm');
                applyToKey(pmKey, text);
            }
            else if (builderTargetShift === 'both') {
                const amText = constructItemText('am');
                const pmText = constructItemText('pm');
                applyToKey(amKey, amText);
                applyToKey(pmKey, pmText);
            }
            return nextState;
        });
        setShowItemModal(false);
        onSuccess?.(language === 'ar' ? 'تمت إضافة البند إلى الخطة بنجاح ✓' : 'Item added to weekly plan successfully ✓');
    };
    // Apply Full-Week Schedule Templates
    const handleApplyWeekTemplate = (templateType: 'standard' | 'fieldIntensive' | 'doubleFocus' | 'clear') => {
        setDirty(true);
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
            onSuccess?.(language === 'ar' ? 'تم تطبيق الجدول النموذجي المعتمد ✓' : 'Standard schedule template applied ✓');
        }
        else if (templateType === 'fieldIntensive') {
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
            onSuccess?.(language === 'ar' ? 'تم تطبيق نموذج الحقل المكثف ✓' : 'Field Intensive template applied ✓');
        }
        else if (templateType === 'doubleFocus') {
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
            onSuccess?.(language === 'ar' ? 'تم تطبيق نموذج المرافقة الإشرافية ✓' : 'Double Focus template applied ✓');
        }
    };
    const handleSelectHistoryPlan = (plan: WeeklyPlanRecord) => {
        cancelPendingLoad();
        if (plan.startDate !== startDate)
            setLoading(true);
        setDirty(false);
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
        if (loading || loadFailed || saving) return;
        if (!isManagerPersonal && !selectedRep && !isManager) {
            onError?.(t('msg.requiredRep'));
            return;
        }
        if (!startDate || !endDate || startDate > endDate || !Object.values(formData).some(value => value.trim())) {
            onError?.(language === 'ar' ? 'أدخل تاريخاً صحيحاً ونشاطاً واحداً على الأقل' : 'Enter a valid week and at least one activity');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/weekly-plans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rep: isManagerPersonal ? (currentUser?.name || currentUser?.username) : selectedRep,
                    isManagerPersonal: Boolean(isManagerPersonal),
                    startDate,
                    endDate,
                    weekLabel,
                    ...formData,
                    status: 'Submitted',
                    ...(isManagerPersonal ? {} : {
                        managerNotes
                    }),
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                onSuccess?.(data.message || t('msg.planSaved'));
                if (data.plan) {
                    setActivePlanId(data.plan.id);
                }
                await loadPlans();
                return data.plan?.id as string | undefined;
            }
            else {
                onError?.(data.message || t('msg.errorGeneric'));
            }
        }
        catch {
            onError?.(t('msg.errorGeneric'));
        }
        finally {
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
        const savedId = await handleSavePlan();
        if (savedId) {
            window.open(`/api/weekly-plans/${savedId}/export`, '_blank');
            onSuccess?.(t('msg.exportPlanSuccess'));
        }
    };
    const handleCopyLastWeek = () => {
        setDirty(true);
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
            onSuccess?.(language === 'ar' ? 'تم نسخ الخطة السابقة' : 'Previous plan copied');
        }
        else {
            onError?.(language === 'ar' ? 'لا توجد خطة سابقة' : 'No previous plan to copy');
        }
    };
    const ar = language === 'ar';
    const disabled = loading || loadFailed || saving;
    return <div className="space-y-4">
    <SectionCard title={ar ? 'الخطة الأسبوعية' : 'Weekly plan'}>
    <p className="mb-3">{isManagerPersonal ? (currentUser?.name || currentUser?.username) : selectedRep}</p>
    <PlanStatus existing={Boolean(activePlanId)} status={planStatus}/>
    </SectionCard>
 <WeekSelector start={startDate} end={endDate} disabled={saving} onChange={date => protect(() => handleStartDateChange(date))}/>
 {loadFailed && <InlineAlert tone="error">{ar ? 'تعذر تحميل الخطة' : 'Unable to load the plan'} <Button type="button" variant="secondary" onClick={() => { setLoading(true); void loadPlans(); }}>{ar ? 'إعادة المحاولة' : 'Retry'}</Button>
        </InlineAlert>}
 {loading && !initialPlan ? <Skeleton className="h-64"/> : <>
        <SectionCard title={ar ? 'أدوات الخطة' : 'Plan tools'}>
        <fieldset disabled={loading || saving || loadFailed} className="flex min-w-0 flex-wrap gap-2">{(['single', 'double', 'meeting', 'training', 'others'] as const).map((type, index) => <Button type="button" key={type} variant="secondary" onClick={() => handleOpenBuilderForTab(type)}>{(ar ? ['زيارة فردية', 'زيارة مشتركة', 'اجتماع', 'تدريب', 'أخرى'] : ['Single visit', 'Double visit', 'Meeting', 'Training', 'Others'])[index]}</Button>)}<Button type="button" variant="secondary" onClick={() => protect(handleCopyLastWeek)}>{ar ? 'نسخ الخطة السابقة' : 'Copy previous plan'}</Button>{(['standard', 'fieldIntensive', 'doubleFocus', 'clear'] as const).map((type, index) => <Button type="button" key={type} variant="ghost" onClick={() => protect(() => handleApplyWeekTemplate(type))}>{(ar ? ['نموذج قياسي', 'نموذج زيارات ميدانية', 'نموذج زيارات مشتركة', 'مسح الخطة'] : ['Standard template', 'Field template', 'Double visit template', 'Clear plan'])[index]}</Button>)}</fieldset>
        </SectionCard>
 <SectionCard>
        <WeeklyPlanGrid days={DAYS} value={formData} disabled={disabled} onChange={handleDayChange} onFocus={setFocusedCell} onAdd={handleOpenBuilderForCell} onClear={key => protect(() => handleClearCell(key))} onPreset={handleApplyPreset} area={currentRepObj?.area || ''}/>{!isManagerPersonal && (isManager || managerNotes) && <FormField label={ar ? 'ملاحظات الخطة' : 'Plan notes'} value={managerNotes} onChange={value => { setDirty(true); setManagerNotes(value); }} multiline/>}</SectionCard>
        </>}
 <PlanActions saving={saving} disabled={disabled} onSave={() => { if (activePlanId)
        protect(() => void handleSavePlan());
    else
        void handleSavePlan(); }} onExport={() => void handleExportPlanExcel()} onPreview={() => setPreview(true)}/>
 <SectionCard title={ar ? 'الخطط السابقة' : 'Previous plans'}>
    <div className="grid gap-2 sm:grid-cols-2">{plansHistory.map(plan => <Button key={plan.id} type="button" variant="secondary" disabled={saving} onClick={() => protect(() => handleSelectHistoryPlan(plan))}>{plan.weekLabel || plan.startDate}</Button>)}</div>
    </SectionCard>
 <Drawer open={preview} title={ar ? 'معاينة الخطة' : 'Plan preview'} onClose={() => setPreview(false)}>
    <ReportDetails row={{
        id: activePlanId || 'new', type: 'plan', name: weekLabel, date: startDate, owner: isManagerPersonal ? (currentUser?.name || '') : selectedRep, position: '', status: planStatus, record: {
            ...formData, startDate, endDate, managerNotes
        }
    }}/>
    </Drawer>
 <Drawer open={showItemModal} title={ar ? 'إضافة نشاط للخطة' : 'Add plan activity'} onClose={() => setShowItemModal(false)}>
    <form onSubmit={e => { e.preventDefault(); if (insertMode === 'replace') {
        setShowItemModal(false);
        protect(handleInsertItemIntoPlan);
    }
    else
        handleInsertItemIntoPlan(); }} className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2">
    <label>{ar ? 'اليوم' : 'Day'}<select className="min-h-11 w-full rounded-lg border p-2" value={builderTargetDay} onChange={e => setBuilderTargetDay(e.target.value)}>{DAYS.map(day => <option value={day.dayKey} key={day.dayKey}>{ar ? day.dayNameAr : day.dayNameEn}</option>)}</select>
    </label>
    <label>{ar ? 'الفترة' : 'Shift'}<select className="min-h-11 w-full rounded-lg border p-2" value={builderTargetShift} onChange={e => setBuilderTargetShift(e.target.value as ShiftTargetOption)}>
    <option value="am">{ar ? 'صباحاً' : 'AM'}</option>
    <option value="pm">{ar ? 'مساءً' : 'PM'}</option>
    <option value="both">{ar ? 'الفترتان' : 'Both'}</option>
    </select>
    </label>
    <label>{ar ? 'طريقة الإدراج' : 'Insert mode'}<select className="min-h-11 w-full rounded-lg border p-2" value={insertMode} onChange={e => setInsertMode(e.target.value as InsertModeOption)}>
    <option value="append">{ar ? 'إضافة للنص الحالي' : 'Append'}</option>
    <option value="replace">{ar ? 'استبدال النص الحالي' : 'Replace'}</option>
    </select>
    </label>
    </div>
 {activeItemTab === 'single' && <>
        <FormField label={ar ? 'مقدمة' : 'Prefix'} value={singlePrefix} onChange={setSinglePrefix}/>
        <FormField label={ar ? 'المنطقة' : 'Area'} value={singleArea} onChange={setSingleArea}/>
        <FormField label={ar ? 'ملاحظات' : 'Notes'} value={singleNotes} onChange={setSingleNotes}/>
        </>}
 {activeItemTab === 'double' && <>
        <FormField label={ar ? 'مقدمة' : 'Prefix'} value={doublePrefix} onChange={setDoublePrefix}/>
        <FormField label={ar ? 'المرافق' : 'Companion'} value={doubleCompanion} onChange={setDoubleCompanion}/>
        <FormField label={ar ? 'المنطقة' : 'Area'} value={doubleArea} onChange={setDoubleArea}/>
        </>}
 {activeItemTab === 'meeting' && <>
        <FormField label={ar ? 'الاجتماع' : 'Meeting'} value={meetingType} onChange={setMeetingType}/>
        <FormField label={ar ? 'النشاط التالي' : 'Following activity'} value={meetingAfter} onChange={setMeetingAfter}/>
        </>}
 {activeItemTab === 'training' && <>
        <FormField label={ar ? 'الموضوع' : 'Topic'} value={trainingTopic} onChange={setTrainingTopic}/>
        <FormField label={ar ? 'التفاصيل' : 'Details'} value={trainingCustom} onChange={setTrainingCustom}/>
        </>}
 {activeItemTab === 'others' && <>
        <FormField label={ar ? 'النوع' : 'Type'} value={othersType} onChange={setOthersType}/>
        <FormField label={ar ? 'التفاصيل' : 'Details'} value={othersDetails} onChange={setOthersDetails}/>
        </>}
 <SectionCard title={ar ? 'النص الذي سيضاف' : 'Text to insert'}>
    <p className="break-words">{constructItemText(builderTargetShift)}</p>
    </SectionCard>
    <Button type="submit">{ar ? 'إدراج النشاط' : 'Insert activity'}</Button>
    </form>
    </Drawer>
 <ConfirmDialog open={Boolean(confirmation)} title={ar ? 'تأكيد استبدال البيانات' : 'Confirm replacing data'} description={ar ? 'قد يستبدل هذا الإجراء محتوى الخطة الحالي. هل تريد المتابعة؟' : 'This action may replace the current plan content. Continue?'} onClose={() => setConfirmation(null)} onConfirm={() => { const action = confirmation?.action; setConfirmation(null); action?.(); }}/>
 </div>;
}
