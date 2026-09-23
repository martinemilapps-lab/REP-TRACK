import { NextRequest } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { listExportSchema } from '@/lib/exportSchemas';
import { buildListsExport } from '@/lib/services/exportService';
import { workbookResponse } from '@/lib/exportWorkbook';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const input = listExportSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const prefix = session.role === 'REPRESENTATIVE' ? 'قوائمي' : 'قوائم_الفريق';
    const dateStr = new Date().toISOString().slice(0, 10);

    return workbookResponse(
      await buildListsExport(session, input),
      `REP_TRACK_${prefix}_${dateStr}`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
