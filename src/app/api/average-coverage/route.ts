import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { handleApiError, AppError } from '@/lib/errors';
import { resolveWritableRepId } from '@/lib/repAccessPolicy';
import { hierarchyService } from '@/lib/services/hierarchyService';
import { calculateAverageAndCoverage } from '@/lib/services/averageCoverageService';
import { db, representatives } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const url = new URL(request.url);

    const targetDate = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const periodParam = url.searchParams.get('period') || 'daily';
    const period = periodParam === 'weekly' || periodParam === 'monthly' ? periodParam : 'daily';
    const reqRepId = url.searchParams.get('repId');
    const returnSummary = url.searchParams.get('summary') === 'true';

    // 1. If Medical Representative
    if (session.role === 'REPRESENTATIVE' || session.positionCode === 'MR') {
      const repId = resolveWritableRepId(session);
      const report = await calculateAverageAndCoverage(repId, targetDate, period);

      return NextResponse.json(
        {
          success: true,
          isManager: false,
          report,
          scopedReps: [{ id: repId, name: session.name, area: session.primarySalesAssignment?.territoryName || '' }],
        },
        { headers: { 'Cache-Control': 'private, no-store' } },
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

    const report = activeRepId
      ? await calculateAverageAndCoverage(activeRepId, targetDate, period)
      : null;

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
    }> | null = null;

    if (returnSummary && scopedReps.length > 0) {
      teamSummary = await Promise.all(
        scopedReps.map(async (r) => {
          try {
            const repReport = await calculateAverageAndCoverage(r.id, targetDate, period);
            return {
              repId: r.id,
              repName: r.name,
              repArea: r.area,
              coveragePct: repReport.coverage.overall.coveragePct,
              coverageColor: repReport.coverage.overall.color,
              actualVisits: repReport.averageVisits.overall.actualVisits,
              bumRate: repReport.averageVisits.overall.totalBumRate,
              averageColorVsBum: repReport.averageVisits.overall.colorVsBum,
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
            };
          }
        }),
      );
    }

    return NextResponse.json(
      {
        success: true,
        isManager: true,
        report,
        scopedReps,
        teamSummary,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
