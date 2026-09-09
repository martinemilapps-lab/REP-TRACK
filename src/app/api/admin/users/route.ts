import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { listAdminUsers } from '@/lib/services/adminService';
import { noStoreHeaders } from '@/lib/adminSecurity';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const result = await listAdminUsers(await requireAdmin(), { search: params.get('search') ?? undefined, status: params.get('status') ?? undefined, page: Number(params.get('page') || 1), pageSize: Number(params.get('pageSize') || 20) });
    return NextResponse.json({ success: true, ...result }, { headers: noStoreHeaders() });
  } catch (error) { return handleApiError(error); }
}
