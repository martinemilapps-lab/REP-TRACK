import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth'; import { handleApiError } from '@/lib/errors';
import { passwordOperationSchema } from '@/lib/adminSchemas'; import { assertAdminMutationRequest, noStoreHeaders } from '@/lib/adminSecurity';
import { issueAdminTemporaryPassword } from '@/lib/services/adminService';
type Context = { params: Promise<{ id: string }> };
export async function POST(request: NextRequest, context: Context) { try { const admin = await requireAdmin(); assertAdminMutationRequest(request, admin.id, 'temporary-password'); const body = passwordOperationSchema.parse(await request.json()); return NextResponse.json({ success: true, credential: await issueAdminTemporaryPassword(admin, (await context.params).id, body.forceChange) }, { headers: noStoreHeaders() }); } catch (error) { return handleApiError(error); } }
