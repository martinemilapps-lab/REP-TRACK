import * as XLSX from 'xlsx';
import {
  Representative,
  HospitalVisitRecord,
  PharmacyVisitRecord,
  DoctorVisitRecord,
  BranchVisitRecord,
  ProductAvailabilityRecord,
  EventRecord,
  TrainingRecord,
  SpecialTaskRecord,
  WeeklyPlanRecord
} from '@/types';

export interface ExportDataPayload {
  reps: Representative[];
  hospitals: HospitalVisitRecord[];
  pharmacies: PharmacyVisitRecord[];
  doctors: DoctorVisitRecord[];
  branches: BranchVisitRecord[];
  availabilities: ProductAvailabilityRecord[];
  events?: EventRecord[];
  trainings?: TrainingRecord[];
  specialTasks?: SpecialTaskRecord[];
  weeklyPlans?: WeeklyPlanRecord[];
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
    'Visit Objective': r.objective || '',
    'Area': r.area,
    'Hospital Type': r.type,
    'Target Department / Specialty': r.dept || '',
    'Drs Visited': r.drsVisited ?? '',
    'Visited Doctor Names': r.doctorNames || '',
    'Pharmacist / Purchasing': r.contact || '',
    'Phone Number': r.phone || '',
    'Visit Type': r.visitType || 'Single',
    'Companion (Co-Rep / Manager)': r.companion || '',
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
    'Visit Objective': r.objective || '',
    'Full Address': r.address || '',
    'Responsible Pharmacist': r.pharmacist || '',
    'Mobile Number': r.mobile || '',
    'Class (A/B/C)': r.cls || 'A',
    'Stock per Month': r.stockPerMonth ?? '',
    'Sales per Month': r.salesPerMonth ?? '',
    'Visit Type': r.visitType || 'Single',
    'Companion (Co-Rep / Manager)': r.companion || '',
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
    'Visit Objective': r.objective || '',
    'Specialty': r.specialty || '',
    'Workplace (Clinic/Hospital)': r.workplace || '',
    'Nearby Pharmacy': r.nearbyPharmacy || '',
    'Area': r.area,
    'Mobile Number': r.mobile || '',
    'Class (A/B)': r.cls || 'A',
    'Prescriptions Rate': r.prescriptionRate || '',
    'Date visited': r.visitDate || '',
    'Visit Type': r.visitType || 'Single',
    'Companion (Co-Rep / Manager)': r.companion || '',
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
    'Visit Objective': r.objective || '',
    'Coverage Area': r.area,
    'Contact Person': r.contact || '',
    'Phone Number': r.phone || '',
    'Visit Type': r.visitType || 'Single',
    'Companion (Co-Rep / Manager)': r.companion || '',
    'Distributed Products': r.products || '',
    'Monthly Stock': r.monthlyStock ?? '',
    'Monthly Sales': r.monthlySales ?? '',
    'Last Visit Date': r.lastVisit || '',
    'Status': r.status || 'Visited',
    'Notes': r.notes || ''
  }));

  const availabilitySheet = data.availabilities.map((r) => {
    const salesVal = r.sales ?? 0;
    const avgVal = r.avgMonthlyTarget ?? 0;
    const annualVal = r.annualTarget ?? 0;
    const potVal = r.potentiality ?? 0;
    const pctAvg = avgVal > 0 ? `${Math.round((salesVal / avgVal) * 100)}%` : '0%';
    const pctAnn = annualVal > 0 ? `${Math.round((salesVal / annualVal) * 100)}%` : '0%';
    const pctPot = potVal > 0 ? `${Math.round((salesVal / potVal) * 100)}%` : '0%';

    return {
      'Assigned Rep': r.rep,
      'Hospital / Medical Center': r.hospital,
      'Area': r.area,
      'Product': r.product,
      'Month': r.month,
      'Annual Target for Each Product': r.annualTarget ?? '',
      'Average Target / Month': r.avgMonthlyTarget ?? '',
      'Sales / Month': salesVal,
      'Potentiality / Month': r.potentiality ?? '',
      'Sales % of Average Target / Month': r.salesPctAvgTarget || pctAvg,
      'Sales % of Annual Target': r.salesPctAnnualTarget || pctAnn,
      'Sales % of Potentiality': r.salesPctPotentiality || pctPot,
      'Availability Status': r.status || 'Available',
      'Notes': r.notes || '',
    };
  });

  const eventsSheet = (data.events || []).map((r) => ({
    'Assigned Rep': r.rep,
    'Event Title': r.title,
    'Event Type': r.eventType,
    'Event Date': r.eventDate,
    'Location / Venue': r.location || '',
    'Attendees Count': r.attendeesCount ?? 0,
    'Target Specialty': r.targetSpecialty || '',
    'Highlighted Products': r.products || '',
    'Budget / Cost': r.budget || '',
    'Key Outcomes & Feedback': r.feedback || '',
    'Notes': r.notes || ''
  }));

  const trainingsSheet = (data.trainings || []).map((r) => ({
    'Assigned Rep': r.rep,
    'Training Title': r.title,
    'Training Type': r.trainingType,
    'Training Date': r.trainingDate,
    'Trainer / Facilitator': r.trainer || '',
    'Attendees / Trainees': r.attendees || '',
    'Duration (Hours)': r.durationHours ?? 1,
    'Key Learnings & Takeaways': r.outcomes || '',
    'Notes': r.notes || ''
  }));

  const specialTasksSheet = (data.specialTasks || []).map((r) => ({
    'Assigned Rep': r.rep,
    'Task Title': r.title,
    'Task Category': r.taskCategory,
    'Task Date': r.taskDate,
    'Assigned By': r.assignedBy || '',
    'Priority': r.priority || 'Normal',
    'Status': r.status || 'Completed',
    'Description & Deliverables': r.description || '',
    'Notes': r.notes || ''
  }));

  const weeklyPlansSheet = (data.weeklyPlans || []).map((p) => ({
    'Representative': p.rep,
    'Week Range': p.weekLabel || `${p.startDate} to ${p.endDate}`,
    'Status': p.status || 'Submitted',
    'Saturday AM': p.saturdayAm || '',
    'Saturday PM': p.saturdayPm || '',
    'Sunday AM': p.sundayAm || '',
    'Sunday PM': p.sundayPm || '',
    'Monday AM': p.mondayAm || '',
    'Monday PM': p.mondayPm || '',
    'Tuesday AM': p.tuesdayAm || '',
    'Tuesday PM': p.tuesdayPm || '',
    'Wednesday AM': p.wednesdayAm || '',
    'Wednesday PM': p.wednesdayPm || '',
    'Thursday AM': p.thursdayAm || '',
    'Thursday PM': p.thursdayPm || '',
    'Friday AM': p.fridayAm || '',
    'Friday PM': p.fridayPm || '',
    'Manager Notes': p.managerNotes || '',
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(repsSheet.length ? repsSheet : [{}]), 'Reps');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hospitalsSheet.length ? hospitalsSheet : [{}]), 'Hospitals');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pharmaciesSheet.length ? pharmaciesSheet : [{}]), 'Pharmacies');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(doctorsSheet.length ? doctorsSheet : [{}]), 'Doctors');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(branchesSheet.length ? branchesSheet : [{}]), 'Distribution Branches');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eventsSheet.length ? eventsSheet : [{}]), 'Events');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trainingsSheet.length ? trainingsSheet : [{}]), 'Training');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(specialTasksSheet.length ? specialTasksSheet : [{}]), 'Special Tasks');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(availabilitySheet.length ? availabilitySheet : [{}]), 'Products Analysis');
  if (weeklyPlansSheet.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(weeklyPlansSheet), 'Weekly Plans');
  }

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new Uint8Array(buf);
}

/**
 * Generates an Excel workbook for a single Weekly Plan matching the exact template layout.
 */
export function generateWeeklyPlanWorkbook(plan: WeeklyPlanRecord): Uint8Array {
  const wsData = [
    ['', 'WEEKLY PLAN', ''],
    [`NAME :-  ${plan.rep || ''}`, '', `DATE:- ${plan.startDate || ''} to ${plan.endDate || ''}`],
    ['DAY', 'AM', 'PM'],
    ['SATURDAY', plan.saturdayAm || '', plan.saturdayPm || ''],
    ['SUNDAY', plan.sundayAm || '', plan.sundayPm || ''],
    ['MONDAY', plan.mondayAm || '', plan.mondayPm || ''],
    ['TUESDAY', plan.tuesdayAm || '', plan.tuesdayPm || ''],
    ['WEDNESDAY', plan.wednesdayAm || '', plan.wednesdayPm || ''],
    ['THURSDAY', plan.thursdayAm || '', plan.thursdayPm || ''],
    ['FRIDAY', plan.fridayAm || '', plan.fridayPm || ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merges matching the official template
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Row 1: A1:C1 "WEEKLY PLAN"
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Row 2: A2:B2 "NAME :- Mario Nader"
  ];

  // Column widths
  ws['!cols'] = [
    { wch: 18 }, // DAY
    { wch: 48 }, // AM
    { wch: 48 }, // PM
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'WEEKLY PLAN');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new Uint8Array(buf);
}
