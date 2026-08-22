import * as XLSX from 'xlsx';
import {
  Representative,
  HospitalVisitRecord,
  PharmacyVisitRecord,
  DoctorVisitRecord,
  BranchVisitRecord,
  ProductAvailabilityRecord
} from '@/types';

export interface ExportDataPayload {
  reps: Representative[];
  hospitals: HospitalVisitRecord[];
  pharmacies: PharmacyVisitRecord[];
  doctors: DoctorVisitRecord[];
  branches: BranchVisitRecord[];
  availabilities: ProductAvailabilityRecord[];
}

export function generateExcelWorkbook(data: ExportDataPayload): Uint8Array {
  const repsSheet = data.reps.map((r) => {
    const hc = data.hospitals.filter((x) => x.rep === r.name).length;
    const pc = data.pharmacies.filter((x) => x.rep === r.name).length;
    const dc = data.doctors.filter((x) => x.rep === r.name).length;

    return {
      'Rep Name': r.name,
      'Region / Area': r.area,
      'Assigned Hospitals': r.assignedHospitals,
      'Actual Visited Hospitals': hc,
      'Coverage Hospital': r.assignedHospitals ? +(hc / r.assignedHospitals).toFixed(2) : 0,
      'Assigned Pharmacies': r.assignedPharmacies,
      'Actual Visited Pharmacies': pc,
      'Coverage Pharmacies': r.assignedPharmacies ? +(pc / r.assignedPharmacies).toFixed(2) : 0,
      'Assigned Drs': r.assignedDrs,
      'Total Actual Dr Visits': dc,
      'Coverage Drs': r.assignedDrs ? +(dc / r.assignedDrs).toFixed(2) : 0
    };
  });

  const hospitalsSheet = data.hospitals.map((r) => ({
    'Assigned Rep': r.rep,
    'Hospital Name': r.name,
    'Area': r.area,
    'Hospital Type': r.type,
    'Target Department / Specialty': r.dept || '',
    'Drs Visited': r.drsVisited ?? '',
    'Contact Person': r.contact || '',
    'Phone Number': r.phone || '',
    'Visit Cycle (Days)': r.cycle ?? '',
    'Last Visit Date': r.lastVisit || '',
    'Next Visit Date': r.nextVisit || '',
    'Status': r.status || 'Visited',
    'Products Available': r.ourProducts || '',
    'Competitor Available': r.competitor || '',
    'Notes': r.notes || ''
  }));

  const pharmaciesSheet = data.pharmacies.map((r) => ({
    'Assigned Rep': r.rep,
    'Area / District': r.area,
    'Pharmacy Name': r.name,
    'Full Address': r.address || '',
    'Responsible Pharmacist': r.pharmacist || '',
    'Mobile Number': r.mobile || '',
    'Class (A/B/C)': r.cls || 'A',
    'Visit Cycle (Days)': r.cycle ?? '',
    'Last Visit Date': r.lastVisit || '',
    'Next Visit Date': r.nextVisit || '',
    'Status': r.status || 'Visited',
    'Products Available': r.ourProducts || '',
    'Competitor Available': r.competitor || '',
    'Notes': r.notes || ''
  }));

  const doctorsSheet = data.doctors.map((r) => ({
    'Assigned Rep': r.rep,
    'Doctor Code': r.code || '',
    'Doctor Name': r.name,
    'Specialty': r.specialty || '',
    'Workplace (Clinic/Hospital)': r.workplace || '',
    'Area': r.area,
    'Mobile Number': r.mobile || '',
    'Class (A/B)': r.cls || 'A',
    'Date visited': r.visitDate || '',
    'Products Presented F1': r.f1 || '',
    'Products Presented F2': r.f2 || '',
    'Products Presented F3': r.f3 || '',
    'Products Presented Reminder': r.reminder || '',
    'Visit Cycle': r.cycle ?? '',
    'Next Date visit': r.nextVisit || '',
    'Status': r.status || 'Visited',
    'Notes': r.notes || ''
  }));

  const branchesSheet = data.branches.map((r) => ({
    'Assigned Rep': r.rep,
    'Distributor / Branch Name': r.name,
    'Coverage Area': r.area,
    'Contact Person': r.contact || '',
    'Phone Number': r.phone || '',
    'Distributed Products': r.products || '',
    'Last Visit Date': r.lastVisit || '',
    'Notes': r.notes || ''
  }));

  const availabilitySheet = data.availabilities.map((r) => ({
    'Assigned Rep': r.rep,
    'Hospital': r.hospital,
    'Area': r.area,
    'Product': r.product,
    'Month': r.month,
    'Sales (Units)': r.sales ?? 0,
    'Availability': r.status || 'Available',
    'Notes': r.notes || ''
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(repsSheet.length ? repsSheet : [{}]), 'Reps');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hospitalsSheet.length ? hospitalsSheet : [{}]), 'Hospitals');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pharmaciesSheet.length ? pharmaciesSheet : [{}]), 'Pharmacies');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(doctorsSheet.length ? doctorsSheet : [{}]), 'Doctors');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(branchesSheet.length ? branchesSheet : [{}]), 'Distribution Branches');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(availabilitySheet.length ? availabilitySheet : [{}]), 'Product Availability');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new Uint8Array(buf);
}
