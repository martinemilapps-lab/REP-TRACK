import { z } from 'zod';

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
  notes: z.string().optional().default(''),
  rep: z.string().optional(), // optional legacy field, overridden on server
});

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
  code: z.string().optional().default(''),
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
  products: z.string().optional().default(''),
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
  dept: z.string().optional().default(''),
  contact: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  doctorNames: z.string().optional().default(''),
  defaultCycle: z.coerce.number().min(0).optional().default(7),
  targetProducts: z.string().optional().default(''),
  rep: z.string().optional(),
});

export const MasterPharmacySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'اسم الصيدلية مطلوب').trim(),
  area: z.string().optional().default('').transform((v) => v.trim()),
  address: z.string().optional().default(''),
  pharmacist: z.string().optional().default(''),
  mobile: z.string().optional().default(''),
  classification: z.string().optional().default('A'),
  defaultCycle: z.coerce.number().min(0).optional().default(7),
  targetProducts: z.string().optional().default(''),
  rep: z.string().optional(),
});

export const MasterDoctorSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional().default(''),
  name: z.string().min(1, 'اسم الطبيب مطلوب').trim(),
  specialty: z.string().optional().default(''),
  workplace: z.string().optional().default(''),
  area: z.string().optional().default('').transform((v) => v.trim()),
  address: z.string().optional().default(''),
  mobile: z.string().optional().default(''),
  classification: z.string().optional().default('A'),
  bestTime: z.string().optional().default(''),
  defaultCycle: z.coerce.number().min(0).optional().default(7),
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
  defaultCycle: z.coerce.number().min(0).optional().default(7),
  rep: z.string().optional(),
});

export const ProductAvailabilitySchema = z.object({
  hospital: z.string().min(1, 'اسم المستشفى مطلوب').trim(),
  area: z.string().optional().default('').transform((v) => v.trim()),
  product: z.string().min(1, 'اسم المنتج مطلوب').trim(),
  objective: z.string().optional().default(''),
  month: z.string().min(1, 'الشهر مطلوب').trim(),
  annualTarget: z.coerce.number().min(0).optional().default(0),
  avgMonthlyTarget: z.coerce.number().min(0).optional().default(0),
  sales: z.coerce.number().min(0).optional().default(0),
  monthlySales: z.coerce.number().min(0).optional().default(0),
  potentiality: z.coerce.number().min(0).optional().default(0),
  status: z.string().optional().default('Available'),
  notes: z.string().optional().default(''),
  rep: z.string().optional(),
});

export const ProductAnalysisSchema = ProductAvailabilitySchema;

export const EventSchema = z.object({
  title: z.string().min(1, 'اسم الفعالية / الحدث مطلوب').trim(),
  eventType: z.string().min(1, 'نوع الفعالية مطلوب').default('مؤتمر طبي'),
  eventDate: z.string().min(1, 'تاريخ الفعالية مطلوب').trim(),
  location: z.string().optional().default(''),
  attendeesCount: z.coerce.number().min(0).optional().default(0),
  targetSpecialty: z.string().optional().default(''),
  products: z.string().optional().default(''),
  budget: z.string().optional().default(''),
  feedback: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  rep: z.string().optional(),
});

export const TrainingSchema = z.object({
  title: z.string().min(1, 'عنوان التدريب مطلوب').trim(),
  trainingType: z.string().min(1, 'نوع التدريب مطلوب').default('تدريب علمي ومنتجات'),
  trainingDate: z.string().min(1, 'تاريخ التدريب مطلوب').trim(),
  trainer: z.string().optional().default(''),
  attendees: z.string().optional().default(''),
  durationHours: z.coerce.number().min(0).optional().default(1),
  outcomes: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  rep: z.string().optional(),
});

export const SpecialTaskSchema = z.object({
  title: z.string().min(1, 'عنوان المهمة مطلوب').trim(),
  taskCategory: z.string().min(1, 'تصنيف المهمة مطلوب').default('مسح ميداني للسوق'),
  taskDate: z.string().min(1, 'تاريخ المهمة مطلوب').trim(),
  assignedBy: z.string().optional().default(''),
  priority: z.string().optional().default('Normal'),
  status: z.string().optional().default('Completed'),
  description: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  rep: z.string().optional(),
});

export const WeeklyPlanSchema = z.object({
  rep: z.string().optional(),
  repId: z.string().optional(),
  startDate: z.string().min(1, 'تاريخ بداية الأسبوع مطلوب').trim(),
  endDate: z.string().min(1, 'تاريخ نهاية الأسبوع مطلوب').trim(),
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
  status: z.string().optional().default('Submitted'),
  managerNotes: z.string().optional().default(''),
});
