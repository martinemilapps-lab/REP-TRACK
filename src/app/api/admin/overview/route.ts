import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { getAdminOverview } from '@/lib/services/adminService';
import { noStoreHeaders } from '@/lib/adminSecurity';

export async function GET() {
  try { return NextResponse.json({ success: true, overview: await getAdminOverview(await requireAdmin()) }, { headers: noStoreHeaders() }); }
  catch (error) { return handleApiError(error); }
}
