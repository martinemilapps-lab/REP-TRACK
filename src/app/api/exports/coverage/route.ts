import { NextRequest } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { buildCoverageExport } from '@/lib/services/exportService';
import { workbookResponse } from '@/lib/exportWorkbook';
import { handleApiError } from '@/lib/errors';
import { coverageExportSchema } from '@/lib/exportSchemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const input = coverageExportSchema.parse(params);

    const period = input.period || 'monthly';
    const targetDate = input.date || input.endDate || new Date().toISOString().slice(0, 10);
    const targetRep = input.repId ? `Rep_${input.repId}` : (session.role === 'REPRESENTATIVE' ? session.username : 'Team');

    const bytes = await buildCoverageExport(session, input);
    const filename = `تقرير_تغطية_وتكرار_الزيارات_${targetRep}_${period}_${targetDate}`;

    return workbookResponse(bytes, filename);
  } catch (error) {
    return handleApiError(error);
  }
}
