export interface RepTargetData {
  repId: string;
  repName: string;
  area: string;
  assignedHospitals: number;
  assignedPharmacies: number;
  assignedDrs: number;
}

export interface RepCoverageResult {
  repId: string;
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

/**
 * Calculates deterministic coverage metrics for a sales representative.
 *
 * Rules:
 * 1. Actual = Count of distinct master entities visited by the representative.
 * 2. Assigned = Targets configured on representative profile.
 * 3. When Assigned is 0 or less, coverage is 0%.
 * 4. Overall Coverage is calculated as the balanced arithmetic mean of (Hospitals % + Pharmacies % + Doctors %) / 3.
 * 5. Percentages are capped at 100% for overall balance.
 */
export function calculateCoverage(
  target: RepTargetData,
  actualCounts: { hospitals: number; pharmacies: number; doctors: number }
): RepCoverageResult {
  const calcPct = (actual: number, assigned: number): number => {
    if (!assigned || assigned <= 0) return 0;
    return Math.min(100, Math.round((Math.max(0, actual) / assigned) * 100));
  };

  const hPct = calcPct(actualCounts.hospitals, target.assignedHospitals);
  const pPct = calcPct(actualCounts.pharmacies, target.assignedPharmacies);
  const dPct = calcPct(actualCounts.doctors, target.assignedDrs);

  const overallPct = Math.round((hPct + pPct + dPct) / 3);

  return {
    repId: target.repId,
    repName: target.repName,
    area: target.area,
    assignedHospitals: target.assignedHospitals,
    actualHospitals: actualCounts.hospitals,
    hospitalCoveragePct: hPct,
    assignedPharmacies: target.assignedPharmacies,
    actualPharmacies: actualCounts.pharmacies,
    pharmacyCoveragePct: pPct,
    assignedDrs: target.assignedDrs,
    actualDrs: actualCounts.doctors,
    drCoveragePct: dPct,
    overallCoveragePct: overallPct,
  };
}
