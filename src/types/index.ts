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

export interface HospitalVisitRecord {
  id: string;
  repId?: string;
  rep: string;
  name: string;
  area: string;
  type: string; // 'Private' | 'Government' | 'University' | 'Insurance' | 'Other'
  dept?: string;
  drsVisited?: number;
  contact?: string;
  phone?: string;
  cycle?: number;
  lastVisit?: string;
  nextVisit?: string;
  status: string; // 'Visited' | 'Overdue' | 'Not visited yet'
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
  pharmacist?: string;
  mobile?: string;
  cls: string; // 'A' | 'B' | 'C'
  cycle?: number;
  lastVisit?: string;
  nextVisit?: string;
  status: string;
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
  specialty?: string;
  workplace?: string;
  area: string;
  mobile?: string;
  cls: string; // 'A' | 'B'
  visitDate?: string;
  cycle?: number;
  nextVisit?: string;
  status: string;
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
  contact?: string;
  phone?: string;
  products?: string;
  lastVisit?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
  submittedAt?: string;
}

export interface ProductAvailabilityRecord {
  id: string;
  repId?: string;
  rep: string;
  hospital: string;
  area: string;
  product: string;
  month: string;
  sales?: number;
  status: string; // 'Available' | 'Not Available'
  notes?: string;
  createdAt?: string;
  submittedAt?: string;
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
