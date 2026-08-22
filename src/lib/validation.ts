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
  dept: z.string().optional().default(''),
  drsVisited: z.coerce.number().min(0).optional().default(0),
  contact: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  cycle: z.coerce.number().min(0).optional().default(0),
  lastVisit: z.string().optional().default(''),
  nextVisit: z.string().optional().default(''),
  status: z.string().optional().default('Visited'),
  ourProducts: z.string().optional().default(''),
  competitor: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  rep: z.string().optional(), // optional legacy field, overridden on server
});

export const PharmacyVisitSchema = z.object({
  name: z.string().min(1, 'اسم الصيدلية مطلوب').trim(),
  area: z.string().optional().default('').transform((v) => v.trim()),
  address: z.string().optional().default(''),
  pharmacist: z.string().optional().default(''),
  mobile: z.string().optional().default(''),
  cls: z.string().optional().default('A'),
  cycle: z.coerce.number().min(0).optional().default(0),
  lastVisit: z.string().optional().default(''),
  nextVisit: z.string().optional().default(''),
  status: z.string().optional().default('Visited'),
  ourProducts: z.string().optional().default(''),
  competitor: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  rep: z.string().optional(),
});

export const DoctorVisitSchema = z.object({
  name: z.string().min(1, 'اسم الدكتور مطلوب').trim(),
  code: z.string().optional().default(''),
  specialty: z.string().optional().default(''),
  workplace: z.string().optional().default(''),
  area: z.string().optional().default('').transform((v) => v.trim()),
  mobile: z.string().optional().default(''),
  cls: z.string().optional().default('A'),
  visitDate: z.string().optional().default(''),
  cycle: z.coerce.number().min(0).optional().default(0),
  nextVisit: z.string().optional().default(''),
  status: z.string().optional().default('Visited'),
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
  contact: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  products: z.string().optional().default(''),
  lastVisit: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  rep: z.string().optional(),
});

export const ProductAvailabilitySchema = z.object({
  hospital: z.string().min(1, 'اسم المستشفى مطلوب').trim(),
  area: z.string().optional().default('').transform((v) => v.trim()),
  product: z.string().min(1, 'اسم المنتج مطلوب').trim(),
  month: z.string().min(1, 'الشهر مطلوب').trim(),
  sales: z.coerce.number().min(0).optional().default(0),
  status: z.string().optional().default('Available'),
  notes: z.string().optional().default(''),
  rep: z.string().optional(),
});
