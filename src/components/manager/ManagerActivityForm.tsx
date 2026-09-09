'use client';
import React, { useState } from 'react';
import { ManagerActivityType } from '@/types';
import { useTranslation } from '@/lib/i18nContext';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { FormSection } from '@/components/ui/FormSection';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { Briefcase, CalendarDays, ClipboardList, GraduationCap, Users } from 'lucide-react';
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
export function ManagerActivityForm({ currentUser, onSuccess, onError, onSubmitted, }: ManagerActivityFormProps) {
    const { language } = useTranslation();
    const isAr = language === 'ar';
    const [notice, setNotice] = useState<{
        error: boolean;
        text: string;
    } | null>(null);
    const reportError = (text: string) => { setNotice({
        error: true, text
    }); onError?.(text); };
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
            reportError(isAr ? 'يرجى تحديد تاريخ النشاط' : 'Activity date is required');
            return;
        }
        if (activityType === 'Visit' && visitType === 'Double' && !accompaniedPerson.trim()) {
            reportError(isAr ? 'في الزيارة المشتركة (Double Visit) يجب تحديد الشخص المرافق' : 'Accompanied person is required for double visits');
            return;
        }
        if (activityType === 'Event' && !eventName.trim()) {
            reportError(isAr ? 'يرجى إدخال اسم الفعالية' : 'Event name is required');
            return;
        }
        if (activityType === 'Training' && !trainingTopic.trim()) {
            reportError(isAr ? 'يرجى إدخال موضوع التدريب' : 'Training topic is required');
            return;
        }
        if (activityType === 'Office Working' && !workSummary.trim()) {
            reportError(isAr ? 'يرجى إدخال ملخص العمل المكتبي' : 'Work summary is required');
            return;
        }
        if (activityType === 'Others' && !otherDescription.trim()) {
            reportError(isAr ? 'يرجى إدخال وصف النشاط' : 'Description is required');
            return;
        }
        if (saving)
            return;
        setNotice(null);
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
            }
            else if (activityType === 'Event') {
                payload.eventName = eventName.trim();
                payload.eventType = eventType.trim();
                payload.location = eventLocation.trim();
                payload.attendees = eventAttendees.trim();
                payload.budget = eventBudget.trim();
            }
            else if (activityType === 'Training') {
                payload.trainingTopic = trainingTopic.trim();
                payload.trainingType = trainingType.trim();
                payload.trainingLocation = trainingLocation.trim();
                payload.participants = trainingParticipants.trim();
            }
            else if (activityType === 'Office Working') {
                payload.workSummary = workSummary.trim();
            }
            else if (activityType === 'Others') {
                payload.description = otherDescription.trim();
            }
            const res = await fetch('/api/manager/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                onSuccess?.(data.message || (isAr ? 'تم حفظ التقرير بنجاح ✓' : 'Activity report saved successfully ✓'));
                setNotice({
                    error: false, text: isAr ? 'تم حفظ تقرير النشاط' : 'Activity report saved'
                });
                resetForm();
                onSubmitted?.();
            }
            else {
                reportError(data.message || (isAr ? 'حدث خطأ أثناء حفظ التقرير' : 'Failed to save activity'));
            }
        }
        catch {
            reportError(isAr ? 'حدث خطأ غير متوقع أثناء الاتصال' : 'An unexpected error occurred');
        }
        finally {
            setSaving(false);
        }
    };
    const activityTabs = [{
            type: 'Visit', ar: 'زيارة', icon: Users
        }, {
            type: 'Event', ar: 'فعالية', icon: CalendarDays
        }, {
            type: 'Training', ar: 'تدريب', icon: GraduationCap
        }, {
            type: 'Office Working', ar: 'عمل مكتبي', icon: Briefcase
        }, {
            type: 'Others', ar: 'أخرى', icon: ClipboardList
        }] as const;
    return <div className="space-y-4">
    <p className="text-sm font-semibold">{currentUser?.name || currentUser?.username}</p>{notice && <InlineAlert tone={notice.error ? 'error' : 'success'}>{notice.text}</InlineAlert>}<form onSubmit={handleSubmit} className="space-y-5">
    <fieldset disabled={saving} className="min-w-0 space-y-5">
    <legend className="mb-3 text-lg font-semibold">{isAr ? 'تقرير نشاط الإدارة' : 'Manager activity report'}</legend>
    <div className="flex flex-wrap gap-2" role="group" aria-label={isAr ? 'نوع النشاط' : 'Activity type'}>{activityTabs.map(({ type, ar, icon: Icon }) => <Button type="button" key={type} aria-pressed={activityType === type} variant={activityType === type ? 'primary' : 'secondary'} leftIcon={<Icon className="size-4"/>} onClick={() => { setActivityType(type); setNotice(null); }}>{isAr ? ar : type}</Button>)}</div>
    <FormSection title={isAr ? 'تاريخ النشاط' : 'Activity date'}>
    <FormField label={isAr ? 'التاريخ' : 'Date'} value={activityDate} onChange={setActivityDate} required type="date"/>
    </FormSection>
        {activityType === 'Visit' && <>
        <FormSection title={isAr ? 'الزيارة' : 'Visit'}>
        <label className="text-sm font-semibold">{isAr ? 'نوع الزيارة' : 'Visit type'}<select aria-label={isAr ? 'نوع الزيارة' : 'Visit type'} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] px-3" value={visitType} onChange={e => setVisitType(e.target.value as 'Single' | 'Double')}>
        <option value="Single">{isAr ? 'فردية' : 'Single'}</option>
        <option value="Double">{isAr ? 'مشتركة' : 'Double'}</option>
        </select>
        </label>{visitType === 'Double' && <FormField label={isAr ? 'الشخص المرافق' : 'Accompanied person'} value={accompaniedPerson} onChange={setAccompaniedPerson} required/>}</FormSection>
        <FormSection title={isAr ? 'الفترة الصباحية' : 'Morning'}>
        <FormField label={isAr ? 'المستشفى' : 'Hospital'} value={morningHospitalName} onChange={setMorningHospitalName}/>
        <FormField label={isAr ? 'الأطباء' : 'Doctors'} value={morningDoctorNames} onChange={setMorningDoctorNames}/>
        <FormField label={isAr ? 'التخصص' : 'Specialty'} value={morningSpecialty} onChange={setMorningSpecialty}/>
        <FormField label={isAr ? 'تعليق المستشفى' : 'Hospital comment'} value={morningHospitalComment} onChange={setMorningHospitalComment} multiline/>
        </FormSection>
        <FormSection title={isAr ? 'الفترة المسائية' : 'Afternoon'}>
        <FormField label={isAr ? 'الأطباء' : 'Doctors'} value={afternoonDoctorNames} onChange={setAfternoonDoctorNames}/>
        <FormField label={isAr ? 'التخصص' : 'Specialty'} value={afternoonSpecialty} onChange={setAfternoonSpecialty}/>
        <FormField label={isAr ? 'تعليق الطبيب' : 'Doctor comment'} value={afternoonDoctorComment} onChange={setAfternoonDoctorComment} multiline/>
        <FormField label={isAr ? 'الصيدلية' : 'Pharmacy'} value={afternoonPharmacyName} onChange={setAfternoonPharmacyName}/>
        <FormField label={isAr ? 'تعليق الصيدلية' : 'Pharmacy comment'} value={afternoonPharmacyComment} onChange={setAfternoonPharmacyComment} multiline/>
        </FormSection>
        <FormSection title={isAr ? 'تعليق عام' : 'General comment'}>
        <FormField label={isAr ? 'التعليق' : 'Comment'} value={generalComment} onChange={setGeneralComment} multiline/>
        </FormSection>
        </>}
        {activityType === 'Event' && <FormSection title={isAr ? 'تفاصيل الفعالية' : 'Event details'}>
        <FormField label={isAr ? 'اسم الفعالية' : 'Event name'} value={eventName} onChange={setEventName} required/>
        <FormField label={isAr ? 'نوع الفعالية' : 'Event type'} value={eventType} onChange={setEventType}/>
        <FormField label={isAr ? 'المكان' : 'Location'} value={eventLocation} onChange={setEventLocation}/>
        <FormField label={isAr ? 'الحضور' : 'Attendees'} value={eventAttendees} onChange={setEventAttendees}/>
        <FormField label={isAr ? 'الميزانية' : 'Budget'} value={eventBudget} onChange={setEventBudget}/>
        </FormSection>}
        {activityType === 'Training' && <FormSection title={isAr ? 'تفاصيل التدريب' : 'Training details'}>
        <FormField label={isAr ? 'موضوع التدريب' : 'Training topic'} value={trainingTopic} onChange={setTrainingTopic} required/>
        <FormField label={isAr ? 'نوع التدريب' : 'Training type'} value={trainingType} onChange={setTrainingType}/>
        <FormField label={isAr ? 'المكان' : 'Location'} value={trainingLocation} onChange={setTrainingLocation}/>
        <FormField label={isAr ? 'المشاركون' : 'Participants'} value={trainingParticipants} onChange={setTrainingParticipants}/>
        </FormSection>}
        {activityType === 'Office Working' && <FormSection title={isAr ? 'العمل المكتبي' : 'Office Working'}>
        <FormField label={isAr ? 'ملخص العمل' : 'Work summary'} value={workSummary} onChange={setWorkSummary} multiline required/>
        </FormSection>}
        {activityType === 'Others' && <FormSection title={isAr ? 'أخرى' : 'Others'}>
        <FormField label={isAr ? 'الوصف' : 'Description'} value={otherDescription} onChange={setOtherDescription} multiline required/>
        </FormSection>}
    <FormSection title={isAr ? 'ملاحظات إضافية' : 'Additional notes'}>
    <FormField label={isAr ? 'ملاحظات' : 'Notes'} value={notes} onChange={setNotes} multiline/>
    </FormSection>
    <div className="flex flex-wrap justify-end gap-3">
    <Button type="button" variant="secondary" onClick={resetForm}>{isAr ? 'إعادة تعيين' : 'Reset'}</Button>
    <Button type="submit" isLoading={saving}>{isAr ? 'حفظ تقرير النشاط' : 'Submit activity report'}</Button>
    </div>
    </fieldset>
    </form>
    </div>;
}
