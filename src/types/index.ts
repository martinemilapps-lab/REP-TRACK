export type ActivityType = 'hospital' | 'pharmacy' | 'doctor' | 'branch' | 'availability';

export type VisitStatus = 'Visited' | 'Overdue' | 'Not visited yet';

export type AvailabilityStatus = 'Available' | 'Not Available';

export interface Representative {
  id: string;
  name: string;
  area: string;
  assignedHospitals: number;
  assignedPharmacies: number;
  assignedDrs: number;
  isActive?: boolean;
}

export type VisitType = 'Single' | 'Double';

export interface HospitalVisitRecord {
  id: string;
  repId?: string;
  rep: string;
  name: string;
  area: string;
  type: string; // 'Private' | 'Government' | 'University' | 'Insurance' | 'Other'
  objective?: string;
  dept?: string;
  drsVisited?: number;
  doctorNames?: string;
  contact?: string;
  phone?: string;
  cycle?: number;
  lastVisit?: string;
  nextVisit?: string;
  status: string; // 'Visited' | 'Overdue' | 'Not visited yet'
  visitType?: VisitType | string;
  companion?: string;
  ourProducts?: string;
  competitor?: string;
  notes?: string;
  createdAt?: string;
  submittedAt?: string;
}

export interface PharmacyVisitRecord {
  id: string;
  repId?: string;
  rep: string;
  name: string;
  area: string;
  address?: string;
  objective?: string;
  pharmacist?: string;
  mobile?: string;
  cls: string; // 'A' | 'B' | 'C'
  cycle?: number;
  lastVisit?: string;
  nextVisit?: string;
  status: string;
  visitType?: VisitType | string;
  companion?: string;
  ourProducts?: string;
  competitor?: string;
  notes?: string;
  createdAt?: string;
  submittedAt?: string;
}

export interface DoctorVisitRecord {
  id: string;
  repId?: string;
  rep: string;
  code?: string;
  name: string;
  objective?: string;
  specialty?: string;
  workplace?: string;
  area: string;
  mobile?: string;
  cls: string; // 'A' | 'B'
  visitDate?: string;
  cycle?: number;
  nextVisit?: string;
  status: string;
  visitType?: VisitType | string;
  companion?: string;
  f1?: string;
  f2?: string;
  f3?: string;
  reminder?: string;
  notes?: string;
  createdAt?: string;
  submittedAt?: string;
}

export interface BranchVisitRecord {
  id: string;
  repId?: string;
  rep: string;
  name: string;
  area: string;
  objective?: string;
  contact?: string;
  phone?: string;
  products?: string;
  cycle?: number;
  lastVisit?: string;
  nextVisit?: string;
  status?: string;
  visitType?: VisitType | string;
  companion?: string;
  notes?: string;
  createdAt?: string;
  submittedAt?: string;
}

export interface MasterHospital {
  id: string;
  repId?: string;
  name: string;
  area: string;
  type: string;
  dept?: string;
  contact?: string;
  phone?: string;
  doctorNames?: string;
  defaultCycle?: number;
  targetProducts?: string;
  createdAt?: string;
}

export interface MasterPharmacy {
  id: string;
  repId?: string;
  name: string;
  area: string;
  address?: string;
  pharmacist?: string;
  mobile?: string;
  classification: string;
  defaultCycle?: number;
  targetProducts?: string;
  createdAt?: string;
}

export interface MasterDoctor {
  id: string;
  repId?: string;
  code?: string;
  name: string;
  specialty?: string;
  workplace?: string;
  area: string;
  mobile?: string;
  classification: string;
  bestTime?: string;
  defaultCycle?: number;
  targetProducts?: string;
  createdAt?: string;
}

export interface MasterBranch {
  id: string;
  repId?: string;
  name: string;
  coverageArea: string;
  contact?: string;
  phone?: string;
  distributedProducts?: string;
  defaultCycle?: number;
  createdAt?: string;
}

export interface MasterListsPayload {
  hospitals: MasterHospital[];
  pharmacies: MasterPharmacy[];
  doctors: MasterDoctor[];
  branches: MasterBranch[];
}

export interface ProductAvailabilityRecord {
  id: string;
  repId?: string;
  rep: string;
  hospital: string;
  area: string;
  product: string;
  objective?: string;
  month: string;
  sales?: number;
  status: string; // 'Available' | 'Not Available'
  notes?: string;
  createdAt?: string;
  submittedAt?: string;
}

export interface WeeklyPlanRecord {
  id: string;
  repId: string;
  rep: string;
  startDate: string; // YYYY-MM-DD or DD-MM-YYYY
  endDate: string; // YYYY-MM-DD or DD-MM-YYYY
  weekLabel?: string; // e.g. "22-8-2026 to 27-8-2026"
  saturdayAm?: string;
  saturdayPm?: string;
  sundayAm?: string;
  sundayPm?: string;
  mondayAm?: string;
  mondayPm?: string;
  tuesdayAm?: string;
  tuesdayPm?: string;
  wednesdayAm?: string;
  wednesdayPm?: string;
  thursdayAm?: string;
  thursdayPm?: string;
  fridayAm?: string;
  fridayPm?: string;
  status: 'Draft' | 'Submitted' | 'Approved' | string;
  managerNotes?: string;
  submittedAt?: string;
  updatedAt?: string;
}

export interface RepCoverageSummary {
  repName: string;
  area: string;
  assignedHospitals: number;
  actualHospitals: number;
  hospitalCoveragePct: number;
  assignedPharmacies: number;
  actualPharmacies: number;
  pharmacyCoveragePct: number;
  assignedDrs: number;
  actualDrs: number;
  drCoveragePct: number;
  overallCoveragePct: number;
}

export interface ManagerOverviewStats {
  totalHospitalVisits: number;
  totalPharmacyVisits: number;
  totalDoctorVisits: number;
  totalBranchVisits: number;
  totalAvailabilityReports: number;
  totalWeeklyPlans?: number;
  totalReps: number;
}

export interface RepOverviewStats {
  totalVisits: number;
  visitedCount: number;
  notVisitedCount: number;
  overdueCount: number;
}

export interface AuthSession {
  user: {
    id: string;
    username: string;
    name: string;
    role: 'MANAGER' | 'REPRESENTATIVE';
    repId?: string;
  } | null;
}
