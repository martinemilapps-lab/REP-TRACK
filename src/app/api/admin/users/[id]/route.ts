import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { getAdminUserDetail, setAdminUserActive } from '@/lib/services/adminService';
import { assertAdminMutationRequest, noStoreHeaders } from '@/lib/adminSecurity';
import { userStatusSchema } from '@/lib/adminSchemas';

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, context: Context) {
  try { const admin = await requireAdmin(); return NextResponse.json({ success: true, detail: await getAdminUserDetail(admin, (await context.params).id) }, { headers: noStoreHeaders() }); }
  catch (error) { return handleApiError(error); }
}
export async function PATCH(request: NextRequest, context: Context) {
  try { const admin = await requireAdmin(); assertAdminMutationRequest(request, admin.id, 'status'); const body = userStatusSchema.parse(await request.json()); return NextResponse.json(await setAdminUserActive(admin, (await context.params).id, body.active), { headers: noStoreHeaders() }); }
  catch (error) { return handleApiError(error); }
}
