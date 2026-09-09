import { requireManager } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { buildReportsExport } from '@/lib/services/exportService';
import { workbookResponse } from '@/lib/exportWorkbook';

/** Backward-compatible URL retained for existing links; now hierarchy scoped. */
export async function GET() {
  try {
    const session = await requireManager();
    const bytes = await buildReportsExport(session, { scopeMode: 'ALL_DESCENDANTS', type: 'all', owner: 'team' });
    return workbookResponse(bytes, `REP_TRACK_Team_Reports_${new Date().toISOString().slice(0, 10)}`);
  } catch (error) {
    return handleApiError(error);
  }
}
