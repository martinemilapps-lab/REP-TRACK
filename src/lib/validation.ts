import { z } from 'zod';
import { HOSPITAL_DEPARTMENTS, PHARMACY_DISTRIBUTORS, PRESCRIPTION_RATE_OPTIONS } from './constants';

const VisitCycleSchema = z.coerce.number().refine(value => [7, 10, 14, 30].includes(value), 'Visit cycle must be 7, 10, 14, or 30 days');
const VisitModeFields = { visitType: z.enum(['Single', 'Double']).default('Single'), companion: z.string().trim().max(200).optional().default('') };

export const LoginSchema = z.object({
  username: z.string().min(1, 'اسم المستخدم مطلوب').trim(),
  password: z.string().min(1, 'كلمة السر مطلوبة'),
});

export const ManagerAuthSchema = z.object({
  password: z.string().min(1, 'كلمة السر مطلوبة'),
});

export const HospitalVisitSchema = z.object({
  name: z.string().min(1, 'اسم المستشفى مطلوب').trim(),
  area: z.string().optional().default('').transform((v) => v.trim()),
  type: z.string().optional().default('Private'),
  objective: z.string().optional().default(''),
  dept: z.string().optional().default(''),
  drsVisited: z.coerce.number().min(0).optional().default(0),
  doctorNames: z.string().optional().default(''),
  contact: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  cycle: z.coerce.number().min(0).optional().default(0),
  lastVisit: z.string().optional().default(''),
  nextVisit: z.string().optional().default(''),
  status: z.string().optional().default('Visited'),
  visitType: z.string().optional().default('Single'),
  companion: z.string().optional().default(''),
  ourProducts: z.string().optional().default(''),
  competitor: z.string().optional().default(''),
  hasOthers: z.boolean().optional().default(false),
  othersDescription: z.string().trim().max(2000).optional().default(''),
  notes: z.string().optional().default(''),
  rep: z.string().optional(), // optional legacy field, overridden on server
});

export const HospitalDailyReportSchema = z.object({
  id: z.string().uuid().optional(), reportDate: z.string().date(),
  visits: z.array(z.object({
    hospitalId: z.string().min(1), productIds: z.array(z.string().min(1)).default([]),
    departments: z.array(z.object({ department: z.enum(HOSPITAL_DEPARTMENTS), doctors: z.array(z.string().trim().min(1).max(120)).min(1) })).default([]),
    hasOthers: z.boolean().optional().default(false),
    othersDescription: z.string().trim().max(2000).optional().default(''),
    ...VisitModeFields,
  })).min(1),
}).superRefine((data,ctx)=>data.visits.forEach((visit,index)=>{if(new Set(visit.productIds).size!==visit.productIds.length)ctx.addIssue({code:'custom',path:['visits',index,'productIds'],message:'Duplicate products are not allowed'});if(new Set(visit.departments.map(x=>x.department)).size!==visit.departments.length)ctx.addIssue({code:'custom',path:['visits',index,'departments'],message:'Duplicate departments are not allowed'});if(visit.visitType==='Double'&&!visit.companion)ctx.addIssue({code:'custom',path:['visits',index,'companion'],message:'Companion is required for a Double visit'});if(visit.hasOthers&&!visit.othersDescription.trim())ctx.addIssue({code:'custom',path:['visits',index,'othersDescription'],message:'Others description is required when Others is selected'})}));

export const PharmacyVisitSchema = z.object({
  name: z.string().min(1, 'اسم الصيدلية مطلوب').trim(),
  area: z.string().optional().default('').transform((v) => v.trim()),
  address: z.string().optional().default(''),
  objective: z.string().optional().default(''),
  pharmacist: z.string().optional().default(''),
  mobile: z.string().optional().default(''),
  cls: z.string().optional().default('A'),
  cycle: z.coerce.number().min(0).optional().default(0),
  lastVisit: z.string().optional().default(''),
  nextVisit: z.string().optional().default(''),
  status: z.string().optional().default('Visited'),
  visitType: z.string().optional().default('Single'),
  companion: z.string().optional().default(''),
  ourProducts: z.string().optional().default(''),
  stockPerMonth: z.string().optional().default(''),
  salesPerMonth: z.string().optional().default(''),
  competitor: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  rep: z.string().optional(),
});

export const DoctorVisitSchema = z.object({
  name: z.string().min(1, 'اسم الدكتور مطلوب').trim(),
  objective: z.string().optional().default(''),
  prescriptionRate: z.string().optional().default('Awareness'),
  nearbyPharmacy: z.string().optional().default(''),
  specialty: z.string().optional().default(''),
  workplace: z.string().optional().default(''),
  area: z.string().optional().default('').transform((v) => v.trim()),
  mobile: z.string().optional().default(''),
  cls: z.string().optional().default('A'),
  visitDate: z.string().optional().default(''),
  cycle: z.coerce.number().min(0).optional().default(0),
  nextVisit: z.string().optional().default(''),
  status: z.string().optional().default('Visited'),
  visitType: z.string().optional().default('Single'),
  companion: z.string().optional().default(''),
  f1: z.string().optional().default(''),
  f2: z.string().optional().default(''),
  f3: z.string().optional().default(''),
  reminder: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  rep: z.string().optional(),
});

export const BranchVisitSchema = z.object({
  name: z.string().min(1, 'اسم الفرع مطلوب').trim(),
  area: z.string().optional().default('').transform((v) => v.trim()),
  objective: z.string().optional().default(''),
  contact: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  products: z.string().trim().max(2000).optional().default(''),
  monthlyStock: z.string().optional().default(''),
  monthlySales: z.string().optional().default(''),
  cycle: z.coerce.number().min(0).optional().default(0),
  lastVisit: z.string().optional().default(''),
  nextVisit: z.string().optional().default(''),
  visitType: z.string().optional().default('Single'),
  companion: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  rep: z.string().optional(),
});

export const MasterHospitalSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'اسم المستشفى مطلوب').trim(),
  area: z.string().optional().default('').transform((v) => v.trim()),
  type: z.string().optional().default('Private'),
  hospitalTypes: z.array(z.string().trim().min(1)).min(1, 'يجب اختيار نوع مستشفى واحد على الأقل').optional(),
  address: z.string().optional().default(''),
  defaultCycle: VisitCycleSchema.optional().default(7),
  targetProducts: z.string().optional().default(''),
  rep: z.string().optional(),
});

export const MasterPharmacySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'اسم الصيدلية مطلوب').trim(),
  area: z.string().optional().default('').transform((v) => v.trim()),
  address: z.string().optional().default(''),
  distributors: z.array(z.enum(PHARMACY_DISTRIBUTORS)).min(1, 'Distributor Dealt With is required'),
  distributorOther: z.string().trim().max(200).optional().default(''),
  defaultCycle: VisitCycleSchema.optional().default(7),
  rep: z.string().optional(),
}).superRefine((data,ctx)=>{if(data.distributors.includes('OTHERS')&&!data.distributorOther)ctx.addIssue({code:'custom',path:['distributorOther'],message:'Others explanation is required'})});

export const MasterDoctorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'اسم الطبيب مطلوب').trim(),
  specialty: z.string().optional().default(''),
  clinicAddress: z.string().optional().default(''),
  nearbyPharmacyIds: z.array(z.string().min(1)).optional().default([]),
  area: z.string().optional().default('').transform((v) => v.trim()),
  address: z.string().optional().default(''),
  classification: z.string().optional().default('A'),
  defaultCycle: VisitCycleSchema.optional().default(7),
  targetProducts: z.string().optional().default(''),
  rep: z.string().optional(),
});

export const MasterBranchSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'اسم الفرع / الموزع مطلوب').trim(),
  coverageArea: z.string().optional().default('').transform((v) => v.trim()),
  address: z.string().optional().default(''),
  contact: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  distributedProducts: z.string().optional().default(''),
  defaultCycle: VisitCycleSchema.optional().default(7),
  rep: z.string().optional(),
});

export const ProductAvailabilitySchema = z.object({
  hospital: z.string().min(1, 'اسم المستشفى مطلوب').trim(),
  area: z.string().optional().default('').transform((v) => v.trim()),
  product: z.string().min(1, 'اسم المنتج مطلوب').trim(),
  objective: z.string().optional().default(''),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'الشهر يجب أن يكون بصيغة YYYY-MM').trim(),
  annualTarget: z.coerce.number().min(0).optional().default(0),
  avgMonthlyTarget: z.coerce.number().min(0).optional().default(0),
  sales: z.coerce.number().min(0).optional().default(0),
  monthlySales: z.coerce.number().min(0).optional().default(0),
  potentiality: z.coerce.number().min(0).optional().default(0),
  status: z.string().optional().default('Available'),
  notes: z.string().optional().default(''),
  rep: z.string().optional(),
});

export const ProductAvailabilityBatchSchema = z.object({
  hospitalId: z.string().min(1),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  items: z.array(z.object({
    productId: z.string().min(1),
    status: z.enum(['Available', 'Not Available']),
  })).min(1),
  notes: z.string().optional().default(''),
}).superRefine((data, ctx) => {
  if (new Set(data.items.map((item) => item.productId)).size !== data.items.length) {
    ctx.addIssue({ code: 'custom', path: ['items'], message: 'Duplicate products are not allowed' });
  }
});

export const EventSchema = z.object({
  title: z.string().min(1, 'اسم الفعالية / الحدث مطلوب').trim(),
  eventType: z.string().min(1, 'نوع الفعالية مطلوب').default('مؤتمر طبي'),
  eventDate: z.string().min(1, 'تاريخ الفعالية مطلوب').trim(),
  location: z.string().optional().default(''),
  attendeesCount: z.coerce.number().min(0).optional().default(0),
  targetSpecialty: z.string().optional().default(''),
  products: z.string().trim().max(2000).optional().default(''),
  budget: z.string().optional().default(''),
  feedback: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  rep: z.string().optional(),
});

export const TrainingSchema = z.object({
  title: z.string().min(1, 'عنوان التدريب مطلوب').trim(),
  trainingDate: z.string().min(1, 'تاريخ التدريب مطلوب').trim(),
  location: z.string().trim().max(300).optional().default(''),
  rep: z.string().optional(),
});

export const SpecialTaskSchema = z.object({
  title: z.string().min(1, 'Sales Review / Admin Work is required').trim().max(200),
  description: z.string().min(1, 'Description is required').trim().max(4000),
  rep: z.string().optional(),
});

const rateValues = PRESCRIPTION_RATE_OPTIONS.map((option) => option.value) as [string, ...string[]];
export const DoctorVisitV3Schema = z.object({ doctorId:z.string().min(1), products:z.array(z.object({ productId:z.string().min(1), prescriptionRate:z.enum(rateValues) })).min(1), ...VisitModeFields }).refine(x=>x.visitType!=='Double'||Boolean(x.companion),{path:['companion'],message:'Companion is required for a Double visit'});
export const PharmacyVisitV3Schema = z.object({ pharmacyId:z.string().min(1), productIds:z.array(z.string().min(1)).min(1), notes:z.string().trim().max(4000).optional().default(''), ...VisitModeFields }).refine(x=>x.visitType!=='Double'||Boolean(x.companion),{path:['companion'],message:'Companion is required for a Double visit'});
export const BranchVisitV3Schema = z.object({ branchId:z.string().min(1), products:z.array(z.object({productId:z.string().min(1),observation:z.string().trim().max(2000)})).min(1), ...VisitModeFields }).refine(x=>x.visitType!=='Double'||Boolean(x.companion),{path:['companion'],message:'Companion is required for a Double visit'});

export const CalendarDateSchema = z.string().trim().date('تاريخ غير صالح (YYYY-MM-DD)');
export const WeeklyPlanStatusSchema = z.enum(['Draft', 'Submitted', 'Approved']);
export const ManagerPlanStatusSchema = z.literal('Submitted');
export const WeeklyPlanStatusUpdateSchema = z.object({
  status: WeeklyPlanStatusSchema,
  managerNotes: z.string().optional(),
}).strict();

export const PlanActivityCodeSchema = z.enum(['MEETING', 'TRAINING', 'EVENT', 'SALES_REVIEW_ADMIN', 'OTHERS']);
export const StructuredPlanCellSchema = z.object({
  hospitalIds: z.array(z.string().min(1)).max(200).default([]),
  branchIds: z.array(z.string().min(1)).max(200).default([]),
  doctorIds: z.array(z.string().min(1)).max(200).default([]),
  pharmacyIds: z.array(z.string().min(1)).max(200).default([]),
  activities: z.array(PlanActivityCodeSchema).max(5).default([]),
  salesReviewDescription: z.string().trim().max(2000).optional().default(''),
  othersDescription: z.string().trim().max(2000).optional().default(''),
}).superRefine((cell, ctx) => {
  if (cell.activities.includes('OTHERS') && !cell.othersDescription) ctx.addIssue({ code: 'custom', path: ['othersDescription'], message: 'Others description is required' });
  if (cell.activities.includes('SALES_REVIEW_ADMIN') && !cell.salesReviewDescription) ctx.addIssue({ code: 'custom', path: ['salesReviewDescription'], message: 'Sales Review / Admin Work description is required' });
});
export const StructuredWeeklyPlanSchema = z.record(z.string(), z.object({ am: StructuredPlanCellSchema, pm: StructuredPlanCellSchema }));

export const WeeklyPlanSchema = z.object({
  rep: z.string().optional(),
  repId: z.string().optional(),
  userId: z.string().optional(),
  isManagerPersonal: z.boolean().optional(),
  selectedRepId: z.string().min(1).optional(),
  structuredPlan: StructuredWeeklyPlanSchema.optional(),
  startDate: CalendarDateSchema,
  endDate: CalendarDateSchema,
  weekLabel: z.string().optional().default(''),
  saturdayAm: z.string().optional().default(''),
  saturdayPm: z.string().optional().default(''),
  sundayAm: z.string().optional().default(''),
  sundayPm: z.string().optional().default(''),
  mondayAm: z.string().optional().default(''),
  mondayPm: z.string().optional().default(''),
  tuesdayAm: z.string().optional().default(''),
  tuesdayPm: z.string().optional().default(''),
  wednesdayAm: z.string().optional().default(''),
  wednesdayPm: z.string().optional().default(''),
  thursdayAm: z.string().optional().default(''),
  thursdayPm: z.string().optional().default(''),
  fridayAm: z.string().optional().default(''),
  fridayPm: z.string().optional().default(''),
  status: WeeklyPlanStatusSchema.optional().default('Submitted'),
  managerNotes: z.string().optional().default(''),
}).refine(data => data.endDate >= data.startDate, {
  message: 'تاريخ نهاية الأسبوع يجب ألا يسبق بدايته', path: ['endDate'],
});

export const ManagerActivityTypeSchema = z.enum(['Visit', 'Event', 'Training', 'Office Working', 'Others']);
export const ManagerActivityFiltersSchema = z.object({
  startDate: CalendarDateSchema.optional(),
  endDate: CalendarDateSchema.optional(),
  activityType: ManagerActivityTypeSchema.or(z.literal('All')).optional(),
}).refine(data => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
  message: 'نطاق التاريخ غير صالح', path: ['endDate'],
});

export const ManagerActivitySchema = z.object({
  id: z.string().uuid().optional(),
  reportContextType: z.enum(['EMPLOYEE', 'VACANT']).default('EMPLOYEE'),
  selectedRepId: z.string().min(1).nullable().optional(),
  activities: z.array(PlanActivityCodeSchema).max(5).optional().default([]),
  salesReviewDescription: z.string().trim().max(2000).optional().default(''),
  othersDescription: z.string().trim().max(2000).optional().default(''),
  activityType: z.enum(['Visit', 'Event', 'Training', 'Office Working', 'Others'], {
    message: 'نوع النشاط غير صالح',
  }),
  activityDate: CalendarDateSchema,

  // Visit specific
  visitType: z.enum(['Single', 'Double']).optional().default('Single'),
  accompaniedPerson: z.string().trim().optional().default(''),

  // Morning / AM block
  morningHospitalName: z.string().trim().optional().default(''),
  morningDoctorNames: z.string().trim().optional().default(''),
  morningSpecialty: z.string().trim().optional().default(''),
  morningHospitalComment: z.string().trim().optional().default(''),

  // Afternoon / PM block
  afternoonDoctorNames: z.string().trim().optional().default(''),
  afternoonSpecialty: z.string().trim().optional().default(''),
  afternoonDoctorComment: z.string().trim().optional().default(''),
  afternoonPharmacyName: z.string().trim().optional().default(''),
  afternoonPharmacyComment: z.string().trim().optional().default(''),

  // General
  generalComment: z.string().trim().optional().default(''),

  // Event specific
  eventName: z.string().trim().optional().default(''),
  eventType: z.string().trim().optional().default(''),
  location: z.string().trim().optional().default(''),
  attendees: z.string().trim().optional().default(''),
  budget: z.string().trim().optional().default(''),
  eventFeedback: z.string().trim().max(5000).optional().default(''),
  productIds: z.array(z.string().min(1)).max(86).optional().default([]),
  visits: z.array(z.object({
    period: z.enum(['AM', 'PM']),
    entryType: z.enum(['HOSPITAL', 'DIRECT_DOCTOR', 'PHARMACY', 'DISTRIBUTION_BRANCH']),
    hospitalId: z.string().min(1).optional(),
    doctorId: z.string().min(1).optional(),
    pharmacyId: z.string().min(1).optional(),
    branchId: z.string().min(1).optional(),
    manualData: z.object({
      name: z.string().trim().min(1).max(200),
      hospitalType: z.string().trim().max(120).optional().default(''), area: z.string().trim().max(200).optional().default(''), address: z.string().trim().max(500).optional().default(''),
      specialty: z.string().trim().max(200).optional().default(''), distributor: z.string().trim().max(200).optional().default(''),
      products: z.array(z.object({ productId: z.string().min(1), observation: z.string().trim().max(2000).default('') })).max(4).optional().default([]),
    }).optional(),
    generalComment: z.string().trim().max(3000).optional().default(''),
    doctors: z.array(z.object({ doctorId: z.string().min(1).optional(), doctorName: z.string().trim().min(1).max(120).optional(), department: z.string().trim().max(120).optional(), generalComment: z.string().trim().max(3000).optional().default('') }).refine(d => Boolean(d.doctorId || d.doctorName), 'Doctor name is required')).optional().default([]),
  }).superRefine((entry, ctx) => {
    if (!(entry.hospitalId || entry.doctorId || entry.pharmacyId || entry.branchId) && !entry.manualData) ctx.addIssue({ code: 'custom', path: ['manualData'], message: 'A list entity or manual Vacant entry is required' });
  })).max(500).optional().default([]),

  // Training specific
  trainingType: z.string().trim().optional().default(''),
  trainingTopic: z.string().trim().optional().default(''),
  trainingLocation: z.string().trim().optional().default(''),
  participants: z.string().trim().optional().default(''),

  // Office Working specific
  workSummary: z.string().trim().optional().default(''),

  // Others specific
  description: z.string().trim().optional().default(''),

  // Universal notes
  notes: z.string().trim().optional().default(''),
}).refine(
  (data) => {
    if (data.activityType === 'Visit' && data.visitType === 'Double') {
      return Boolean(data.accompaniedPerson && data.accompaniedPerson.trim().length > 0);
    }
    return true;
  },
  {
    message: 'اسم الشخص المرافق مطلوب عند اختيار زيارة مشتركة (Double Visit)',
    path: ['accompaniedPerson'],
  }
).superRefine((data, ctx) => {
  if (data.reportContextType === 'EMPLOYEE' && !data.selectedRepId) ctx.addIssue({ code: 'custom', path: ['selectedRepId'], message: 'Select an authorized Medical Representative' });
  if (data.reportContextType === 'VACANT' && data.selectedRepId) ctx.addIssue({ code: 'custom', path: ['selectedRepId'], message: 'Vacant reports cannot select an employee' });
  data.visits.forEach((visit,index)=>{ if(data.reportContextType==='VACANT'&&!visit.manualData)ctx.addIssue({code:'custom',path:['visits',index,'manualData'],message:'Vacant reports require manual entry'}); if(data.reportContextType==='EMPLOYEE'&&visit.manualData)ctx.addIssue({code:'custom',path:['visits',index,'manualData'],message:'Manual entry is available only for Vacant reports'}); });
  if (data.activities.includes('OTHERS') && !data.othersDescription) ctx.addIssue({ code: 'custom', path: ['othersDescription'], message: 'Others description is required' });
  if (data.activities.includes('SALES_REVIEW_ADMIN') && !data.salesReviewDescription) ctx.addIssue({ code: 'custom', path: ['salesReviewDescription'], message: 'Sales Review / Admin Work description is required' });
  const required = {
    Event: ['eventName', 'اسم الفعالية مطلوب'],
    Training: ['trainingTopic', 'موضوع التدريب مطلوب'],
    'Office Working': ['workSummary', 'ملخص العمل المكتبي مطلوب'],
    Others: ['description', 'وصف النشاط مطلوب'],
  } as const;
  if (data.activityType !== 'Visit') {
    const [field, message] = required[data.activityType];
    if (!data[field]) ctx.addIssue({ code: 'custom', path: [field], message });
  }
});
