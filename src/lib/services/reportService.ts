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
import { assertAuthenticatedSession, assertManagerSession } from '@/lib/authPolicy';
import { hierarchyService, HierarchyScopeMode } from './hierarchyService';
import { getManagerActivitiesForTeam } from './managerActivityService';
import { AppError } from '@/lib/errors';

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

const dedupe = <T extends { id: string }>(rows: T[]) => [...new Map(rows.map((row) => [row.id, row])).values()];

export async function getVisibleReports(session: UserSessionPayload | null, options: FilterOptions & {
  requestedRepId?: string | null;
  scopeMode?: HierarchyScopeMode;
} = {}) {
  assertAuthenticatedSession(session);
  if (session.role === 'REPRESENTATIVE') {
    if (!session.repId) throw new AppError('لا يوجد مندوب مرتبط بهذا الحساب', 403);
    if (options.requestedRepId && options.requestedRepId !== session.repId) throw new AppError('غير مصرح', 403);
    return { ...(await getUnifiedReports(session, { ...options, repId: session.repId })), managerActivities: [], reps: [] };
  }
  assertManagerSession(session);
  const reps = await hierarchyService.getScopedRepresentatives(session, options.scopeMode);
  if (options.requestedRepId && !reps.some((r) => r.id === options.requestedRepId)) throw new AppError('غير مصرح', 403);
  const selected = options.requestedRepId ? reps.filter((r) => r.id === options.requestedRepId) : reps;
  const sets = await Promise.all(selected.map((r) => getUnifiedReports(session, { ...options, repId: r.id })));
  const merge = (key: keyof Awaited<ReturnType<typeof getUnifiedReports>>) => dedupe(sets.flatMap((s) => s[key] as Array<{ id: string }>));
  const managerActivities = await getManagerActivitiesForTeam(session, { scopeMode: options.scopeMode });
  return {
    hospitals: merge('hospitals'), pharmacies: merge('pharmacies'), doctors: merge('doctors'), branches: merge('branches'),
    availabilities: merge('availabilities'), events: merge('events'), trainings: merge('trainings'), specialTasks: merge('specialTasks'),
    totalVisits: merge('hospitals').length + merge('pharmacies').length + merge('doctors').length + merge('branches').length,
    managerActivities, reps,
  };
}

export async function getManagerDashboardData(session: UserSessionPayload | null) {
  assertManagerSession(session);
  const [coverageSummaries, reports] = await Promise.all([
    getAllRepresentativesCoverage(),
    getVisibleReports(session),
  ]);
  const allowedRepIds = new Set(reports.reps.map((rep) => rep.id));

  return {
    coverage: coverageSummaries.filter((summary) => allowedRepIds.has(summary.repId)),
    reports,
  };
}
