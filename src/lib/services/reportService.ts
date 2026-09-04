import { UserSessionPayload } from '@/lib/auth';
import { getHospitalReports, FilterOptions } from './hospitalService';
import { getPharmacyReports } from './pharmacyService';
import { getDoctorReports } from './doctorService';
import { getBranchReports } from './branchService';
import { getProductAvailabilityReports } from './availabilityService';
import { getEventsList } from './eventService';
import { getTrainingsList } from './trainingService';
import { getSpecialTasksList } from './specialTaskService';
import { getAllRepresentativesCoverage } from './representativeService';

export async function getUnifiedReports(
  session: UserSessionPayload | null,
  options: FilterOptions = {}
) {
  const [
    hospitals,
    pharmacies,
    doctors,
    branches,
    availabilities,
    eventsList,
    trainingsList,
    specialTasksList,
  ] = await Promise.all([
    getHospitalReports(session, options),
    getPharmacyReports(session, options),
    getDoctorReports(session, options),
    getBranchReports(session, options),
    getProductAvailabilityReports(session, options),
    getEventsList(session, options),
    getTrainingsList(session, options),
    getSpecialTasksList(session, options),
  ]);

  return {
    hospitals,
    pharmacies,
    doctors,
    branches,
    availabilities,
    events: eventsList,
    trainings: trainingsList,
    specialTasks: specialTasksList,
    totalVisits: hospitals.length + pharmacies.length + doctors.length + branches.length,
  };
}

export async function getManagerDashboardData(session: UserSessionPayload | null) {
  const [coverageSummaries, reports] = await Promise.all([
    getAllRepresentativesCoverage(),
    getUnifiedReports(session),
  ]);

  return {
    coverage: coverageSummaries,
    reports,
  };
}
