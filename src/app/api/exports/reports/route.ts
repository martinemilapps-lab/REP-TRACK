import { NextRequest } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { reportExportSchema } from '@/lib/exportSchemas';
import { buildReportsExport } from '@/lib/services/exportService';
import { workbookResponse } from '@/lib/exportWorkbook';
export async function GET(request: NextRequest) { try { const session=await requireAuthenticatedUser(); const input=reportExportSchema.parse(Object.fromEntries(request.nextUrl.searchParams)); const period=input.startDate?`${input.startDate}${input.endDate&&input.endDate!==input.startDate?`_to_${input.endDate}`:''}`:new Date().toISOString().slice(0,10); return workbookResponse(await buildReportsExport(session,input),`REP_TRACK_${session.role==='REPRESENTATIVE'?'My':'Team'}_Reports_${period}`); } catch(error){return handleApiError(error);} }
