import { NextRequest } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { reportExportSchema } from '@/lib/exportSchemas';
import { buildReportsExport } from '@/lib/services/exportService';
import { workbookResponse } from '@/lib/exportWorkbook';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const input = reportExportSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const period = input.startDate
      ? `${input.startDate}${input.endDate && input.endDate !== input.startDate ? `_إلى_${input.endDate}` : ''}`
      : new Date().toISOString().slice(0, 10);
    const prefix = session.role === 'REPRESENTATIVE' ? 'تقاريري' : 'تقارير_الفريق';
    const typeLabel = input.type === 'all' ? 'الشاملة' : input.type;

    return workbookResponse(
      await buildReportsExport(session, input),
      `REP_TRACK_${prefix}_${typeLabel}_${period}`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
