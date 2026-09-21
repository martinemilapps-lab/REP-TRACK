import { and, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import {
  db,
  hospitals,
  doctors,
  pharmacies,
  distributionBranches,
  hospitalVisits,
  doctorVisits,
  pharmacyVisits,
  branchVisits,
  representativeVisitRates,
  representatives,
} from '@/lib/db';

export type CustomerCategory = 'HOSPITAL' | 'DOCTOR' | 'PHARMACY' | 'DISTRIBUTION_BRANCH';

export type CoverageColor = 'GREEN' | 'YELLOW' | 'RED';
export type AverageColor = 'GREEN' | 'YELLOW' | 'RED';

export interface CategoryCoverageMetrics {
  category: CustomerCategory;
  categoryLabel: { ar: string; en: string };
  totalInList: number;
  visitedEntitiesCount: number;
  coveragePct: number;
  color: CoverageColor;
}

export interface CategoryAverageMetrics {
  category: CustomerCategory;
  categoryLabel: { ar: string; en: string };
  actualVisits: number;
  bumRate: number; // Benchmark A: entered by BUM
  listRate: number; // Benchmark B: calculated from My Lists visit cycles
  comparisonVsBum: 'SAME' | 'ABOVE' | 'BELOW';
  colorVsBum: AverageColor;
  comparisonVsList: 'SAME' | 'ABOVE' | 'BELOW';
  colorVsList: AverageColor;
}

export interface AverageCoverageReport {
  repId: string;
  repName: string;
  repArea: string;
  date: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  coverage: {
    hospital: CategoryCoverageMetrics;
    doctor: CategoryCoverageMetrics;
    pharmacy: CategoryCoverageMetrics;
    branch: CategoryCoverageMetrics;
    overall: {
      totalInList: number;
      visitedEntitiesCount: number;
      coveragePct: number;
      color: CoverageColor;
    };
  };
  averageVisits: {
    hospital: CategoryAverageMetrics;
    doctor: CategoryAverageMetrics;
    pharmacy: CategoryAverageMetrics;
    branch: CategoryAverageMetrics;
    overall: {
      actualVisits: number;
      totalBumRate: number;
      totalListRate: number;
      comparisonVsBum: 'SAME' | 'ABOVE' | 'BELOW';
      colorVsBum: AverageColor;
      comparisonVsList: 'SAME' | 'ABOVE' | 'BELOW';
      colorVsList: AverageColor;
    };
  };
}

/**
 * 1- Coverage Color rule:
 * Green: 90% - 100%
 * Yellow: 80% - 89.9%
 * Red: Less than 80%
 */
export function getCoverageColor(percentage: number): CoverageColor {
  if (percentage >= 90) return 'GREEN';
  if (percentage >= 80) return 'YELLOW';
  return 'RED';
}

/**
 * 3- Average Results Color rule:
 * Green: MR visited with same visits rate already determined
 * Yellow: MR visited more visits rate than already determined
 * Red: MR visited less visits rate than already determined
 */
export function getAverageComparison(
  actual: number,
  determined: number,
): { comparison: 'SAME' | 'ABOVE' | 'BELOW'; color: AverageColor } {
  if (determined <= 0) {
    if (actual > 0) return { comparison: 'ABOVE', color: 'YELLOW' };
    return { comparison: 'SAME', color: 'GREEN' };
  }

  // Exact match or within a standard single visit margin
  if (actual === determined) {
    return { comparison: 'SAME', color: 'GREEN' };
  } else if (actual > determined) {
    return { comparison: 'ABOVE', color: 'YELLOW' };
  } else {
    return { comparison: 'BELOW', color: 'RED' };
  }
}

/**
 * Resolves start and end dates based on period and reference date
 */
export function resolvePeriodDateRange(
  targetDate: string,
  period: 'daily' | 'weekly' | 'monthly',
): { startDate: string; endDate: string } {
  const d = new Date(targetDate);
  if (isNaN(d.getTime())) {
    const today = new Date().toISOString().slice(0, 10);
    return { startDate: today, endDate: today };
  }

  if (period === 'daily') {
    return { startDate: targetDate, endDate: targetDate };
  }

  if (period === 'weekly') {
    // Start of week: Saturday (day index 6 in JS 0-6 Sun-Sat)
    const day = d.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    const diffToSat = (day + 1) % 7; // days passed since Saturday
    const sat = new Date(d);
    sat.setDate(d.getDate() - diffToSat);
    const fri = new Date(sat);
    fri.setDate(sat.getDate() + 6);
    return {
      startDate: sat.toISOString().slice(0, 10),
      endDate: fri.toISOString().slice(0, 10),
    };
  }

  if (period === 'monthly') {
    const y = d.getFullYear();
    const m = d.getMonth();
    const firstDay = new Date(y, m, 1).toISOString().slice(0, 10);
    const lastDay = new Date(y, m + 1, 0).toISOString().slice(0, 10);
    return { startDate: firstDay, endDate: lastDay };
  }

  return { startDate: targetDate, endDate: targetDate };
}

/**
 * Calculates real-time Average and Coverage metrics for an MR
 */
export async function calculateAverageAndCoverage(
  repId: string,
  targetDate: string = new Date().toISOString().slice(0, 10),
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
): Promise<AverageCoverageReport> {
  const { startDate, endDate } = resolvePeriodDateRange(targetDate, period);

  // 1. Fetch Representative Profile
  const repProfile = await db
    .select()
    .from(representatives)
    .where(eq(representatives.id, repId))
    .get();

  const repName = repProfile?.name || 'Unknown Rep';
  const repArea = repProfile?.area || 'Unassigned';

  // 2. Fetch Active Master Lists for this MR
  const [hospList, docList, pharmList, branchList] = await Promise.all([
    db
      .select({ id: hospitals.id, defaultCycle: hospitals.defaultCycle })
      .from(hospitals)
      .where(and(or(eq(hospitals.repId, repId), isNull(hospitals.repId)), eq(hospitals.isActive, true)))
      .all(),
    db
      .select({ id: doctors.id, defaultCycle: doctors.defaultCycle })
      .from(doctors)
      .where(and(or(eq(doctors.repId, repId), isNull(doctors.repId)), eq(doctors.isActive, true)))
      .all(),
    db
      .select({ id: pharmacies.id, defaultCycle: pharmacies.defaultCycle })
      .from(pharmacies)
      .where(and(or(eq(pharmacies.repId, repId), isNull(pharmacies.repId)), eq(pharmacies.isActive, true)))
      .all(),
    db
      .select({ id: distributionBranches.id, defaultCycle: distributionBranches.defaultCycle })
      .from(distributionBranches)
      .where(and(or(eq(distributionBranches.repId, repId), isNull(distributionBranches.repId)), eq(distributionBranches.isActive, true)))
      .all(),
  ]);

  // 3. Fetch Actual Visits Conducted within [startDate, endDate]
  const [hospVisits, docVisits, pharmVisits, bVisits] = await Promise.all([
    db
      .select({ id: hospitalVisits.id, hospitalId: hospitalVisits.hospitalId, date: hospitalVisits.lastVisitDate })
      .from(hospitalVisits)
      .where(and(eq(hospitalVisits.repId, repId), sql`${hospitalVisits.lastVisitDate} BETWEEN ${startDate} AND ${endDate}`))
      .all(),
    db
      .select({ id: doctorVisits.id, doctorId: doctorVisits.doctorId, date: doctorVisits.visitDate })
      .from(doctorVisits)
      .where(and(eq(doctorVisits.repId, repId), sql`${doctorVisits.visitDate} BETWEEN ${startDate} AND ${endDate}`))
      .all(),
    db
      .select({ id: pharmacyVisits.id, pharmacyId: pharmacyVisits.pharmacyId, date: pharmacyVisits.lastVisitDate })
      .from(pharmacyVisits)
      .where(and(eq(pharmacyVisits.repId, repId), sql`${pharmacyVisits.lastVisitDate} BETWEEN ${startDate} AND ${endDate}`))
      .all(),
    db
      .select({ id: branchVisits.id, branchId: branchVisits.branchId, date: branchVisits.lastVisitDate })
      .from(branchVisits)
      .where(and(eq(branchVisits.repId, repId), sql`${branchVisits.lastVisitDate} BETWEEN ${startDate} AND ${endDate}`))
      .all(),
  ]);

  // 4. Fetch Latest BUM-assigned Visit Rates for this MR
  const bumRatesRows = await db
    .select()
    .from(representativeVisitRates)
    .where(eq(representativeVisitRates.repId, repId))
    .orderBy(desc(representativeVisitRates.effectiveFrom))
    .all();

  const latestBumRateMap = new Map<CustomerCategory, (typeof bumRatesRows)[0]>();
  for (const r of bumRatesRows) {
    if (!latestBumRateMap.has(r.customerCategory as CustomerCategory)) {
      latestBumRateMap.set(r.customerCategory as CustomerCategory, r);
    }
  }

  // --- Calculate Coverage for Each Category ---
  // Unique visited entities
  const visitedHospIds = new Set(hospVisits.map((v) => v.hospitalId).filter(Boolean));
  const visitedDocIds = new Set(docVisits.map((v) => v.doctorId).filter(Boolean));
  const visitedPharmIds = new Set(pharmVisits.map((v) => v.pharmacyId).filter(Boolean));
  const visitedBranchIds = new Set(bVisits.map((v) => v.branchId).filter(Boolean));

  const calcCoverageMetrics = (
    category: CustomerCategory,
    labels: { ar: string; en: string },
    listCount: number,
    visitedSet: Set<string>,
  ): CategoryCoverageMetrics => {
    // Distinct visited within the list
    const visitedCount = visitedSet.size;
    const coveragePct = listCount > 0 ? Math.min(100, Math.round((visitedCount / listCount) * 1000) / 10) : 0;
    return {
      category,
      categoryLabel: labels,
      totalInList: listCount,
      visitedEntitiesCount: visitedCount,
      coveragePct,
      color: getCoverageColor(coveragePct),
    };
  };

  const covHosp = calcCoverageMetrics('HOSPITAL', { ar: 'مستشفيات', en: 'Hospitals' }, hospList.length, visitedHospIds);
  const covDoc = calcCoverageMetrics('DOCTOR', { ar: 'أطباء', en: 'Doctors' }, docList.length, visitedDocIds);
  const covPharm = calcCoverageMetrics('PHARMACY', { ar: 'صيدليات', en: 'Pharmacies' }, pharmList.length, visitedPharmIds);
  const covBranch = calcCoverageMetrics('DISTRIBUTION_BRANCH', { ar: 'فروع ومخازن التوزيع', en: 'Distribution Branches' }, branchList.length, visitedBranchIds);

  const totalListAll = hospList.length + docList.length + pharmList.length + branchList.length;
  const totalVisitedAll = covHosp.visitedEntitiesCount + covDoc.visitedEntitiesCount + covPharm.visitedEntitiesCount + covBranch.visitedEntitiesCount;
  const overallCoveragePct = totalListAll > 0 ? Math.min(100, Math.round((totalVisitedAll / totalListAll) * 1000) / 10) : 0;

  // --- Calculate Average Visits Benchmarks ---
  // Rate period multiplier:
  // daily = 1, weekly = workingDaysPerWeek (default 6), monthly = workingDaysPerMonth (default 26)
  const getBumTarget = (cat: CustomerCategory): number => {
    const rate = latestBumRateMap.get(cat);
    if (!rate) return 0;
    if (period === 'daily') return rate.dailyRate;
    if (period === 'weekly') return rate.dailyRate * (rate.workingDaysPerWeek || 6);
    if (period === 'monthly') return rate.dailyRate * (rate.workingDaysPerMonth || 26);
    return rate.dailyRate;
  };

  // Benchmark B: Rate calculated from My Lists visit cycles (sum of 1 / defaultCycle)
  const getListTarget = (items: Array<{ defaultCycle: number | null }>): number => {
    if (items.length === 0) return 0;
    // Calculate required daily visits from cycles
    const dailyRequired = items.reduce((sum, item) => {
      const cycle = item.defaultCycle && item.defaultCycle > 0 ? item.defaultCycle : 7;
      return sum + 1 / cycle;
    }, 0);

    let calculated = dailyRequired;
    if (period === 'weekly') calculated = dailyRequired * 6;
    if (period === 'monthly') calculated = dailyRequired * 26;

    return Math.round(calculated * 10) / 10;
  };

  const listHospRate = getListTarget(hospList);
  const listDocRate = getListTarget(docList);
  const listPharmRate = getListTarget(pharmList);
  const listBranchRate = getListTarget(branchList);

  const calcAverageMetrics = (
    category: CustomerCategory,
    labels: { ar: string; en: string },
    actualVisits: number,
    bumRate: number,
    listRate: number,
  ): CategoryAverageMetrics => {
    const bumComp = getAverageComparison(actualVisits, Math.round(bumRate));
    const listComp = getAverageComparison(actualVisits, Math.round(listRate));
    return {
      category,
      categoryLabel: labels,
      actualVisits,
      bumRate,
      listRate,
      comparisonVsBum: bumComp.comparison,
      colorVsBum: bumComp.color,
      comparisonVsList: listComp.comparison,
      colorVsList: listComp.color,
    };
  };

  const avgHosp = calcAverageMetrics('HOSPITAL', { ar: 'مستشفيات', en: 'Hospitals' }, hospVisits.length, getBumTarget('HOSPITAL'), listHospRate);
  const avgDoc = calcAverageMetrics('DOCTOR', { ar: 'أطباء', en: 'Doctors' }, docVisits.length, getBumTarget('DOCTOR'), listDocRate);
  const avgPharm = calcAverageMetrics('PHARMACY', { ar: 'صيدليات', en: 'Pharmacies' }, pharmVisits.length, getBumTarget('PHARMACY'), listPharmRate);
  const avgBranch = calcAverageMetrics('DISTRIBUTION_BRANCH', { ar: 'فروع ومخازن التوزيع', en: 'Distribution Branches' }, bVisits.length, getBumTarget('DISTRIBUTION_BRANCH'), listBranchRate);

  const totalActual = hospVisits.length + docVisits.length + pharmVisits.length + bVisits.length;
  const totalBum = avgHosp.bumRate + avgDoc.bumRate + avgPharm.bumRate + avgBranch.bumRate;
  const totalList = Math.round((listHospRate + listDocRate + listPharmRate + listBranchRate) * 10) / 10;

  const overallBumComp = getAverageComparison(totalActual, Math.round(totalBum));
  const overallListComp = getAverageComparison(totalActual, Math.round(totalList));

  return {
    repId,
    repName,
    repArea,
    date: targetDate,
    period,
    startDate,
    endDate,
    coverage: {
      hospital: covHosp,
      doctor: covDoc,
      pharmacy: covPharm,
      branch: covBranch,
      overall: {
        totalInList: totalListAll,
        visitedEntitiesCount: totalVisitedAll,
        coveragePct: overallCoveragePct,
        color: getCoverageColor(overallCoveragePct),
      },
    },
    averageVisits: {
      hospital: avgHosp,
      doctor: avgDoc,
      pharmacy: avgPharm,
      branch: avgBranch,
      overall: {
        actualVisits: totalActual,
        totalBumRate: totalBum,
        totalListRate: totalList,
        comparisonVsBum: overallBumComp.comparison,
        colorVsBum: overallBumComp.color,
        comparisonVsList: overallListComp.comparison,
        colorVsList: overallListComp.color,
      },
    },
  };
}
