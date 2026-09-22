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
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';

const labels: Record<string, [string, string]> = {
    Visited: ['Visited', 'تمت الزيارة'], Overdue: ['Overdue', 'متأخرة'], 'Not visited yet': ['Not visited yet', 'لم تتم الزيارة'], Available: ['Available', 'متوفر'], 'Not Available': ['Not available', 'غير متوفر'], Single: ['Single', 'فردية'], Double: ['Double', 'مشتركة'],
    hospital: ['Hospital visit', 'زيارة مستشفى'], pharmacy: ['Pharmacy visit', 'زيارة صيدلية'], doctor: ['Doctor visit', 'زيارة طبيب'], branch: ['Distribution branch visit', 'زيارة فرع توزيع'], availability: ['Product availability', 'توافر المنتجات'], event: ['Event', 'فعالية'], training: ['Training', 'تدريب'], special_task: ['Special task', 'مهمة خاصة'], Visit: ['Visit', 'زيارة'], Event: ['Event', 'فعالية'], Training: ['Training', 'تدريب'], 'Office Working': ['Office Working', 'عمل مكتبي'], Others: ['Others', 'أخرى'], plan: ['Personal weekly plan', 'الخطة الأسبوعية الشخصية'], Submitted: ['Submitted', 'مقدمة'], Draft: ['Draft', 'مسودة'],
};
export function reportLabel(value: string, ar: boolean) { return labels[value]?.[ar ? 1 : 0] || value; }

const fields: Record<string, [string, string]> = {
    eventFeedback: ['Event Feedback', 'تقييم الفعالية'], productsDiscussed: ['Products Discussed', 'المنتجات التي تمت مناقشتها'], visits: ['AM / PM Visits', 'زيارات AM / PM'],
    type: ['Hospital type', 'نوع المستشفى'], dept: ['Department', 'القسم'], drsVisited: ['Doctors visited', 'عدد الأطباء'], doctorNames: ['Doctor names', 'أسماء الأطباء'], cycle: ['Visit cycle', 'دورة الزيارة'], ourProducts: ['Our products', 'منتجاتنا'], competitor: ['Competitor', 'المنافس'], address: ['Address', 'العنوان'], pharmacist: ['Pharmacist', 'الصيدلي'], stockPerMonth: ['Monthly stock', 'المخزون الشهري'], salesPerMonth: ['Recorded monthly sales', 'المبيعات الشهرية المسجلة'], code: ['Code', 'الكود'], f1: ['Product 1', 'المنتج الأول'], f2: ['Product 2', 'المنتج الثاني'], f3: ['Product 3', 'المنتج الثالث'], reminder: ['Reminder', 'تذكير'], monthlyStock: ['Monthly stock', 'المخزون الشهري'], monthlySales: ['Recorded monthly sales', 'المبيعات الشهرية المسجلة'],
    name: ['Customer', 'العميل'], hospital: ['Hospital', 'المستشفى'], area: ['Area', 'المنطقة'], title: ['Title', 'العنوان'], objective: ['Objective', 'الهدف'], objectiveOtherText: ['Others description', 'وصف أخرى'], visitType: ['Visit type', 'نوع الزيارة'], companion: ['Companion', 'المرافق'], accompaniedPerson: ['Accompanied person', 'الشخص المرافق'], specialty: ['Specialty', 'التخصص'], workplace: ['Workplace', 'مكان العمل'], nearbyPharmacy: ['Nearby pharmacy', 'الصيدلية القريبة'], mobile: ['Mobile', 'الهاتف المحمول'], phone: ['Phone', 'الهاتف'], contact: ['Contact', 'جهة الاتصال'], cls: ['Class', 'التصنيف'], prescriptionRate: ['Prescription rate', 'معدل الوصفات'], visitDate: ['Visit date', 'تاريخ الزيارة'], lastVisit: ['Last visit', 'آخر زيارة'], nextVisit: ['Next visit', 'الزيارة القادمة'], status: ['Status', 'الحالة'], products: ['Products', 'المنتجات'], product: ['Product', 'المنتج'], month: ['Month', 'الشهر'], notes: ['Notes', 'ملاحظات'], eventName: ['Event name', 'اسم الفعالية'], eventType: ['Event type', 'نوع الفعالية'], eventDate: ['Event date', 'تاريخ الفعالية'], location: ['Location', 'المكان'], attendeesCount: ['Attendee count', 'عدد الحضور'], attendees: ['Attendees', 'الحضور'], targetSpecialty: ['Target specialty', 'التخصص المستهدف'], feedback: ['Feedback', 'النتائج'], trainingTopic: ['Training topic', 'موضوع التدريب'], trainingType: ['Training type', 'نوع التدريب'], trainingDate: ['Training date', 'تاريخ التدريب'], trainer: ['Trainer', 'المدرب'], durationHours: ['Hours', 'الساعات'], outcomes: ['Outcomes', 'المخرجات'], taskCategory: ['Category', 'التصنيف'], taskDate: ['Task date', 'تاريخ المهمة'], assignedBy: ['Assigned by', 'بتكليف من'], priority: ['Priority', 'الأولوية'], description: ['Description', 'الوصف'], activityDate: ['Activity date', 'تاريخ النشاط'], morningHospitalName: ['Morning hospital', 'مستشفى الفترة الصباحية'], morningDoctorNames: ['Morning doctors', 'أطباء الفترة الصباحية'], morningSpecialty: ['Morning specialty', 'تخصص الفترة الصباحية'], morningHospitalComment: ['Morning comment', 'تعليق الفترة الصباحية'], afternoonDoctorNames: ['Afternoon doctors', 'أطباء الفترة المسائية'], afternoonSpecialty: ['Afternoon specialty', 'تخصص الفترة المسائية'], afternoonDoctorComment: ['Doctor comment', 'تعليق الطبيب'], afternoonPharmacyName: ['Afternoon pharmacy', 'صيدلية الفترة المسائية'], afternoonPharmacyComment: ['Pharmacy comment', 'تعليق الصيدلية'], generalComment: ['General comment', 'تعليق عام'], budget: ['Budget', 'الميزانية'], trainingLocation: ['Training location', 'مكان التدريب'], participants: ['Participants', 'المشاركون'], workSummary: ['Work summary', 'ملخص العمل'], startDate: ['Start date', 'تاريخ البداية'], endDate: ['End date', 'تاريخ النهاية'], managerNotes: ['Plan notes', 'ملاحظات الخطة'],
};

const days = [['saturday', 'Saturday', 'السبت'], ['sunday', 'Sunday', 'الأحد'], ['monday', 'Monday', 'الاثنين'], ['tuesday', 'Tuesday', 'الثلاثاء'], ['wednesday', 'Wednesday', 'الأربعاء'], ['thursday', 'Thursday', 'الخميس'], ['friday', 'Friday', 'الجمعة']] as const;

export function renderCleanValue(key: string, value: unknown, ar: boolean): ReactNode {
    if (value === undefined || value === null || value === '') return '—';

    // Try parsing if string contains JSON array or object
    let parsed = value;
    if (typeof value === 'string' && (value.trim().startsWith('[') || value.trim().startsWith('{'))) {
        try {
            parsed = JSON.parse(value.trim());
        } catch {
            parsed = value;
        }
    }

    // Handle parsed arrays
    if (Array.isArray(parsed)) {
        if (parsed.length === 0) return '—';

        // Array of department objects with doctors
        if (typeof parsed[0] === 'object' && parsed[0] !== null && ('department' in parsed[0] || 'doctors' in parsed[0])) {
            return (
                <div className="mt-1 space-y-1.5">
                    {parsed.map((dept: Record<string, unknown>, idx: number) => {
                        const doctorsList = Array.isArray(dept.doctors)
                            ? dept.doctors.map((d: unknown) => typeof d === 'object' && d !== null ? (d as Record<string, unknown>).doctorName || (d as Record<string, unknown>).name : String(d)).filter(Boolean).join(', ')
                            : '—';
                        return (
                            <div key={idx} className="rounded-lg border border-[var(--line)] bg-[var(--surface-subtle)] p-2 text-xs">
                                <span className="font-bold text-[var(--gold-dark)]">{String(dept.department || 'Department')}: </span>
                                <span>{doctorsList || '—'}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Array of objects (like ourProducts: [{ productId, name }])
        if (typeof parsed[0] === 'object' && parsed[0] !== null) {
            return (
                <div className="mt-1 flex flex-wrap gap-1.5">
                    {parsed.map((item: Record<string, unknown>, idx: number) => {
                        const name = String(item.name || item.product || item.title || item.canonicalName || '');
                        const extra = String(item.prescriptionRate || item.rate || item.observation || item.note || '');
                        return (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--surface-hover)] px-2.5 py-1 text-xs font-semibold text-[var(--ink)] shadow-2xs"
                            >
                                <span>{name || JSON.stringify(item)}</span>
                                {extra && (
                                    <span className="rounded bg-[var(--gold)]/15 px-1.5 py-0.2 text-[10px] font-bold text-[var(--gold-dark)]">
                                        {extra}
                                    </span>
                                )}
                            </span>
                        );
                    })}
                </div>
            );
        }

        // Array of strings (like doctorNames: ["Dr. Smith"] or hospitalTypes: ["Private"])
        return (
            <div className="mt-1 flex flex-wrap gap-1.5">
                {parsed.map((str: unknown, idx: number) => (
                    <span
                        key={idx}
                        className="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200"
                    >
                        {String(str)}
                    </span>
                ))}
            </div>
        );
    }

    // Handle parsed key-value objects
    if (typeof parsed === 'object' && parsed !== null) {
        const obj = parsed as Record<string, unknown>;
        // If it's a Weekly Plan structured cell (am/pm cell)
        if ('hospitalIds' in obj || 'doctorIds' in obj || 'activities' in obj) {
            return renderStructuredPlanCell(obj, ar);
        }

        return (
            <div className="mt-1 flex flex-wrap gap-1.5">
                {Object.entries(obj).map(([k, v], idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface-subtle)] px-2 py-0.5 text-xs">
                        <b className="text-[var(--ink-soft)]">{k}:</b> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </span>
                ))}
            </div>
        );
    }

    // Regular string or number
    return String(parsed);
}

export function renderStructuredPlanCell(cell: Record<string, unknown>, ar: boolean): ReactNode {
    const l = (en: string, arabic: string) => ar ? arabic : en;
    const acts = Array.isArray(cell.activities) ? cell.activities : [];
    const hospitals = Array.isArray(cell.hospitals) ? cell.hospitals : Array.isArray(cell.hospitalIds) ? cell.hospitalIds : [];
    const doctors = Array.isArray(cell.doctors) ? cell.doctors : Array.isArray(cell.doctorIds) ? cell.doctorIds : [];
    const pharmacies = Array.isArray(cell.pharmacies) ? cell.pharmacies : Array.isArray(cell.pharmacyIds) ? cell.pharmacyIds : [];
    const branches = Array.isArray(cell.branches) ? cell.branches : Array.isArray(cell.branchIds) ? cell.branchIds : [];
    const visitType = cell.visitType ? String(cell.visitType) : '';
    const companion = cell.companion ? String(cell.companion) : '';

    const hasContent = acts.length > 0 || hospitals.length > 0 || doctors.length > 0 || pharmacies.length > 0 || branches.length > 0 || Boolean(cell.visitType) || Boolean(cell.salesReviewDescription) || Boolean(cell.othersDescription) || Boolean(cell.meetingDescription) || Boolean(cell.trainingDescription) || Boolean(cell.eventDescription);
    if (!hasContent) return <span className="text-[var(--ink-soft)]">—</span>;

    return (
        <div className="space-y-1.5 text-xs">
            {visitType && (
                <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                    <span className="font-semibold text-[var(--ink-soft)]">{l('Visit Type:', 'نوع الزيارة:')}</span>
                    <span className={`rounded px-1.5 py-0.5 font-bold ${
                        visitType === 'Double'
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300'
                            : 'bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300'
                    }`}>
                        {visitType === 'Double'
                            ? `${l('Double visit', 'زيارة مشتركة')}${companion ? ` · ${l('With:', 'مع:')} ${companion}` : ''}`
                            : l('Single visit', 'زيارة فردية')}
                    </span>
                </div>
            )}
            {hospitals.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                    <span className="font-semibold text-[var(--ink-soft)]">{l('Hospitals:', 'المستشفيات:')}</span>
                    {hospitals.map((h: unknown, i: number) => (
                        <span key={i} className="rounded bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-blue-700 dark:text-blue-300 font-medium">
                            {typeof h === 'object' && h !== null ? String((h as Record<string, unknown>).name || '') : String(h)}
                        </span>
                    ))}
                </div>
            )}
            {branches.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                    <span className="font-semibold text-[var(--ink-soft)]">{l('Branches:', 'الفروع:')}</span>
                    {branches.map((b: unknown, i: number) => (
                        <span key={i} className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-indigo-700 dark:text-indigo-300 font-medium">
                            {typeof b === 'object' && b !== null ? String((b as Record<string, unknown>).name || '') : String(b)}
                        </span>
                    ))}
                </div>
            )}
            {doctors.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                    <span className="font-semibold text-[var(--ink-soft)]">{l('Doctors:', 'الأطباء:')}</span>
                    {doctors.map((d: unknown, i: number) => (
                        <span key={i} className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-amber-800 dark:text-amber-200 font-medium">
                            {typeof d === 'object' && d !== null ? String((d as Record<string, unknown>).name || '') : String(d)}
                        </span>
                    ))}
                </div>
            )}
            {pharmacies.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                    <span className="font-semibold text-[var(--ink-soft)]">{l('Pharmacies:', 'الصيدليات:')}</span>
                    {pharmacies.map((p: unknown, i: number) => (
                        <span key={i} className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-emerald-800 dark:text-emerald-200 font-medium">
                            {typeof p === 'object' && p !== null ? String((p as Record<string, unknown>).name || '') : String(p)}
                        </span>
                    ))}
                </div>
            )}
            {acts.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="font-semibold text-[var(--ink-soft)]">{l('Activities:', 'الأنشطة:')}</span>
                    {acts.map((act: unknown, i: number) => {
                        const actStr = String(act);
                        return (
                            <span key={i} className="rounded bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-purple-700 dark:text-purple-300 font-bold">
                                {actStr === 'SALES_REVIEW_ADMIN'
                                    ? l('Sales Review / Admin Work', 'مراجعة المبيعات / عمل إداري')
                                    : actStr === 'MEETING'
                                    ? l('Meeting', 'اجتماع')
                                    : actStr === 'TRAINING'
                                    ? l('Training', 'تدريب')
                                    : actStr === 'EVENT'
                                    ? l('Event', 'فعالية')
                                    : actStr === 'OTHERS'
                                    ? l('Others', 'أخرى')
                                    : actStr}
                            </span>
                        );
                    })}
                </div>
            )}
            {Boolean(cell.meetingDescription) && (
                <p className="text-[var(--ink)]">
                    <b>{l('Meeting Note:', 'ملاحظة الاجتماع:')}</b> {String(cell.meetingDescription)}
                </p>
            )}
            {Boolean(cell.trainingDescription) && (
                <p className="text-[var(--ink)]">
                    <b>{l('Training Note:', 'ملاحظة التدريب:')}</b> {String(cell.trainingDescription)}
                </p>
            )}
            {Boolean(cell.eventDescription) && (
                <p className="text-[var(--ink)]">
                    <b>{l('Event Note:', 'ملاحظة الفعالية:')}</b> {String(cell.eventDescription)}
                </p>
            )}
            {Boolean(cell.salesReviewDescription) && (
                <p className="text-[var(--ink)]">
                    <b>{l('Sales Review Note:', 'ملاحظة مراجعة المبيعات:')}</b> {String(cell.salesReviewDescription)}
                </p>
            )}
            {Boolean(cell.othersDescription) && (
                <p className="text-[var(--ink)]">
                    <b>{l('Others Note:', 'ملاحظة أخرى:')}</b> {String(cell.othersDescription)}
                </p>
            )}
        </div>
    );
}

export function ReportDetails({ row }: {
    row: ReportRow;
}) {
    const { language } = useTranslation();
    const ar = language === 'ar';
    return (
        <div className="space-y-4 break-words">
            <StatusBadge>{reportLabel(row.type, ar)}</StatusBadge>
            <p className="font-semibold text-sm">{row.owner} {row.position && `· ${row.position}`}</p>
            <dl className="grid gap-3 sm:grid-cols-2">
                {Object.entries(fields).map(([key, label]) => {
                    const value = row.record[key];
                    if (value === undefined || value === null || value === '') return null;
                    return (
                        <div key={key} className="rounded-lg border border-[var(--line)] bg-[var(--surface-subtle)] p-3">
                            <dt className="text-xs font-semibold text-[var(--ink-soft)]">{label[ar ? 1 : 0]}</dt>
                            <dd className="mt-1 text-sm font-medium">
                                {renderCleanValue(key, value, ar)}
                            </dd>
                        </div>
                    );
                })}
            </dl>
            {row.type === 'plan' && days.map(([day, en, arabic]) => {
                const amVal = row.record[`${day}Am`];
                const pmVal = row.record[`${day}Pm`];
                return (
                    <SectionCard key={day} title={ar ? arabic : en}>
                        <div className="space-y-3">
                            <div>
                                <b className="text-xs text-[var(--ink-soft)] uppercase tracking-wider block mb-1">{ar ? 'الفترة الصباحية (AM)' : 'Morning (AM)'}:</b>
                                <div className="text-sm font-medium">{renderCleanValue(`${day}Am`, amVal, ar)}</div>
                            </div>
                            <div className="pt-2 border-t border-[var(--line)]">
                                <b className="text-xs text-[var(--ink-soft)] uppercase tracking-wider block mb-1">{ar ? 'الفترة المسائية (PM)' : 'Afternoon (PM)'}:</b>
                                <div className="text-sm font-medium">{renderCleanValue(`${day}Pm`, pmVal, ar)}</div>
                            </div>
                        </div>
                    </SectionCard>
                );
            })}
        </div>
    );
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

    const [search, setSearch] = useState('');
    const [types, setTypes] = useState<string[]>(initialType ? [initialType] : []);
    const [entities, setEntities] = useState<string[]>([]);
    const [owners, setOwners] = useState<string[]>([]);
    const [positions, setPositions] = useState<string[]>([]);
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [sort, setSort] = useState('newest');
    const [selected, setSelected] = useState<ReportRow | null>(null);

    const activeSelected = rows.find(row => row.id === selected?.id) || null;

    const filtered = useMemo(() => filterReports(rows, {
        search,
        type: types,
        entity: entities,
        owner: owners,
        position: positions,
        start,
        end,
        sort
    }), [rows, search, types, entities, owners, positions, start, end, sort]);

    const unique = (key: 'type' | 'name' | 'owner' | 'position') => [...new Set(rows.map(r => r[key]).filter(Boolean))].sort();

    const typeOptions = useMemo(() => {
        return unique('type').map(v => ({ value: v, label: reportLabel(v, ar) }));
    }, [rows, ar]);

    const controls = (r: ReportRow) => (
        <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => setSelected(r)}>{l('Details', 'التفاصيل')}</Button>
            {actions?.(r)}
        </div>
    );

    return (
        <div className="space-y-4">
            <FilterBar>
                <label className="min-w-0 flex-1 text-xs font-semibold">
                    {l('Search', 'بحث')}
                    <input
                        type="search"
                        value={search}
                        placeholder={l('Search reports…', 'بحث في التقارير…')}
                        onChange={e => setSearch(e.target.value)}
                        className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                    />
                </label>

                {/* Multiple choice check dropdown for Report Type */}
                <MultiSelectDropdown
                    label={l('Report type', 'نوع التقرير')}
                    options={typeOptions}
                    selectedValues={types}
                    onChange={setTypes}
                    placeholder={l('All types', 'كل الأنواع')}
                />

                {/* Multiple choice check dropdown for Customer / Title */}
                <MultiSelectDropdown
                    label={l('Customer / title', 'العميل / العنوان')}
                    options={unique('name')}
                    selectedValues={entities}
                    onChange={setEntities}
                    placeholder={l('All customers', 'كل العملاء')}
                />
            </FilterBar>

            <FilterBar>
                {team && (
                    <>
                        <MultiSelectDropdown
                            label={l('Subordinate', 'الموظف')}
                            options={unique('owner')}
                            selectedValues={owners}
                            onChange={setOwners}
                            placeholder={l('All employees', 'كل الموظفين')}
                        />
                        <MultiSelectDropdown
                            label={l('Position', 'المنصب')}
                            options={unique('position')}
                            selectedValues={positions}
                            onChange={setPositions}
                            placeholder={l('All positions', 'كل المناصب')}
                        />
                    </>
                )}

                {([['From', 'من', start, setStart], ['To', 'إلى', end, setEnd]] as const).map(([en, arabic, value, set]) => (
                    <label key={String(en)} className="min-w-0 flex-1 text-xs font-semibold">
                        {l(String(en), String(arabic))}
                        <input
                            type="date"
                            value={String(value)}
                            onChange={e => (set as (v: string) => void)(e.target.value)}
                            className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 text-xs md:text-sm"
                        />
                    </label>
                ))}

                <label className="min-w-0 flex-1 text-xs font-semibold">
                    {l('Sort', 'الترتيب')}
                    <select
                        value={sort}
                        onChange={e => setSort(e.target.value)}
                        className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 text-xs md:text-sm"
                    >
                        <option value="newest">{l('Newest first', 'الأحدث أولاً')}</option>
                        <option value="oldest">{l('Oldest first', 'الأقدم أولاً')}</option>
                        <option value="name">{l('Customer / title', 'العميل / العنوان')}</option>
                    </select>
                </label>

                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                        setSearch('');
                        setTypes(initialType ? [initialType] : []);
                        setEntities([]);
                        setOwners([]);
                        setPositions([]);
                        setStart('');
                        setEnd('');
                        setSort('newest');
                    }}
                >
                    {l('Reset', 'إعادة تعيين')}
                </Button>
            </FilterBar>

            {start && end && start > end && (
                <InlineAlert tone="warning">
                    {l('The end date must be on or after the start date.', 'يجب أن يكون تاريخ النهاية بعد تاريخ البداية أو مساوياً له.')}
                </InlineAlert>
            )}

            {error ? (
                <InlineAlert tone="error">
                    {l('Reports could not be loaded.', 'تعذر تحميل التقارير.')}{' '}
                    <Button type="button" variant="secondary" onClick={retry}>
                        {l('Retry', 'إعادة المحاولة')}
                    </Button>
                </InlineAlert>
            ) : loading ? (
                <div aria-label={l('Loading reports', 'تحميل التقارير')} className="grid gap-3">
                    {[1, 2, 3].map(n => <Skeleton key={n} className="h-28" />)}
                </div>
            ) : (
                <>
                    <p role="status" className="text-sm text-[var(--ink-soft)]">
                        {filtered.length} {l('results in loaded reports', 'نتيجة ضمن التقارير المحملة')}
                    </p>
                    {!filtered.length ? (
                        <EmptyState
                            title={l('No matching reports', 'لا توجد تقارير مطابقة')}
                            description={l('Change or reset the filters to see more records.', 'غيّر عوامل التصفية أو أعد تعيينها لعرض المزيد.')}
                            icon={<FileText className="size-6" />}
                        />
                    ) : (
                        <>
                            <div className="hidden lg:block">
                                <DataTable
                                    label={l('Reports', 'التقارير')}
                                    headers={[
                                        l('Customer / title', 'العميل / العنوان'),
                                        l('Type', 'النوع'),
                                        ...(team ? [l('Owner', 'الموظف')] : []),
                                        l('Date', 'التاريخ'),
                                        l('Actions', 'الإجراءات')
                                    ]}
                                >
                                    {filtered.map(r => (
                                        <tr key={r.id}>
                                            <td className="max-w-64 break-words p-4 font-semibold">{r.name || '—'}</td>
                                            <td className="p-4">
                                                <StatusBadge>{reportLabel(r.type, ar)}</StatusBadge>
                                                {r.status && <p className="mt-1 text-xs text-[var(--ink-soft)]">{reportLabel(r.status, ar)}</p>}
                                            </td>
                                            {team && (
                                                <td className="p-4">
                                                    {r.owner}
                                                    <p className="text-xs text-[var(--ink-soft)]">{r.position}</p>
                                                </td>
                                            )}
                                            <td className="p-4">{r.date || '—'}</td>
                                            <td className="p-4">{controls(r)}</td>
                                        </tr>
                                    ))}
                                </DataTable>
                            </div>
                            <div className="grid gap-3 lg:hidden">
                                {filtered.map(r => (
                                    <SectionCard key={r.id} title={r.name || reportLabel(r.type, ar)}>
                                        <div className="mb-3 flex flex-wrap gap-2">
                                            <StatusBadge>{reportLabel(r.type, ar)}</StatusBadge>
                                            {r.status && <StatusBadge>{reportLabel(r.status, ar)}</StatusBadge>}
                                            <span className="text-sm">{r.date}</span>
                                        </div>
                                        {team && <p className="mb-3 break-words text-sm">{r.owner} · {r.position}</p>}
                                        {controls(r)}
                                    </SectionCard>
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}

            <Drawer
                open={Boolean(activeSelected) && !loading && !error}
                title={activeSelected?.name || l('Report details', 'تفاصيل التقرير')}
                onClose={() => setSelected(null)}
            >
                {activeSelected && (
                    <>
                        <ReportDetails row={activeSelected} />
                        <div className="mt-5 flex flex-wrap gap-2">{actions?.(activeSelected)}</div>
                    </>
                )}
            </Drawer>
        </div>
    );
}
