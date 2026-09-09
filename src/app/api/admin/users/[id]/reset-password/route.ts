import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth'; import { handleApiError } from '@/lib/errors';
import { assertAdminMutationRequest, noStoreHeaders } from '@/lib/adminSecurity'; import { issueAdminTemporaryPassword, ADMIN_ACTIONS } from '@/lib/services/adminService';
type Context = { params: Promise<{ id: string }> };
export async function POST(request: NextRequest, context: Context) { try { const admin = await requireAdmin(); assertAdminMutationRequest(request, admin.id, 'reset-password'); return NextResponse.json({ success: true, credential: await issueAdminTemporaryPassword(admin, (await context.params).id, true, ADMIN_ACTIONS.RESET_PASSWORD) }, { headers: noStoreHeaders() }); } catch (error) { return handleApiError(error); } }
