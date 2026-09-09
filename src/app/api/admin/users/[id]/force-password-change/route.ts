import { NextRequest, NextResponse } from 'next/server'; import { requireAdmin } from '@/lib/auth'; import { handleApiError } from '@/lib/errors';
import { assertAdminMutationRequest, noStoreHeaders } from '@/lib/adminSecurity'; import { forceAdminPasswordChange } from '@/lib/services/adminService';
type Context = { params: Promise<{ id: string }> };
export async function POST(request: NextRequest, context: Context) { try { const admin = await requireAdmin(); assertAdminMutationRequest(request, admin.id, 'force-change'); return NextResponse.json(await forceAdminPasswordChange(admin, (await context.params).id), { headers: noStoreHeaders() }); } catch (error) { return handleApiError(error); } }
