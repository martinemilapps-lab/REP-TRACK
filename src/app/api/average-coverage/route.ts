import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { handleApiError, AppError } from '@/lib/errors';
import { resolveWritableRepId } from '@/lib/repAccessPolicy';
import { hierarchyService } from '@/lib/services/hierarchyService';
import { calculateAverageAndCoverage } from '@/lib/services/averageCoverageService';
import { db, representatives } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CacheEntry {
  timestamp: number;
  data: any;
}
const avgCoverageCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

function getCached(key: string) {
  const entry = avgCoverageCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  if (avgCoverageCache.size > 300) {
    avgCoverageCache.clear();
  }
  avgCoverageCache.set(key, { timestamp: Date.now(), data });
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const url = new URL(request.url);

    const targetDate = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const periodParam = url.searchParams.get('period') || 'daily';
    const period = periodParam === 'weekly' || periodParam === 'monthly' ? periodParam : 'daily';
    const reqRepId = url.searchParams.get('repId');
    const returnSummary = url.searchParams.get('summary') === 'true';

    const responseCacheKey = `full-get:${session.id}:${targetDate}:${period}:${reqRepId || 'default'}:${returnSummary}`;
    const cachedResponse = getCached(responseCacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
    }

    // 1. If Medical Representative
    if (session.role === 'REPRESENTATIVE' || session.positionCode === 'MR') {
      const repId = resolveWritableRepId(session);
      const repCacheKey = `rep-report:${repId}:${targetDate}:${period}`;
      let report = getCached(repCacheKey);
      if (!report) {
        report = await calculateAverageAndCoverage(repId, targetDate, period);
        setCache(repCacheKey, report);
      }

      const responsePayload = {
        success: true,
        isManager: false,
        report,
        scopedReps: [{ id: repId, name: session.name, area: session.primarySalesAssignment?.territoryName || '' }],
      };
      setCache(responseCacheKey, responsePayload);

      return NextResponse.json(
        responsePayload,
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        },
      );
    }

    // 2. If Manager / SMD / Admin
    let scopedReps: Array<{ id: string; name: string; area: string }> = [];
    try {
      scopedReps = await hierarchyService.getScopedRepresentatives(session);
    } catch (err) {
      console.warn('Hierarchy resolution warning in average-coverage:', err);
    }

    // Admin fallback if no direct descendants
    if (session.systemRole === 'ADMIN' && scopedReps.length === 0) {
      scopedReps = await db
        .select({ id: representatives.id, name: representatives.name, area: representatives.area })
        .from(representatives)
        .where(eq(representatives.isActive, true))
        .all();
    }

    // Determine target rep to inspect
    let activeRepId = reqRepId || (scopedReps.length > 0 ? scopedReps[0].id : null);

    if (activeRepId) {
      // Assert visibility if not system admin
      if (session.systemRole !== 'ADMIN') {
        await hierarchyService.assertRepVisible(session, activeRepId);
      }
    }

    let report: any = null;
    if (activeRepId) {
      const repCacheKey = `rep-report:${activeRepId}:${targetDate}:${period}`;
      report = getCached(repCacheKey);
      if (!report) {
        report = await calculateAverageAndCoverage(activeRepId, targetDate, period);
        setCache(repCacheKey, report);
      }
    }

    // Optional: Return summary of all scoped reps for team matrix
    let teamSummary: Array<{
      repId: string;
      repName: string;
      repArea: string;
      coveragePct: number;
      coverageColor: string;
      actualVisits: number;
      bumRate: number;
      averageColorVsBum: string;
      frequencyTotal: number;
      frequencySame: number;
      frequencyOver: number;
      frequencyLess: number;
    }> | null = null;

    if (returnSummary && scopedReps.length > 0) {
      teamSummary = await Promise.all(
        scopedReps.map(async (r) => {
          try {
            const repCacheKey = `rep-report:${r.id}:${targetDate}:${period}`;
            let repReport = getCached(repCacheKey);
            if (!repReport) {
              repReport = await calculateAverageAndCoverage(r.id, targetDate, period);
              setCache(repCacheKey, repReport);
            }
            return {
              repId: r.id,
              repName: r.name,
              repArea: r.area,
              coveragePct: repReport.coverage.overall.coveragePct,
              coverageColor: repReport.coverage.overall.color,
              actualVisits: repReport.averageVisits.overall.actualVisits,
              bumRate: repReport.averageVisits.overall.totalBumRate,
              averageColorVsBum: repReport.averageVisits.overall.colorVsBum,
              frequencyTotal: repReport.visitsFrequency.overall.totalEntities,
              frequencySame: repReport.visitsFrequency.overall.sameCount,
              frequencyOver: repReport.visitsFrequency.overall.overCount,
              frequencyLess: repReport.visitsFrequency.overall.lessCount,
            };
          } catch {
            return {
              repId: r.id,
              repName: r.name,
              repArea: r.area,
              coveragePct: 0,
              coverageColor: 'RED',
              actualVisits: 0,
              bumRate: 0,
              averageColorVsBum: 'RED',
              frequencyTotal: 0,
              frequencySame: 0,
              frequencyOver: 0,
              frequencyLess: 0,
            };
          }
        }),
      );
    }

    const responsePayload = {
      success: true,
      isManager: true,
      report,
      scopedReps,
      teamSummary,
    };
    setCache(responseCacheKey, responsePayload);

    return NextResponse.json(
      responsePayload,
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/average-coverage
 * Allows MR to explicitly submit / send their Visits Frequency & Coverage Report
 * to all their assigned managers in the organizational hierarchy up to SMD.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const body = await request.json().catch(() => ({}));
    const targetDate = body.date || new Date().toISOString().slice(0, 10);
    const period = body.period || 'monthly';

    const repId = resolveWritableRepId(session);
    const report = await calculateAverageAndCoverage(repId, targetDate, period);

    // Invalidate average coverage cache
    avgCoverageCache.clear();

    // Resolve all hierarchical ancestors (DM -> AM -> BUM -> SMD)
    let ancestorIds: string[] = [];
    try {
      ancestorIds = await hierarchyService.getAncestorIds(session);
    } catch (err) {
      console.warn('Could not resolve ancestor IDs:', err);
    }

    const timestamp = new Date().toISOString();

    return NextResponse.json({
      success: true,
      submittedAt: timestamp,
      repId,
      repName: report.repName,
      period,
      targetDate,
      ancestorsNotified: ancestorIds.length,
      visitsFrequencySummary: report.visitsFrequency.overall,
      message: 'Visits Frequency Report successfully sent to all assigned managers up to SMD',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
