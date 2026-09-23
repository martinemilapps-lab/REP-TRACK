import { NextRequest } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { weeklyPlanExportSchema } from '@/lib/exportSchemas';
import { buildWeeklyPlansExport } from '@/lib/services/exportService';
import { workbookResponse } from '@/lib/exportWorkbook';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const input = weeklyPlanExportSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const prefix = input.team === 'true' ? 'خطط_الفريق' : 'خطتي_الأسبوعية';
    const period = input.weekStart ?? new Date().toISOString().slice(0, 10);

    return workbookResponse(
      await buildWeeklyPlansExport(session, input),
      `REP_TRACK_${prefix}_${period}`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
