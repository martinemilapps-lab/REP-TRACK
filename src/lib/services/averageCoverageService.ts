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
export type FrequencyColor = 'GREEN' | 'RED' | 'YELLOW';

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

export interface EntityFrequencyItem {
  id: string;
  name: string;
  area: string;
  category: CustomerCategory;
  categoryLabel?: { ar: string; en: string };
  cycleDays: number;
  expectedVisits: number;
  actualVisits: number;
  // Frequency metrics
  color: FrequencyColor;
  status: 'SAME' | 'OVER' | 'LESS';
  frequencyColor: FrequencyColor;
  frequencyStatus: 'SAME' | 'OVER' | 'LESS';
  // Coverage metrics
  isCovered: boolean;
  coveragePct: number;
  coverageColor: CoverageColor;
  coverageStatus: 'FULL' | 'PARTIAL' | 'UNCOVERED';
  // Average metrics
  averageDailyRate: number;
  lastVisitDate?: string | null;
  extraInfo?: string | null;
}

export type CustomerReportItem = EntityFrequencyItem;

export interface CategoryFrequencySummary {
  category: CustomerCategory;
  categoryLabel: { ar: string; en: string };
  totalEntities: number;
  visitedEntitiesCount: number;
  coveragePct: number;
  sameCount: number; // GREEN: actual === expected
  overCount: number; // RED: actual > expected
  lessCount: number; // YELLOW: actual < expected
  unvisitedCount: number;
  items: EntityFrequencyItem[];
}

export interface VisitsFrequencyReport {
  hospital: CategoryFrequencySummary;
  doctor: CategoryFrequencySummary;
  pharmacy: CategoryFrequencySummary;
  branch: CategoryFrequencySummary;
  overall: {
    totalEntities: number;
    totalVisited: number;
    overallCoveragePct: number;
    sameCount: number;
    overCount: number;
    lessCount: number;
    unvisitedCount: number;
    samePct: number;
    overPct: number;
    lessPct: number;
    unvisitedPct: number;
  };
  allItems?: EntityFrequencyItem[];
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
  visitsFrequency: VisitsFrequencyReport;
}

/**
 * 1- Coverage Color rule (Edit 6):
 * Green: 95% - 100%
 * Yellow: 90% - 94.9% (95% - 90%)
 * Red: Less than 90%
 */
export function getCoverageColor(percentage: number): CoverageColor {
  if (percentage >= 95) return 'GREEN';
  if (percentage >= 90) return 'YELLOW';
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
 * Visits Frequency Color rule:
 * Green: number visited with same frequency (actual === expected)
 * Red: overvisited (actual > expected)
 * Yellow: less visited (actual < expected)
 */
export function getFrequencyComparison(
  actual: number,
  expected: number,
): { color: FrequencyColor; status: 'SAME' | 'OVER' | 'LESS' } {
  if (actual === expected) {
    return { color: 'GREEN', status: 'SAME' };
  } else if (actual > expected) {
    return { color: 'RED', status: 'OVER' };
  } else {
    return { color: 'YELLOW', status: 'LESS' };
  }
}

/**
 * Calculates expected visits in the period based on cycle days from "My Lists".
 * In daily: 1 visit target
 * In weekly (7 days): round(7 / cycle) >= 1
 * In monthly (periodDays ~28-31): round(periodDays / cycle) >= 1
 */
export function calculateExpectedVisits(
  cycleDays: number | null | undefined,
  periodDays: number,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly',
): number {
  const cycle = Math.max(1, cycleDays && cycleDays > 0 ? cycleDays : 7);
  if (period === 'daily' || periodDays <= 1) {
    return 1;
  }
  if (period === 'weekly') {
    return Math.max(1, Math.round(7 / cycle));
  }
  return Math.max(1, Math.round(periodDays / cycle));
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
      .select({
        id: hospitals.id,
        name: hospitals.name,
        area: hospitals.area,
        type: hospitals.type,
        defaultCycle: hospitals.defaultCycle,
      })
      .from(hospitals)
      .where(and(or(eq(hospitals.repId, repId), isNull(hospitals.repId)), eq(hospitals.isActive, true)))
      .all(),
    db
      .select({
        id: doctors.id,
        name: doctors.name,
        area: doctors.area,
        specialty: doctors.specialty,
        classification: doctors.classification,
        defaultCycle: doctors.defaultCycle,
      })
      .from(doctors)
      .where(and(or(eq(doctors.repId, repId), isNull(doctors.repId)), eq(doctors.isActive, true)))
      .all(),
    db
      .select({
        id: pharmacies.id,
        name: pharmacies.name,
        area: pharmacies.area,
        classification: pharmacies.classification,
        defaultCycle: pharmacies.defaultCycle,
      })
      .from(pharmacies)
      .where(and(or(eq(pharmacies.repId, repId), isNull(pharmacies.repId)), eq(pharmacies.isActive, true)))
      .all(),
    db
      .select({
        id: distributionBranches.id,
        name: distributionBranches.name,
        coverageArea: distributionBranches.coverageArea,
        defaultCycle: distributionBranches.defaultCycle,
      })
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

  // --- Calculate Visits Frequency for Each Customer in My Lists ---
  // Maps of visits count and latest visit date per entity ID
  const mapVisits = (
    visits: Array<{ id: string; hospitalId?: string | null; doctorId?: string | null; pharmacyId?: string | null; branchId?: string | null; date?: string | null }>,
    getId: (v: any) => string | null | undefined,
  ) => {
    const map = new Map<string, { count: number; lastDate: string | null }>();
    for (const v of visits) {
      const eid = getId(v);
      if (!eid) continue;
      const curr = map.get(eid) || { count: 0, lastDate: null };
      curr.count++;
      if (!curr.lastDate || (v.date && v.date > curr.lastDate)) {
        curr.lastDate = v.date || null;
      }
      map.set(eid, curr);
    }
    return map;
  };

  const hospVisitMap = mapVisits(hospVisits, (v) => v.hospitalId);
  const docVisitMap = mapVisits(docVisits, (v) => v.doctorId);
  const pharmVisitMap = mapVisits(pharmVisits, (v) => v.pharmacyId);
  const branchVisitMap = mapVisits(bVisits, (v) => v.branchId);

  // Period length in days
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const periodDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1);

  const buildFrequencySummary = (
    category: CustomerCategory,
    labels: { ar: string; en: string },
    entities: Array<{
      id: string;
      name: string;
      area?: string | null;
      coverageArea?: string | null;
      defaultCycle: number | null;
      type?: string | null;
      specialty?: string | null;
      classification?: string | null;
    }>,
    visitMap: Map<string, { count: number; lastDate: string | null }>,
  ): CategoryFrequencySummary => {
    let sameCount = 0;
    let overCount = 0;
    let lessCount = 0;
    let visitedEntitiesCount = 0;

    const items: EntityFrequencyItem[] = entities.map((ent) => {
      const cycleDays = ent.defaultCycle && ent.defaultCycle > 0 ? ent.defaultCycle : 7;
      const expected = calculateExpectedVisits(cycleDays, periodDays, period);
      const visitInfo = visitMap.get(ent.id) || { count: 0, lastDate: null };
      const actual = visitInfo.count;
      const { color, status } = getFrequencyComparison(actual, expected);

      if (color === 'GREEN') sameCount++;
      else if (color === 'RED') overCount++;
      else lessCount++;

      const isCovered = actual > 0;
      if (isCovered) visitedEntitiesCount++;

      // Coverage percentage and status
      const coveragePct = expected > 0
        ? Math.min(100, Math.round((actual / expected) * 100))
        : (isCovered ? 100 : 0);
      const coverageColor: CoverageColor = getCoverageColor(coveragePct);
      const coverageStatus: 'FULL' | 'PARTIAL' | 'UNCOVERED' =
        coveragePct >= 100 ? 'FULL' : (coveragePct > 0 ? 'PARTIAL' : 'UNCOVERED');

      // Average daily rate
      const averageDailyRate = Math.round((actual / periodDays) * 100) / 100;

      const extraInfo = ent.specialty || ent.type || (ent.classification ? `Class ${ent.classification}` : null);

      return {
        id: ent.id,
        name: ent.name,
        area: ent.area || ent.coverageArea || '',
        category,
        categoryLabel: labels,
        cycleDays,
        expectedVisits: expected,
        actualVisits: actual,
        // Frequency
        color,
        status,
        frequencyColor: color,
        frequencyStatus: status,
        // Coverage
        isCovered,
        coveragePct,
        coverageColor,
        coverageStatus,
        // Average
        averageDailyRate,
        lastVisitDate: visitInfo.lastDate || null,
        extraInfo,
      };
    });

    const categoryCoveragePct = entities.length > 0
      ? Math.min(100, Math.round((visitedEntitiesCount / entities.length) * 1000) / 10)
      : 0;

    return {
      category,
      categoryLabel: labels,
      totalEntities: entities.length,
      visitedEntitiesCount,
      coveragePct: categoryCoveragePct,
      sameCount,
      overCount,
      lessCount,
      unvisitedCount: entities.length - visitedEntitiesCount,
      items,
    };
  };

  const freqHosp = buildFrequencySummary('HOSPITAL', { ar: 'مستشفيات', en: 'Hospitals' }, hospList, hospVisitMap);
  const freqDoc = buildFrequencySummary('DOCTOR', { ar: 'أطباء', en: 'Doctors' }, docList, docVisitMap);
  const freqPharm = buildFrequencySummary('PHARMACY', { ar: 'صيدليات', en: 'Pharmacies' }, pharmList, pharmVisitMap);
  const freqBranch = buildFrequencySummary('DISTRIBUTION_BRANCH', { ar: 'فروع ومخازن التوزيع', en: 'Distribution Branches' }, branchList, branchVisitMap);

  const freqTotalEntities = freqHosp.totalEntities + freqDoc.totalEntities + freqPharm.totalEntities + freqBranch.totalEntities;
  const freqTotalVisited = freqHosp.visitedEntitiesCount + freqDoc.visitedEntitiesCount + freqPharm.visitedEntitiesCount + freqBranch.visitedEntitiesCount;
  const freqOverallCoveragePct = freqTotalEntities > 0
    ? Math.min(100, Math.round((freqTotalVisited / freqTotalEntities) * 1000) / 10)
    : 0;
  const freqTotalSame = freqHosp.sameCount + freqDoc.sameCount + freqPharm.sameCount + freqBranch.sameCount;
  const freqTotalOver = freqHosp.overCount + freqDoc.overCount + freqPharm.overCount + freqBranch.overCount;
  const freqTotalLess = freqHosp.lessCount + freqDoc.lessCount + freqPharm.lessCount + freqBranch.lessCount;
  const freqTotalUnvisited = freqTotalEntities - freqTotalVisited;

  const samePct = freqTotalEntities > 0 ? Math.round((freqTotalSame / freqTotalEntities) * 1000) / 10 : 0;
  const overPct = freqTotalEntities > 0 ? Math.round((freqTotalOver / freqTotalEntities) * 1000) / 10 : 0;
  const lessPct = freqTotalEntities > 0 ? Math.round((freqTotalLess / freqTotalEntities) * 1000) / 10 : 0;
  const unvisitedPct = freqTotalEntities > 0 ? Math.round((freqTotalUnvisited / freqTotalEntities) * 1000) / 10 : 0;

  const allItems: EntityFrequencyItem[] = [
    ...freqHosp.items,
    ...freqDoc.items,
    ...freqPharm.items,
    ...freqBranch.items,
  ];

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
    visitsFrequency: {
      hospital: freqHosp,
      doctor: freqDoc,
      pharmacy: freqPharm,
      branch: freqBranch,
      overall: {
        totalEntities: freqTotalEntities,
        totalVisited: freqTotalVisited,
        overallCoveragePct: freqOverallCoveragePct,
        sameCount: freqTotalSame,
        overCount: freqTotalOver,
        lessCount: freqTotalLess,
        unvisitedCount: freqTotalUnvisited,
        samePct,
        overPct,
        lessPct,
        unvisitedPct,
      },
      allItems,
    },
  };
}
