import { NextRequest } from 'next/server';
import { requireManager } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { complianceExportSchema } from '@/lib/exportSchemas';
import { buildComplianceExport } from '@/lib/services/exportService';
import { workbookResponse } from '@/lib/exportWorkbook';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await requireManager();
    const input = complianceExportSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const period = input.date ?? input.weekStart ?? 'selected';
    const typeLabel = input.type === 'DAILY_REPORT' ? 'التقارير_اليومية' : 'الخطط_الأسبوعية';

    return workbookResponse(
      await buildComplianceExport(session, input),
      `REP_TRACK_الالتزام_${typeLabel}_${period}`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
