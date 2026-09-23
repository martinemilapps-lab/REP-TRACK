import type { UserSessionPayload } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { getVisibleReports } from './reportService';
import { getWeeklyPlans, getTeamWeeklyPlans } from './weeklyPlanService';
import { getMasterListsForRep, getScopedMasterListsForManager, resolveRepOwnership } from './masterListService';
import { getCompliance } from './complianceService';
import { getManagerActivities } from './managerActivityService';
import { calculateAverageAndCoverage, type EntityFrequencyItem } from './averageCoverageService';
import { hierarchyService } from './hierarchyService';
import { db, representatives } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createWorkbook, dedupeById, metadataRows, type ExportRow, type ExportCell } from '@/lib/exportWorkbook';
import { cleanPlanCellText } from '@/lib/excel';
export { cleanPlanCellText };
import type { z } from 'zod';
import type {
  reportExportSchema,
  weeklyPlanExportSchema,
  listExportSchema,
  complianceExportSchema,
  coverageExportSchema,
} from '@/lib/exportSchemas';

type ReportInput = z.infer<typeof reportExportSchema>;
type PlanInput = z.infer<typeof weeklyPlanExportSchema>;
type ListInput = z.infer<typeof listExportSchema>;
type ComplianceInput = z.infer<typeof complianceExportSchema>;
type CoverageInput = z.infer<typeof coverageExportSchema>;
type AnyRow = Record<string, unknown> & { id: string };

const formatCellValue = (input: unknown): ExportCell => {
  if (input === undefined || input === null) return '';
  if (input instanceof Date) return input.toISOString().slice(0, 19).replace('T', ' ');
  if (typeof input === 'number' || typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => (typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item))).join(', ');
        }
      } catch {}
    }
    return trimmed;
  }
  if (Array.isArray(input)) {
    return input.map((item) => (typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item))).join(', ');
  }
  if (typeof input === 'object') {
    return JSON.stringify(input);
  }
  return String(input);
};

const pickRow = (row: Record<string, unknown>, columnDefs: Array<[string, string]>): ExportRow => {
  const result: ExportRow = {};
  for (const [key, label] of columnDefs) {
    result[label] = formatCellValue(row[key]);
  }
  return result;
};

const dateOf = (row: Record<string, unknown>) =>
  String(row.submittedAt ?? row.activityDate ?? row.eventDate ?? row.trainingDate ?? row.taskDate ?? row.visitDate ?? row.lastVisit ?? row.month ?? '');

const inRange = (row: Record<string, unknown>, start?: string, end?: string) => {
  const d = dateOf(row).slice(0, 10);
  if (!d) return true;
  return (!start || d >= start) && (!end || d <= end);
};

// ==========================================
// TAILORED COLUMN DEFINITIONS PER RECORD TYPE
// ==========================================

const HOSPITAL_COLUMNS: Array<[string, string]> = [
  ['id', 'كود السجل (Record ID)'],
  ['rep', 'الموظف (Employee)'],
  ['area', 'المنطقة (Area)'],
  ['name', 'اسم المستشفى (Hospital Name)'],
  ['type', 'نوع المستشفى (Hospital Type)'],
  ['dept', 'القسم المستهدف (Target Department)'],
  ['drsVisited', 'عدد الأطباء (Doctors Count)'],
  ['doctorNames', 'أسماء الأطباء (Visited Doctor Names)'],
  ['contact', 'مسؤول المشتريات / الصيدلي (Contact Person)'],
  ['phone', 'الهاتف (Phone)'],
  ['visitType', 'نوع الزيارة (Visit Type)'],
  ['companion', 'المرافق (Companion)'],
  ['cycle', 'دورة الزيارة بالأيام (Cycle Days)'],
  ['lastVisit', 'تاريخ الزيارة (Visit Date)'],
  ['nextVisit', 'الزيارة القادمة (Next Visit)'],
  ['objective', 'الهدف (Objective)'],
  ['status', 'الحالة (Status)'],
  ['ourProducts', 'منتجاتنا المتوفرة (Our Products)'],
  ['competitor', 'منتجات المنافس (Competitor Products)'],
  ['notes', 'ملاحظات (Notes)'],
  ['submittedAt', 'تاريخ التسجيل (Submitted At)'],
];

const PHARMACY_COLUMNS: Array<[string, string]> = [
  ['id', 'كود السجل (Record ID)'],
  ['rep', 'الموظف (Employee)'],
  ['area', 'المنطقة (Area)'],
  ['name', 'اسم الصيدلية (Pharmacy Name)'],
  ['address', 'العنوان (Address)'],
  ['pharmacist', 'الصيدلي المسؤول (Pharmacist)'],
  ['mobile', 'المحمول (Mobile)'],
  ['cls', 'التصنيف (Class A/B/C)'],
  ['stockPerMonth', 'المخزون الشهري (Monthly Stock)'],
  ['salesPerMonth', 'المبيعات الشهرية (Monthly Sales)'],
  ['visitType', 'نوع الزيارة (Visit Type)'],
  ['companion', 'المرافق (Companion)'],
  ['cycle', 'دورة الزيارة بالأيام (Cycle Days)'],
  ['lastVisit', 'تاريخ الزيارة (Visit Date)'],
  ['nextVisit', 'الزيارة القادمة (Next Visit)'],
  ['objective', 'الهدف (Objective)'],
  ['status', 'الحالة (Status)'],
  ['ourProducts', 'منتجاتنا المتوفرة (Our Products)'],
  ['competitor', 'منتجات المنافس (Competitor Products)'],
  ['notes', 'ملاحظات (Notes)'],
  ['submittedAt', 'تاريخ التسجيل (Submitted At)'],
];

const DOCTOR_COLUMNS: Array<[string, string]> = [
  ['id', 'كود السجل (Record ID)'],
  ['rep', 'الموظف (Employee)'],
  ['code', 'كود الطبيب (Doctor Code)'],
  ['name', 'اسم الطبيب (Doctor Name)'],
  ['specialty', 'التخصص (Specialty)'],
  ['workplace', 'مكان العمل (Workplace)'],
  ['nearbyPharmacy', 'الصيدلية القريبة (Nearby Pharmacy)'],
  ['area', 'المنطقة (Area)'],
  ['mobile', 'المحمول (Mobile)'],
  ['cls', 'التصنيف (Class A/B)'],
  ['prescriptionRate', 'معدل الروشتات (Prescription Rate)'],
  ['visitDate', 'تاريخ الزيارة (Visit Date)'],
  ['visitType', 'نوع الزيارة (Visit Type)'],
  ['companion', 'المرافق (Companion)'],
  ['f1', 'المنتج الأساسي الأول (Product F1)'],
  ['f2', 'المنتج الثاني (Product F2)'],
  ['f3', 'المنتج الثالث (Product F3)'],
  ['reminder', 'منتج التذكير (Reminder Product)'],
  ['cycle', 'دورة الزيارة بالأيام (Cycle Days)'],
  ['nextVisit', 'الزيارة القادمة (Next Visit)'],
  ['objective', 'الهدف (Objective)'],
  ['status', 'الحالة (Status)'],
  ['notes', 'ملاحظات (Notes)'],
  ['submittedAt', 'تاريخ التسجيل (Submitted At)'],
];

const BRANCH_COLUMNS: Array<[string, string]> = [
  ['id', 'كود السجل (Record ID)'],
  ['rep', 'الموظف (Employee)'],
  ['name', 'اسم الفرع / المخزن (Branch / Distributor)'],
  ['area', 'منطقة التغطية (Coverage Area)'],
  ['contact', 'مسؤول الفرع (Contact Person)'],
  ['phone', 'الهاتف (Phone)'],
  ['visitType', 'نوع الزيارة (Visit Type)'],
  ['companion', 'المرافق (Companion)'],
  ['products', 'المنتجات الموزعة (Distributed Products)'],
  ['monthlyStock', 'المخزون الشهري (Monthly Stock)'],
  ['monthlySales', 'المبيعات الشهرية (Monthly Sales)'],
  ['lastVisit', 'تاريخ الزيارة (Visit Date)'],
  ['objective', 'الهدف (Objective)'],
  ['status', 'الحالة (Status)'],
  ['notes', 'ملاحظات (Notes)'],
  ['submittedAt', 'تاريخ التسجيل (Submitted At)'],
];

const EVENT_COLUMNS: Array<[string, string]> = [
  ['id', 'كود السجل (Record ID)'],
  ['rep', 'الموظف (Employee)'],
  ['title', 'عنوان الفعالية (Event Title)'],
  ['eventType', 'نوع الفعالية (Event Type)'],
  ['eventDate', 'تاريخ الفعالية (Event Date)'],
  ['location', 'المكان / القاعة (Location / Venue)'],
  ['attendeesCount', 'عدد الحضور (Attendees Count)'],
  ['targetSpecialty', 'التخصص المستهدف (Target Specialty)'],
  ['products', 'المنتجات المميزة (Highlighted Products)'],
  ['budget', 'الميزانية (Budget)'],
  ['feedback', 'المخرجات والنتائج (Key Outcomes & Feedback)'],
  ['notes', 'ملاحظات (Notes)'],
  ['submittedAt', 'تاريخ التسجيل (Submitted At)'],
];

const TRAINING_COLUMNS: Array<[string, string]> = [
  ['id', 'كود السجل (Record ID)'],
  ['rep', 'الموظف (Employee)'],
  ['title', 'عنوان التدريب (Training Title)'],
  ['trainingType', 'نوع التدريب (Training Type)'],
  ['trainingDate', 'تاريخ التدريب (Training Date)'],
  ['trainer', 'المدرب / المحاضر (Trainer / Facilitator)'],
  ['attendees', 'المتدربون (Attendees / Trainees)'],
  ['durationHours', 'المدة بالساعات (Duration Hours)'],
  ['outcomes', 'أهم المخرجات (Key Learnings & Takeaways)'],
  ['notes', 'ملاحظات (Notes)'],
  ['submittedAt', 'تاريخ التسجيل (Submitted At)'],
];

const SPECIAL_TASK_COLUMNS: Array<[string, string]> = [
  ['id', 'كود السجل (Record ID)'],
  ['rep', 'الموظف (Employee)'],
  ['title', 'عنوان المهمة (Task Title)'],
  ['taskCategory', 'تصنيف المهمة (Task Category)'],
  ['taskDate', 'تاريخ المهمة (Task Date)'],
  ['assignedBy', 'بتكليف من (Assigned By)'],
  ['priority', 'الأولوية (Priority)'],
  ['status', 'الحالة (Status)'],
  ['description', 'تفاصيل المهمة (Description & Deliverables)'],
  ['notes', 'ملاحظات (Notes)'],
  ['submittedAt', 'تاريخ التسجيل (Submitted At)'],
];

const MANAGER_ACTIVITY_COLUMNS: Array<[string, string]> = [
  ['id', 'كود السجل (Record ID)'],
  ['managerName', 'المدير (Manager)'],
  ['managerUsername', 'اسم المستخدم (Username)'],
  ['activityDate', 'تاريخ النشاط (Activity Date)'],
  ['reportContextType', 'سياق التقرير (Context: MR vs Vacant)'],
  ['accompaniedPerson', 'المندوب / المنطقة الشاغرة (Rep / Territory)'],
  ['visitType', 'نوع الزيارة (Visit Type: Single/Double)'],
  ['morningHospitalName', 'مستشفى الصباح (Morning Hospital)'],
  ['morningSpecialty', 'تخصص الصباح (Morning Specialty)'],
  ['morningDoctorNames', 'أطباء الصباح (Morning Doctors)'],
  ['morningHospitalComment', 'تعليق المستشفى (Morning Comment)'],
  ['afternoonDoctorNames', 'أطباء المساء (Afternoon Doctors)'],
  ['afternoonSpecialty', 'تخصص المساء (Afternoon Specialty)'],
  ['afternoonDoctorComment', 'تعليق الأطباء (Doctor Comment)'],
  ['afternoonPharmacyName', 'صيدلية المساء (Afternoon Pharmacy)'],
  ['afternoonPharmacyComment', 'تعليق الصيدلية (Pharmacy Comment)'],
  ['generalComment', 'التعليق العام والتقييم (General Evaluation)'],
  ['submittedAt', 'تاريخ التسجيل (Submitted At)'],
];

// ==========================================
// 1. BUILD DAILY REPORTS & MANAGER EXPORT
// ==========================================

export async function buildReportsExport(session: UserSessionPayload, input: ReportInput): Promise<Uint8Array> {
  // If Manager's own activities
  if (input.owner === 'my' && session.role === 'MANAGER') {
    const rawRows = await getManagerActivities(session, {
      startDate: input.startDate,
      endDate: input.endDate,
      activityType: input.type === 'managerActivity' || input.type === 'all' ? undefined : input.type,
    });

    const rows = dedupeById(rawRows).map((r) =>
      pickRow(
        {
          ...r,
          managerName: session.name,
          managerUsername: session.username,
        } as unknown as Record<string, unknown>,
        MANAGER_ACTIVITY_COLUMNS
      )
    );

    return createWorkbook([
      {
        name: 'معلومات التصدير (Export Info)',
        rows: metadataRows(session, {
          'نطاق السجلات (Scope)': 'أنشطتي الإدارية الخاصة (My Manager Activities)',
          'تاريخ البداية (Start Date)': input.startDate,
          'تاريخ النهاية (End Date)': input.endDate,
        }),
      },
      { name: 'أنشطة المديرين (Activities)', rows },
    ]);
  }

  // General Reports Export (Scoped by Hierarchy)
  const data = await getVisibleReports(session, {
    requestedRepId: input.repId,
    scopeMode: input.scopeMode,
    limit: 5000,
  });

  // Handle Product Availability Specifically with Full Reports
  if (input.type === 'availability') {
    const allRows = data.availabilities as AnyRow[];
    if (input.hospitalId && !allRows.some((row) => row.hospitalId === input.hospitalId)) {
      throw new AppError('Hospital is outside your authorized hierarchy', 403);
    }
    if (input.productId && !allRows.some((row) => row.productId === input.productId)) {
      throw new AppError('Product is outside your authorized scope', 403);
    }

    const rows = allRows.filter(
      (row) =>
        inRange(row, input.startDate, input.endDate) &&
        (!input.hospitalId || row.hospitalId === input.hospitalId) &&
        (!input.productId || row.productId === input.productId) &&
        (!input.availabilityStatus || row.status === input.availabilityStatus) &&
        (!input.month || row.month === input.month)
    );

    // Sheet 1: Detailed submissions
    const detailSheetRows = rows.map((r) => ({
      'كود السجل (ID)': formatCellValue(r.id),
      'المندوب (MR Name)': formatCellValue(r.rep),
      'المنطقة (Area)': formatCellValue(r.area),
      'المستشفى (Hospital)': formatCellValue(r.hospital),
      'نوع المستشفى (Hospital Type)': formatCellValue(r.hospitalType || 'عام'),
      'المنتج (Product)': formatCellValue(r.product),
      'الشهر (Month)': formatCellValue(r.month),
      'المبيعات (Monthly Sales)': formatCellValue(r.sales),
      'المستهدف الشهري (Monthly Target)': formatCellValue(r.avgMonthlyTarget),
      'المستهدف السنوي (Annual Target)': formatCellValue(r.annualTarget),
      'حالة التوافر (Availability Status)': formatCellValue(r.status),
      'ملاحظات (Notes)': formatCellValue(r.notes),
      'تاريخ التقديم (Submitted At)': formatCellValue(r.submittedAt),
    }));

    // Sheet 2: Hospital Breakdown Report (Report 1)
    const hospitalMap = new Map<string, { hospital: string; area: string; type: string; available: string[]; notAvailable: string[] }>();
    for (const r of rows) {
      const hName = String(r.hospital || '');
      if (!hName) continue;
      const key = `${hName}|${r.area || ''}`;
      if (!hospitalMap.has(key)) {
        hospitalMap.set(key, {
          hospital: hName,
          area: String(r.area || ''),
          type: String(r.hospitalType || 'Hospital'),
          available: [],
          notAvailable: [],
        });
      }
      const entry = hospitalMap.get(key)!;
      const pName = String(r.product || '');
      if (r.status === 'Available') {
        if (!entry.available.includes(pName)) entry.available.push(pName);
      } else {
        if (!entry.notAvailable.includes(pName)) entry.notAvailable.push(pName);
      }
    }

    const hospitalBreakdownRows = Array.from(hospitalMap.values()).map((h) => {
      const total = h.available.length + h.notAvailable.length;
      const pct = total > 0 ? Math.round((h.available.length / total) * 100) : 0;
      return {
        'اسم المستشفى (Hospital)': h.hospital,
        'نوع المستشفى (Type)': h.type,
        'المنطقة (Area)': h.area,
        'المنتجات المتوفرة (Available Products)': h.available.join(', ') || 'لا يوجد',
        'المنتجات غير المتوفرة (Not Available)': h.notAvailable.join(', ') || 'لا يوجد',
        'عدد المتوفر (Available Count)': h.available.length,
        'إجمالي المفحوص (Total Checked)': total,
        'نسبة التوافر % (Availability Rate)': `${pct}%`,
      };
    });

    // Sheet 3: Product Summary Matrix
    const productNames = [...new Set(rows.map((r) => String(r.product || '')).filter(Boolean))].sort();
    const productSummaryRows = productNames.map((pName) => {
      const prods = rows.filter((r) => r.product === pName);
      const avail = prods.filter((r) => r.status === 'Available').length;
      const notAvail = prods.filter((r) => r.status === 'Not Available').length;
      const total = avail + notAvail;
      const pct = total > 0 ? Math.round((avail / total) * 100) : 0;
      return {
        'المنتج (Product Name)': pName,
        'متوفر في (Available In)': `${avail} مستشفى`,
        'غير متوفر في (Not Available In)': `${notAvail} مستشفى`,
        'إجمالي المستشفيات (Total Hospitals)': total,
        'نسبة التوافر الكلية (Overall Rate)': `${pct}%`,
      };
    });

    return createWorkbook([
      {
        name: 'معلومات التصدير (Export Info)',
        rows: metadataRows(session, {
          'نوع التقرير (Report Type)': 'توافر المنتجات في المستشفيات (Product Availability)',
          'الفترة (Month / Range)': input.month ?? `${input.startDate ?? ''} ${input.endDate ? `to ${input.endDate}` : ''}`,
          'إجمالي السجلات (Total Records)': String(rows.length),
        }),
      },
      { name: 'سجلات التوافر (Submissions)', rows: detailSheetRows },
      { name: 'تقرير المستشفيات (Hospitals)', rows: hospitalBreakdownRows },
      { name: 'ملخص المنتجات (Products)', rows: productSummaryRows },
    ]);
  }

  // Handle All or Individual Entity Types with dedicated, rich columns
  const typeConfigs: Array<{
    typeKey: string;
    sheetName: string;
    items: AnyRow[];
    columns: Array<[string, string]>;
  }> = [
    { typeKey: 'hospital', sheetName: 'المستشفيات (Hospitals)', items: data.hospitals as AnyRow[], columns: HOSPITAL_COLUMNS },
    { typeKey: 'pharmacy', sheetName: 'الصيدليات (Pharmacies)', items: data.pharmacies as AnyRow[], columns: PHARMACY_COLUMNS },
    { typeKey: 'doctor', sheetName: 'الأطباء (Doctors)', items: data.doctors as AnyRow[], columns: DOCTOR_COLUMNS },
    { typeKey: 'branch', sheetName: 'فروع التوزيع (Branches)', items: data.branches as AnyRow[], columns: BRANCH_COLUMNS },
    { typeKey: 'event', sheetName: 'الفعاليات (Events)', items: data.events as AnyRow[], columns: EVENT_COLUMNS },
    { typeKey: 'training', sheetName: 'التدريب (Training)', items: data.trainings as AnyRow[], columns: TRAINING_COLUMNS },
    { typeKey: 'specialTask', sheetName: 'مراجعة المبيعات (Tasks)', items: data.specialTasks as AnyRow[], columns: SPECIAL_TASK_COLUMNS },
    {
      typeKey: 'managerActivity',
      sheetName: 'أنشطة المديرين (Manager Activities)',
      items: (data.managerActivities || []) as unknown as AnyRow[],
      columns: MANAGER_ACTIVITY_COLUMNS,
    },
  ];

  const selectedConfigs = input.type === 'all' ? typeConfigs : typeConfigs.filter((c) => c.typeKey === input.type);

  const sheets = selectedConfigs.map((cfg) => {
    const filteredRows = dedupeById(cfg.items).filter((r) => inRange(r, input.startDate, input.endDate));
    return {
      name: cfg.sheetName,
      rows: filteredRows.map((r) => pickRow(r, cfg.columns)),
    };
  });

  return createWorkbook([
    {
      name: 'معلومات التصدير (Export Info)',
      rows: metadataRows(session, {
        'النطاق التنظيمي (Scope)': session.role === 'REPRESENTATIVE' ? 'سجلاتي الخاصة (My Records)' : input.scopeMode,
        'نوع التقرير (Report Type)': input.type,
        'تاريخ البداية (Start Date)': input.startDate,
        'تاريخ النهاية (End Date)': input.endDate,
      }),
    },
    ...sheets,
  ]);
}

// ==========================================
// 2. BUILD WEEKLY PLANS EXPORT
// ==========================================

export async function buildWeeklyPlansExport(session: UserSessionPayload, input: PlanInput): Promise<Uint8Array> {
  if (session.role === 'REPRESENTATIVE' && input.team === 'true') {
    throw new AppError('MR users cannot export team plans', 403);
  }
  if (session.role === 'REPRESENTATIVE' && input.repId && input.repId !== session.repId) {
    throw new AppError('Requested representative is outside your authorized scope', 403);
  }

  let plans = input.team === 'true'
    ? await getTeamWeeklyPlans(session, input.scopeMode)
    : await getWeeklyPlans(session, session.role === 'MANAGER' ? { personalOnly: true } : { repId: session.repId });

  if (input.repId) plans = plans.filter((plan) => plan.repId === input.repId);
  if (input.weekStart) plans = plans.filter((plan) => plan.startDate === input.weekStart);

  const planRows = dedupeById(plans).map((p) => ({
    'كود الخطة (Plan ID)': formatCellValue(p.id),
    'الموظف (Employee)': formatCellValue(p.rep),
    'المنصب (Position)': formatCellValue(p.userPosition || (p.isManagerPlan ? 'MANAGER' : 'MR')),
    'تاريخ السبت (Saturday)': formatCellValue(p.startDate),
    'تاريخ الجمعة (Friday)': formatCellValue(p.endDate),
    'أسبوع الخطة (Week Range)': formatCellValue(p.weekLabel || `${p.startDate} to ${p.endDate}`),
    'الحالة (Status)': formatCellValue(p.status || 'Submitted'),
    'السبت صباحاً (Sat AM)': cleanPlanCellText(p.saturdayAm),
    'السبت مساءً (Sat PM)': cleanPlanCellText(p.saturdayPm),
    'الأحد صباحاً (Sun AM)': cleanPlanCellText(p.sundayAm),
    'الأحد مساءً (Sun PM)': cleanPlanCellText(p.sundayPm),
    'الاثنين صباحاً (Mon AM)': cleanPlanCellText(p.mondayAm),
    'الاثنين مساءً (Mon PM)': cleanPlanCellText(p.mondayPm),
    'الثلاثاء صباحاً (Tue AM)': cleanPlanCellText(p.tuesdayAm),
    'الثلاثاء مساءً (Tue PM)': cleanPlanCellText(p.tuesdayPm),
    'الأربعاء صباحاً (Wed AM)': cleanPlanCellText(p.wednesdayAm),
    'الأربعاء مساءً (Wed PM)': cleanPlanCellText(p.wednesdayPm),
    'الخميس صباحاً (Thu AM)': cleanPlanCellText(p.thursdayAm),
    'الخميس مساءً (Thu PM)': cleanPlanCellText(p.thursdayPm),
    'الجمعة صباحاً (Fri AM)': cleanPlanCellText(p.fridayAm),
    'الجمعة مساءً (Fri PM)': cleanPlanCellText(p.fridayPm),
    'ملاحظات الإدارة (Manager Notes)': formatCellValue(p.managerNotes),
    'تاريخ التقديم (Submitted At)': formatCellValue(p.submittedAt),
  }));

  return createWorkbook([
    {
      name: 'معلومات التصدير (Export Info)',
      rows: metadataRows(session, {
        'نطاق الخطط (Scope)': input.team === 'true' ? input.scopeMode : 'خطتي الخاصة (My Personal Plan)',
        'بداية الأسبوع (Week Start)': input.weekStart,
        'إجمالي الخطط (Total Plans)': String(planRows.length),
      }),
    },
    { name: 'الخطط الأسبوعية (Weekly Plans)', rows: planRows },
  ]);
}

// ==========================================
// 3. BUILD MASTER LISTS EXPORT
// ==========================================

export async function buildListsExport(session: UserSessionPayload, input: ListInput): Promise<Uint8Array> {
  let lists;
  let owner = session.name;

  if (session.role === 'REPRESENTATIVE') {
    if (input.repId && input.repId !== session.repId) {
      throw new AppError('MR users can export only their own lists', 403);
    }
    lists = await getMasterListsForRep(await resolveRepOwnership(session));
  } else {
    if (!input.repId) throw new AppError('Select an authorized representative; no fallback is used', 400);
    const result = await getScopedMasterListsForManager(session, input.repId);
    lists = result.lists;
    owner = result.targetRep?.name ?? owner;
  }

  // 1. Hospitals sheet
  const hospitalRows = dedupeById(lists.hospitals).map((h) => ({
    'كود العميل (ID)': formatCellValue(h.id),
    'اسم المستشفى (Hospital Name)': formatCellValue(h.name),
    'المنطقة (Area)': formatCellValue(h.area),
    'العنوان (Address)': formatCellValue(h.address),
    'نوع المستشفى (Types)': formatCellValue(h.hospitalTypes || h.type),
    'دورة الزيارة بالأيام (Cycle Days)': formatCellValue(h.defaultCycle ?? 7),
    'تاريخ الإضافة (Created At)': formatCellValue(h.createdAt),
  }));

  // 2. Doctors sheet
  const doctorRows = dedupeById(lists.doctors).map((d) => ({
    'كود العميل (ID)': formatCellValue(d.id),
    'اسم الطبيب (Doctor Name)': formatCellValue(d.name),
    'التخصص (Specialty)': formatCellValue(d.specialty),
    'المنطقة (Area)': formatCellValue(d.area),
    'عنوان العيادة (Clinic Address)': formatCellValue(d.clinicAddress || d.address),
    'التصنيف (Class)': formatCellValue(d.classification || 'A'),
    'دورة الزيارة بالأيام (Cycle Days)': formatCellValue(d.defaultCycle ?? 7),
    'المستشفيات العامل بها (Working Hospitals)': formatCellValue(d.workingHospitalIds),
    'الصيدليات القريبة (Nearby Pharmacies)': formatCellValue(d.nearbyPharmacyIds),
    'تاريخ الإضافة (Created At)': formatCellValue(d.createdAt),
  }));

  // 3. Pharmacies sheet
  const pharmacyRows = dedupeById(lists.pharmacies).map((p) => ({
    'كود العميل (ID)': formatCellValue(p.id),
    'اسم الصيدلية (Pharmacy Name)': formatCellValue(p.name),
    'المنطقة (Area)': formatCellValue(p.area),
    'العنوان (Address)': formatCellValue(p.address),
    'الصيدلي المسؤول (Pharmacist)': formatCellValue(p.pharmacist),
    'الموزع المتعامل معه (Distributors)': formatCellValue(p.distributors),
    'موزع آخر (Other Distributor)': formatCellValue(p.distributorOther),
    'دورة الزيارة بالأيام (Cycle Days)': formatCellValue(p.defaultCycle ?? 7),
    'تاريخ الإضافة (Created At)': formatCellValue(p.createdAt),
  }));

  // 4. Branches sheet
  const branchRows = dedupeById(lists.branches).map((b) => ({
    'كود العميل (ID)': formatCellValue(b.id),
    'اسم الفرع / المخزن (Branch Name)': formatCellValue(b.name),
    'منطقة التغطية (Coverage Area)': formatCellValue(b.coverageArea),
    'العنوان (Address)': formatCellValue(b.address),
    'مسؤول الاتصال (Contact Person)': formatCellValue(b.contact),
    'الهاتف (Phone)': formatCellValue(b.phone),
    'المنتجات الموزعة (Distributed Products)': formatCellValue(b.distributedProducts),
    'دورة الزيارة بالأيام (Cycle Days)': formatCellValue(b.defaultCycle ?? 7),
    'تاريخ الإضافة (Created At)': formatCellValue(b.createdAt),
  }));

  return createWorkbook([
    {
      name: 'معلومات التصدير (Export Info)',
      rows: metadataRows(session, {
        'صاحب القوائم (Lists Owner)': owner,
        'إجمالي المستشفيات (Hospitals)': String(hospitalRows.length),
        'إجمالي الأطباء (Doctors)': String(doctorRows.length),
        'إجمالي الصيدليات (Pharmacies)': String(pharmacyRows.length),
        'إجمالي الفروع (Branches)': String(branchRows.length),
      }),
    },
    { name: 'المستشفيات (Hospitals)', rows: hospitalRows },
    { name: 'الأطباء (Doctors)', rows: doctorRows },
    { name: 'الصيدليات (Pharmacies)', rows: pharmacyRows },
    { name: 'فروع ومخازن التوزيع (Branches)', rows: branchRows },
  ]);
}

// ==============================================================
// 4. BUILD AVERAGE, COVERAGE & VISITS FREQUENCY FULL EXPORT
// ==============================================================

export async function buildCoverageExport(session: UserSessionPayload, input: CoverageInput): Promise<Uint8Array> {
  const period = input.period || 'monthly';
  const targetDate = input.date || input.endDate || new Date().toISOString().slice(0, 10);

  let activeRepId = input.repId;
  if (session.role === 'REPRESENTATIVE') {
    activeRepId = session.repId || undefined;
  }

  // If Manager did not specify repId, pick first scoped representative
  if (!activeRepId) {
    const scoped = await hierarchyService.getScopedRepresentatives(session, 'ALL_DESCENDANTS');
    if (scoped.length > 0) {
      activeRepId = scoped[0].id;
    } else {
      const firstRep = await db
        .select({ id: representatives.id })
        .from(representatives)
        .where(eq(representatives.isActive, true))
        .limit(1)
        .get();
      activeRepId = firstRep?.id;
    }
  }

  if (!activeRepId) {
    throw new AppError('No active representative found for coverage export', 400);
  }

  // Calculate comprehensive report using live engine
  const report = await calculateAverageAndCoverage(activeRepId, targetDate, period);

  // Sheet 1: Summary & Category KPIs
  const summaryKpiRows = [
    {
      'المؤشر (Metric)': 'اسم المندوب (Representative)',
      'القيمة (Value)': `${report.repName} (${report.repArea})`,
      'النسبة المئوية (Rate)': '',
      'الحالة (Status)': 'نشط (Active)',
    },
    {
      'المؤشر (Metric)': 'فترة الحساب (Calculation Period)',
      'القيمة (Value)': `${report.period} (${report.startDate} إلى ${report.endDate})`,
      'النسبة المئوية (Rate)': '',
      'الحالة (Status)': '',
    },
    {
      'المؤشر (Metric)': 'إجمالي العملاء في القوائم (Total in Lists)',
      'القيمة (Value)': report.visitsFrequency.overall.totalEntities,
      'النسبة المئوية (Rate)': '',
      'الحالة (Status)': '',
    },
    {
      'المؤشر (Metric)': 'العملاء المغطون (Covered Entities)',
      'القيمة (Value)': report.visitsFrequency.overall.totalVisited,
      'النسبة المئوية (Rate)': `${report.visitsFrequency.overall.overallCoveragePct}%`,
      'الحالة (Status)': report.visitsFrequency.overall.overallCoveragePct >= 90 ? 'ممتاز (High)' : 'أقل من المستهدف',
    },
    {
      'المؤشر (Metric)': 'نفس التكرار - مطابق (Same Frequency 🟢)',
      'القيمة (Value)': report.visitsFrequency.overall.sameCount,
      'النسبة المئوية (Rate)': `${report.visitsFrequency.overall.samePct}%`,
      'الحالة (Status)': 'مطابق للمعدل (Target Met)',
    },
    {
      'المؤشر (Metric)': 'زيارات زائدة عن المعدل (Overvisited 🔴)',
      'القيمة (Value)': report.visitsFrequency.overall.overCount,
      'النسبة المئوية (Rate)': `${report.visitsFrequency.overall.overPct}%`,
      'الحالة (Status)': 'تكرار زائد (Above Target)',
    },
    {
      'المؤشر (Metric)': 'زيارات أقل من المعدل (Less Visited 🟡)',
      'القيمة (Value)': report.visitsFrequency.overall.lessCount,
      'النسبة المئوية (Rate)': `${report.visitsFrequency.overall.lessPct}%`,
      'الحالة (Status)': 'يحتاج متابعة (Below Target)',
    },
    {
      'المؤشر (Metric)': 'عملاء بدون زيارة (Unvisited ⭕)',
      'القيمة (Value)': report.visitsFrequency.overall.unvisitedCount,
      'النسبة المئوية (Rate)': `${report.visitsFrequency.overall.unvisitedPct}%`,
      'الحالة (Status)': 'غير مغطى (Uncovered)',
    },
  ];

  // Category breakdown table
  const categorySummaryRows = [
    {
      'الفئة (Category)': 'المستشفيات (Hospitals)',
      'إجمالي القائمة (List Total)': report.coverage.hospital.totalInList,
      'الزيارات المنفذة (Conducted Visits)': report.averageVisits.hospital.actualVisits,
      'العملاء المغطون (Visited Count)': report.coverage.hospital.visitedEntitiesCount,
      'نسبة التغطية % (Coverage)': `${report.coverage.hospital.coveragePct}%`,
      'معدل الزيارة اليومي (Daily Rate)': report.averageVisits.hospital.actualVisits,
      'الحالة (Status)': report.coverage.hospital.color === 'GREEN' ? 'ممتاز 🟢' : report.coverage.hospital.color === 'YELLOW' ? 'متوسط 🟡' : 'منخفض 🔴',
    },
    {
      'الفئة (Category)': 'الأطباء (Doctors)',
      'إجمالي القائمة (List Total)': report.coverage.doctor.totalInList,
      'الزيارات المنفذة (Conducted Visits)': report.averageVisits.doctor.actualVisits,
      'العملاء المغطون (Visited Count)': report.coverage.doctor.visitedEntitiesCount,
      'نسبة التغطية % (Coverage)': `${report.coverage.doctor.coveragePct}%`,
      'معدل الزيارة اليومي (Daily Rate)': report.averageVisits.doctor.actualVisits,
      'الحالة (Status)': report.coverage.doctor.color === 'GREEN' ? 'ممتاز 🟢' : report.coverage.doctor.color === 'YELLOW' ? 'متوسط 🟡' : 'منخفض 🔴',
    },
    {
      'الفئة (Category)': 'الصيدليات (Pharmacies)',
      'إجمالي القائمة (List Total)': report.coverage.pharmacy.totalInList,
      'الزيارات المنفذة (Conducted Visits)': report.averageVisits.pharmacy.actualVisits,
      'العملاء المغطون (Visited Count)': report.coverage.pharmacy.visitedEntitiesCount,
      'نسبة التغطية % (Coverage)': `${report.coverage.pharmacy.coveragePct}%`,
      'معدل الزيارة اليومي (Daily Rate)': report.averageVisits.pharmacy.actualVisits,
      'الحالة (Status)': report.coverage.pharmacy.color === 'GREEN' ? 'ممتاز 🟢' : report.coverage.pharmacy.color === 'YELLOW' ? 'متوسط 🟡' : 'منخفض 🔴',
    },
    {
      'الفئة (Category)': 'فروع ومخازن التوزيع (Branches)',
      'إجمالي القائمة (List Total)': report.coverage.branch.totalInList,
      'الزيارات المنفذة (Conducted Visits)': report.averageVisits.branch.actualVisits,
      'العملاء المغطون (Visited Count)': report.coverage.branch.visitedEntitiesCount,
      'نسبة التغطية % (Coverage)': `${report.coverage.branch.coveragePct}%`,
      'معدل الزيارة اليومي (Daily Rate)': report.averageVisits.branch.actualVisits,
      'الحالة (Status)': report.coverage.branch.color === 'GREEN' ? 'ممتاز 🟢' : report.coverage.branch.color === 'YELLOW' ? 'متوسط 🟡' : 'منخفض 🔴',
    },
  ];

  // Sheet 2: Customer Detailed Report (تقرير العملاء التفصيلي بأسماء العملاء)
  const categoryLabelsAr: Record<string, string> = {
    HOSPITAL: 'مستشفى',
    DOCTOR: 'طبيب',
    PHARMACY: 'صيدلية',
    DISTRIBUTION_BRANCH: 'فرع ومخزن توزيع',
  };

  const frequencyLabelsAr: Record<string, string> = {
    SAME: 'نفس التكرار (مطابق) 🟢',
    OVER: 'زيارات زائدة (Overvisited) 🔴',
    LESS: 'زيارات أقل (Less Visited) 🟡',
  };

  const coverageLabelsAr: Record<string, string> = {
    FULL: 'مغطى بالكامل (100%+) 🟢',
    PARTIAL: 'مغطى جزئياً 🟡',
    UNCOVERED: 'غير مغطى (0%) 🔴',
  };

  const customerDetailedRows = (report.visitsFrequency.allItems || []).map((c: EntityFrequencyItem) => ({
    'اسم العميل (Customer Name)': c.name,
    'الفئة (Category)': categoryLabelsAr[c.category] || c.category,
    'المنطقة (Area / Territory)': c.area || '—',
    'التخصص / التصنيف (Specialty/Type)': c.extraInfo || '—',
    'دورة الزيارة بالأيام (Cycle Days)': c.cycleDays,
    'الزيارات المستهدفة (Expected Target)': c.expectedVisits,
    'الزيارات المنفذة (Actual Visits)': c.actualVisits,
    'نسبة التغطية % (Coverage Rate)': `${c.coveragePct}%`,
    'حالة التغطية (Coverage Status)': coverageLabelsAr[c.coverageStatus] || c.coverageStatus,
    'حالة التكرار (Frequency Status)': frequencyLabelsAr[c.frequencyStatus] || c.frequencyStatus,
    'المتوسط اليومي (Daily Average Rate)': c.averageDailyRate,
    'تاريخ آخر زيارة (Last Visit Date)': c.lastVisitDate || 'لم يُزر بعد',
  }));

  // Optional Sheet 3: Team Matrix (if session is Manager)
  let teamMatrixRows: ExportRow[] = [];
  if (session.role === 'MANAGER' || session.systemRole === 'ADMIN') {
    try {
      const scoped = await hierarchyService.getScopedRepresentatives(session, 'ALL_DESCENDANTS');
      teamMatrixRows = await Promise.all(
        scoped.map(async (r) => {
          try {
            const repRep = await calculateAverageAndCoverage(r.id, targetDate, period);
            return {
              'اسم المندوب (MR Name)': r.name,
              'المنطقة (Area)': r.area || '—',
              'إجمالي العملاء (Total Customers)': repRep.visitsFrequency.overall.totalEntities,
              'العملاء المغطون (Covered Entities)': repRep.visitsFrequency.overall.totalVisited,
              'نسبة التغطية الكلية (Overall Coverage)': `${repRep.visitsFrequency.overall.overallCoveragePct}%`,
              'نفس التكرار 🟢 (Same Freq)': repRep.visitsFrequency.overall.sameCount,
              'زيارات زائدة 🔴 (Over)': repRep.visitsFrequency.overall.overCount,
              'زيارات أقل 🟡 (Less)': repRep.visitsFrequency.overall.lessCount,
              'بدون زيارة ⭕ (Unvisited)': repRep.visitsFrequency.overall.unvisitedCount,
            };
          } catch {
            return {
              'اسم المندوب (MR Name)': r.name,
              'المنطقة (Area)': r.area || '—',
              'إجمالي العملاء (Total Customers)': '—',
              'العملاء المغطون (Covered Entities)': '—',
              'نسبة التغطية الكلية (Overall Coverage)': '—',
              'نفس التكرار 🟢 (Same Freq)': '—',
              'زيارات زائدة 🔴 (Over)': '—',
              'زيارات أقل 🟡 (Less)': '—',
              'بدون زيارة ⭕ (Unvisited)': '—',
            };
          }
        })
      );
    } catch {}
  }

  const sheets = [
    {
      name: 'معلومات التصدير (Export Info)',
      rows: metadataRows(session, {
        'المندوب المستهدف (Target MR)': `${report.repName} (${report.repArea})`,
        'فترة الحساب (Period)': report.period,
        'نطاق التواريخ (Date Range)': `${report.startDate} to ${report.endDate}`,
        'نسبة التغطية الكلية (Overall Coverage)': `${report.visitsFrequency.overall.overallCoveragePct}%`,
      }),
    },
    { name: 'مؤشرات الأداء (Summary KPIs)', rows: summaryKpiRows },
    { name: 'معدل فئات العملاء (Categories)', rows: categorySummaryRows },
    { name: 'تقرير العملاء التفصيلي (Customers)', rows: customerDetailedRows },
  ];

  if (teamMatrixRows.length > 0) {
    sheets.push({ name: 'مصفوفة الفريق (Team Matrix)', rows: teamMatrixRows });
  }

  return createWorkbook(sheets);
}

// ==========================================
// 5. BUILD COMPLIANCE EXPORT
// ==========================================

export async function buildComplianceExport(session: UserSessionPayload, input: ComplianceInput): Promise<Uint8Array> {
  const result = await getCompliance(session, { ...input, page: 1, pageSize: 100 });
  const allRows = [...result.rows];
  for (let page = 2; (page - 1) * 100 < result.total && page <= 200; page++) {
    const next = await getCompliance(session, { ...input, page, pageSize: 100 });
    allRows.push(...next.rows);
  }

  const details = dedupeById(allRows).map((row) => ({
    'الموظف (Employee)': row.name,
    'اسم المستخدم (Username)': row.username,
    'المنصب (Position)': row.position,
    'المنطقة / التكليف (Assignment)': row.assignmentSummary,
    'نوع التقديم (Type)': row.submissionType === 'DAILY_REPORT' ? 'التقرير اليومي' : 'الخطة الأسبوعية',
    'الفترة (Period)': row.period,
    'الحالة (Status)': row.status === 'SUBMITTED' ? 'تم التقديم' : 'لم يتم التقديم',
    'وقت التقديم (Submitted At)': row.submittedAt ?? '—',
  }));

  return createWorkbook([
    {
      name: 'معلومات التصدير (Export Info)',
      rows: metadataRows(session, {
        'النطاق (Scope)': input.scopeMode,
        'نوع الالتزام (Type)': input.type,
        'الفترة (Period)': input.date ?? input.weekStart,
      }),
    },
    {
      name: 'معدل الالتزام (Compliance KPI)',
      rows: [
        {
          'المتوقع (Expected)': result.summary.expected,
          'تم التقديم (Submitted)': result.summary.submitted,
          'لم يقدم (Not Submitted)': result.summary.notSubmitted,
          'نسبة الالتزام % (Compliance Rate)': `${result.summary.submissionRate ?? 0}%`,
        },
      ],
    },
    { name: 'حالة الموظفين (Employee Details)', rows: details },
  ]);
}
