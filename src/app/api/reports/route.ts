import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { db, representatives } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getVisibleReports } from '@/lib/services/reportService';
import { getMasterListsForRep } from '@/lib/services/masterListService';
import { handleApiError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterRepName = searchParams.get('rep');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 1000;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0;
    const scopeMode = searchParams.get('scopeMode') === 'DIRECT_REPORTS' ? 'DIRECT_REPORTS' : 'ALL_DESCENDANTS';

    const session = await requireAuthenticatedUser();

    let targetRepId: string | null = null;

    if (session?.role === 'REPRESENTATIVE') {
      // Force repId from authenticated session
      targetRepId = session.repId || null;
    } else if (filterRepName && filterRepName.trim()) {
      // Manager filtering by representative name
      const repRecord = await db
        .select()
        .from(representatives)
        .where(eq(representatives.name, filterRepName.trim()))
        .get();
      if (repRecord) {
        targetRepId = repRecord.id;
      } else {
        return NextResponse.json({ message: 'Representative not found' }, { status: 404 });
      }
    }

    const reportsData = await getVisibleReports(session, {
      requestedRepId: targetRepId,
      limit,
      offset,
      scopeMode,
    });

    const allReps = reportsData.reps;
    const masterLists = targetRepId ? await getMasterListsForRep(targetRepId) : null;

    return NextResponse.json({
      reps: allReps,
      hospitals: reportsData.hospitals,
      pharmacies: reportsData.pharmacies,
      doctors: reportsData.doctors,
      branches: reportsData.branches,
      availabilities: reportsData.availabilities,
      events: reportsData.events,
      trainings: reportsData.trainings,
      specialTasks: reportsData.specialTasks,
      managerActivities: reportsData.managerActivities,
      masterLists,
      totalVisits: reportsData.totalVisits,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
