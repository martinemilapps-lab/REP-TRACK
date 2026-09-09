'use client';
import { useMemo, useState, type ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { useTranslation } from '@/lib/i18nContext';
import { filterReports, type ReportRow } from '@/lib/reportExplorer';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { SectionCard } from '@/components/ui/SectionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
const labels: Record<string, [
    string,
    string
]> = {
    Visited: ['Visited', 'تمت الزيارة'], Overdue: ['Overdue', 'متأخرة'], 'Not visited yet': ['Not visited yet', 'لم تتم الزيارة'], Available: ['Available', 'متوفر'], 'Not Available': ['Not available', 'غير متوفر'], Single: ['Single', 'فردية'], Double: ['Double', 'مشتركة'],
    hospital: ['Hospital visit', 'زيارة مستشفى'], pharmacy: ['Pharmacy visit', 'زيارة صيدلية'], doctor: ['Doctor visit', 'زيارة طبيب'], branch: ['Distribution branch visit', 'زيارة فرع توزيع'], availability: ['Product availability', 'توافر المنتجات'], event: ['Event', 'فعالية'], training: ['Training', 'تدريب'], special_task: ['Special task', 'مهمة خاصة'], Visit: ['Visit', 'زيارة'], Event: ['Event', 'فعالية'], Training: ['Training', 'تدريب'], 'Office Working': ['Office Working', 'عمل مكتبي'], Others: ['Others', 'أخرى'], plan: ['Personal weekly plan', 'الخطة الأسبوعية الشخصية'], Submitted: ['Submitted', 'مقدمة'], Draft: ['Draft', 'مسودة'],
};
export function reportLabel(value: string, ar: boolean) { return labels[value]?.[ar ? 1 : 0] || value; }
const fields: Record<string, [
    string,
    string
]> = {
    type: ['Hospital type', 'نوع المستشفى'], dept: ['Department', 'القسم'], drsVisited: ['Doctors visited', 'عدد الأطباء'], doctorNames: ['Doctor names', 'أسماء الأطباء'], cycle: ['Visit cycle', 'دورة الزيارة'], ourProducts: ['Our products', 'منتجاتنا'], competitor: ['Competitor', 'المنافس'], address: ['Address', 'العنوان'], pharmacist: ['Pharmacist', 'الصيدلي'], stockPerMonth: ['Monthly stock', 'المخزون الشهري'], salesPerMonth: ['Recorded monthly sales', 'المبيعات الشهرية المسجلة'], code: ['Code', 'الكود'], f1: ['Product 1', 'المنتج الأول'], f2: ['Product 2', 'المنتج الثاني'], f3: ['Product 3', 'المنتج الثالث'], reminder: ['Reminder', 'تذكير'], monthlyStock: ['Monthly stock', 'المخزون الشهري'], monthlySales: ['Recorded monthly sales', 'المبيعات الشهرية المسجلة'],
    name: ['Customer', 'العميل'], hospital: ['Hospital', 'المستشفى'], area: ['Area', 'المنطقة'], title: ['Title', 'العنوان'], objective: ['Objective', 'الهدف'], visitType: ['Visit type', 'نوع الزيارة'], companion: ['Companion', 'المرافق'], accompaniedPerson: ['Accompanied person', 'الشخص المرافق'], specialty: ['Specialty', 'التخصص'], workplace: ['Workplace', 'مكان العمل'], nearbyPharmacy: ['Nearby pharmacy', 'الصيدلية القريبة'], mobile: ['Mobile', 'الهاتف المحمول'], phone: ['Phone', 'الهاتف'], contact: ['Contact', 'جهة الاتصال'], cls: ['Class', 'التصنيف'], prescriptionRate: ['Prescription rate', 'معدل الوصفات'], visitDate: ['Visit date', 'تاريخ الزيارة'], lastVisit: ['Last visit', 'آخر زيارة'], nextVisit: ['Next visit', 'الزيارة القادمة'], status: ['Status', 'الحالة'], products: ['Products', 'المنتجات'], product: ['Product', 'المنتج'], month: ['Month', 'الشهر'], notes: ['Notes', 'ملاحظات'], eventName: ['Event name', 'اسم الفعالية'], eventType: ['Event type', 'نوع الفعالية'], eventDate: ['Event date', 'تاريخ الفعالية'], location: ['Location', 'المكان'], attendeesCount: ['Attendee count', 'عدد الحضور'], attendees: ['Attendees', 'الحضور'], targetSpecialty: ['Target specialty', 'التخصص المستهدف'], feedback: ['Feedback', 'النتائج'], trainingTopic: ['Training topic', 'موضوع التدريب'], trainingType: ['Training type', 'نوع التدريب'], trainingDate: ['Training date', 'تاريخ التدريب'], trainer: ['Trainer', 'المدرب'], durationHours: ['Hours', 'الساعات'], outcomes: ['Outcomes', 'المخرجات'], taskCategory: ['Category', 'التصنيف'], taskDate: ['Task date', 'تاريخ المهمة'], assignedBy: ['Assigned by', 'بتكليف من'], priority: ['Priority', 'الأولوية'], description: ['Description', 'الوصف'], activityDate: ['Activity date', 'تاريخ النشاط'], morningHospitalName: ['Morning hospital', 'مستشفى الفترة الصباحية'], morningDoctorNames: ['Morning doctors', 'أطباء الفترة الصباحية'], morningSpecialty: ['Morning specialty', 'تخصص الفترة الصباحية'], morningHospitalComment: ['Morning comment', 'تعليق الفترة الصباحية'], afternoonDoctorNames: ['Afternoon doctors', 'أطباء الفترة المسائية'], afternoonSpecialty: ['Afternoon specialty', 'تخصص الفترة المسائية'], afternoonDoctorComment: ['Doctor comment', 'تعليق الطبيب'], afternoonPharmacyName: ['Afternoon pharmacy', 'صيدلية الفترة المسائية'], afternoonPharmacyComment: ['Pharmacy comment', 'تعليق الصيدلية'], generalComment: ['General comment', 'تعليق عام'], budget: ['Budget', 'الميزانية'], trainingLocation: ['Training location', 'مكان التدريب'], participants: ['Participants', 'المشاركون'], workSummary: ['Work summary', 'ملخص العمل'], startDate: ['Start date', 'تاريخ البداية'], endDate: ['End date', 'تاريخ النهاية'], managerNotes: ['Plan notes', 'ملاحظات الخطة'],
};
const days = [['saturday', 'Saturday', 'السبت'], ['sunday', 'Sunday', 'الأحد'], ['monday', 'Monday', 'الاثنين'], ['tuesday', 'Tuesday', 'الثلاثاء'], ['wednesday', 'Wednesday', 'الأربعاء'], ['thursday', 'Thursday', 'الخميس'], ['friday', 'Friday', 'الجمعة']];
export function ReportDetails({ row }: {
    row: ReportRow;
}) {
    const { language } = useTranslation();
    const ar = language === 'ar';
    return <div className="space-y-4 break-words">
    <StatusBadge>{reportLabel(row.type, ar)}</StatusBadge>
    <p>{row.owner} {row.position}</p>
    <dl className="grid gap-3 sm:grid-cols-2">{Object.entries(fields).map(([key, label]) => {
            const value = row.record[key];
            return value === undefined || value === null || value === '' ? null : <div key={key}>
            <dt className="text-xs text-[var(--ink-soft)]">{label[ar ? 1 : 0]}</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd>
            </div>;
        })}</dl>{row.type === 'plan' && days.map(([day, en, arabic]) => <SectionCard key={day} title={ar ? arabic : en}>
        <p className="whitespace-pre-wrap">
        <b>{ar ? 'صباحاً' : 'AM'}:</b> {String(row.record[`${day}Am`] || '—')}</p>
        <p className="mt-2 whitespace-pre-wrap">
        <b>{ar ? 'مساءً' : 'PM'}:</b> {String(row.record[`${day}Pm`] || '—')}</p>
        </SectionCard>)}</div>;
}
export function ReportExplorer({ rows, loading, error, retry, team = false, initialType = '', actions }: {
    rows: ReportRow[];
    loading: boolean;
    error: boolean;
    retry: () => void;
    team?: boolean;
    initialType?: string;
    actions?: (row: ReportRow) => ReactNode;
}) {
    const { language } = useTranslation();
    const ar = language === 'ar';
    const l = (en: string, arabic: string) => ar ? arabic : en;
    const [search, setSearch] = useState(''), [type, setType] = useState(initialType), [entity, setEntity] = useState(''), [owner, setOwner] = useState(''), [position, setPosition] = useState(''), [start, setStart] = useState(''), [end, setEnd] = useState(''), [sort, setSort] = useState('newest'), [selected, setSelected] = useState<ReportRow | null>(null);
    const activeSelected = rows.find(row => row.id === selected?.id) || null;
    const filtered = useMemo(() => filterReports(rows, {
        search, type, entity, owner, position, start, end, sort
    }), [rows, search, type, entity, owner, position, start, end, sort]);
    const select = (label: string, value: string, change: (v: string) => void, values: string[], translate = false) => <label className="min-w-0 flex-1 text-xs font-semibold">{label}<select aria-label={label} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2" value={value} onChange={e => change(e.target.value)}>
    <option value="">{l('All', 'الكل')}</option>{values.map(v => <option key={v} value={v}>{translate ? reportLabel(v, ar) : v}</option>)}</select>
    </label>;
    const unique = (key: 'type' | 'name' | 'owner' | 'position') => [...new Set(rows.map(r => r[key]).filter(Boolean))].sort();
    const controls = (r: ReportRow) => <div className="flex flex-wrap gap-2">
    <Button type="button" size="sm" variant="secondary" onClick={() => setSelected(r)}>{l('Details', 'التفاصيل')}</Button>{actions?.(r)}</div>;
    return <div className="space-y-4">
    <FilterBar>
    <label className="min-w-0 flex-1 text-xs font-semibold">{l('Search', 'بحث')}<input type="search" value={search} onChange={e => setSearch(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] px-3"/>
    </label>{select(l('Report type', 'نوع التقرير'), type, setType, unique('type'), true)}{select(l('Customer / title', 'العميل / العنوان'), entity, setEntity, unique('name'))}</FilterBar>
    <FilterBar>{team && <>{select(l('Subordinate', 'الموظف'), owner, setOwner, unique('owner'))}{select(l('Position', 'المنصب'), position, setPosition, unique('position'))}</>}{[['From', 'من', start, setStart], ['To', 'إلى', end, setEnd]].map(([en, arabic, value, set]) => <label key={String(en)} className="min-w-0 flex-1 text-xs font-semibold">{l(String(en), String(arabic))}<input type="date" value={String(value)} onChange={e => (set as (v: string) => void)(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] px-2"/>
        </label>)}<label className="min-w-0 flex-1 text-xs font-semibold">{l('Sort', 'الترتيب')}<select value={sort} onChange={e => setSort(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] px-2">
    <option value="newest">{l('Newest first', 'الأحدث أولاً')}</option>
    <option value="oldest">{l('Oldest first', 'الأقدم أولاً')}</option>
    <option value="name">{l('Customer / title', 'العميل / العنوان')}</option>
    </select>
    </label>
    <Button type="button" variant="secondary" onClick={() => { setSearch(''); setType(initialType); setEntity(''); setOwner(''); setPosition(''); setStart(''); setEnd(''); setSort('newest'); }}>{l('Reset', 'إعادة تعيين')}</Button>
    </FilterBar>{start && end && start > end && <InlineAlert tone="warning">{l('The end date must be on or after the start date.', 'يجب أن يكون تاريخ النهاية بعد تاريخ البداية أو مساوياً له.')}</InlineAlert>}
 {error ? <InlineAlert tone="error">{l('Reports could not be loaded.', 'تعذر تحميل التقارير.')} <Button type="button" variant="secondary" onClick={retry}>{l('Retry', 'إعادة المحاولة')}</Button>
        </InlineAlert> : loading ? <div aria-label={l('Loading reports', 'تحميل التقارير')} className="grid gap-3">{[1, 2, 3].map(n => <Skeleton key={n} className="h-28"/>)}</div> : <>
        <p role="status" className="text-sm text-[var(--ink-soft)]">{filtered.length} {l('results in loaded reports', 'نتيجة ضمن التقارير المحملة')}</p>{!filtered.length ? <EmptyState title={l('No matching reports', 'لا توجد تقارير مطابقة')} description={l('Change or reset the filters to see more records.', 'غيّر عوامل التصفية أو أعد تعيينها لعرض المزيد.')} icon={<FileText className="size-6"/>}/> : <>
            <div className="hidden lg:block">
            <DataTable label={l('Reports', 'التقارير')} headers={[l('Customer / title', 'العميل / العنوان'), l('Type', 'النوع'), ...(team ? [l('Owner', 'الموظف')] : []), l('Date', 'التاريخ'), l('Actions', 'الإجراءات')]}>{filtered.map(r => <tr key={r.id}>
                <td className="max-w-64 break-words p-4">{r.name || '—'}</td>
                <td className="p-4">
                <StatusBadge>{reportLabel(r.type, ar)}</StatusBadge>{r.status && <p className="mt-2 text-xs">{reportLabel(r.status, ar)}</p>}</td>{team && <td className="p-4">{r.owner}<p className="text-xs text-[var(--ink-soft)]">{r.position}</p>
                    </td>}<td className="p-4">{r.date || '—'}</td>
                <td className="p-4">{controls(r)}</td>
                </tr>)}</DataTable>
            </div>
            <div className="grid gap-3 lg:hidden">{filtered.map(r => <SectionCard key={r.id} title={r.name || reportLabel(r.type, ar)}>
                <div className="mb-3 flex flex-wrap gap-2">
                <StatusBadge>{reportLabel(r.type, ar)}</StatusBadge>{r.status && <StatusBadge>{reportLabel(r.status, ar)}</StatusBadge>}<span className="text-sm">{r.date}</span>
                </div>{team && <p className="mb-3 break-words text-sm">{r.owner} · {r.position}</p>}{controls(r)}</SectionCard>)}</div>
            </>}</>}
 <Drawer open={Boolean(activeSelected) && !loading && !error} title={activeSelected?.name || l('Report details', 'تفاصيل التقرير')} onClose={() => setSelected(null)}>{activeSelected && <>
        <ReportDetails row={activeSelected}/>
        <div className="mt-5 flex flex-wrap gap-2">{actions?.(activeSelected)}</div>
        </>}</Drawer>
    </div>;
}
