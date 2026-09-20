import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { listAdminUsers } from '@/lib/services/adminService';
import { createAdminUserAdmin } from '@/lib/services/adminCompanyService';
import { adminUserCreateSchema } from '@/lib/adminSchemas';
import { assertAdminMutationRequest, noStoreHeaders } from '@/lib/adminSecurity';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const result = await listAdminUsers(await requireAdmin(), { search: params.get('search') ?? undefined, status: params.get('status') ?? undefined, page: Number(params.get('page') || 1), pageSize: Number(params.get('pageSize') || 20) });
    return NextResponse.json({ success: true, ...result }, { headers: noStoreHeaders() });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    assertAdminMutationRequest(request, admin.id, 'user-create');
    const input = adminUserCreateSchema.parse(await request.json());
    return NextResponse.json({ success: true, credential: await createAdminUserAdmin(admin, input) }, { status: 201, headers: noStoreHeaders() });
  } catch (error) { return handleApiError(error); }
}
