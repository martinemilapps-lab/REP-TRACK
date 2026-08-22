import { Representative, RepCoverageSummary, RepOverviewStats } from '@/types';
import { calculateCoverage as pureCalculateCoverage } from './business/coverage';
import { statusToBucket } from './business/status';

export { pureCalculateCoverage as calculateCoverage };

export function calculateRepCoverage(
  rep: Representative,
  hospitalVisitsCount: number,
  pharmacyVisitsCount: number,
  doctorVisitsCount: number
): RepCoverageSummary {
  const res = pureCalculateCoverage(
    {
      repId: rep.id,
      repName: rep.name,
      area: rep.area,
      assignedHospitals: rep.assignedHospitals,
      assignedPharmacies: rep.assignedPharmacies,
      assignedDrs: rep.assignedDrs,
    },
    {
      hospitals: hospitalVisitsCount,
      pharmacies: pharmacyVisitsCount,
      doctors: doctorVisitsCount,
    }
  );

  return {
    repName: res.repName,
    area: res.area,
    assignedHospitals: res.assignedHospitals,
    actualHospitals: res.actualHospitals,
    hospitalCoveragePct: res.hospitalCoveragePct,
    assignedPharmacies: res.assignedPharmacies,
    actualPharmacies: res.actualPharmacies,
    pharmacyCoveragePct: res.pharmacyCoveragePct,
    assignedDrs: res.assignedDrs,
    actualDrs: res.actualDrs,
    drCoveragePct: res.drCoveragePct,
    overallCoveragePct: res.overallCoveragePct,
  };
}

export function statusBucket(status?: string): 'visited' | 'overdue' | 'notvisited' {
  return statusToBucket(status);
}

export function calculateRepOverviewStats(
  visits: Array<{ status?: string }>,
  availabilityCount: number = 0
): RepOverviewStats {
  let visitedCount = 0;
  let notVisitedCount = 0;
  let overdueCount = 0;

  for (const v of visits) {
    const bucket = statusBucket(v.status);
    if (bucket === 'visited') visitedCount++;
    else if (bucket === 'overdue') overdueCount++;
    else if (bucket === 'notvisited') notVisitedCount++;
  }

  const totalVisits = visits.length + availabilityCount;

  return {
    totalVisits,
    visitedCount,
    notVisitedCount,
    overdueCount,
  };
}
