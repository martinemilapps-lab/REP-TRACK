import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { listAllTables, browseTable, deleteTableRows, deleteUserData, deleteAllExceptUser, nuclearReset } from '@/lib/services/adminDatabaseService';
import { noStoreHeaders } from '@/lib/adminSecurity';
import { assertAdminMutationRequest } from '@/lib/adminSecurity';

/**
 * GET /api/admin/database — List all tables or browse a specific table
 * Query params: ?action=tables | ?action=browse&table=xxx&page=1&pageSize=25
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const action = request.nextUrl.searchParams.get('action') || 'tables';
    if (action === 'tables') {
      const tables = await listAllTables(admin);
      return NextResponse.json({ success: true, tables }, { headers: noStoreHeaders() });
    }
    if (action === 'browse') {
      const tableName = request.nextUrl.searchParams.get('table') || '';
      const page = Number(request.nextUrl.searchParams.get('page') || '1');
      const pageSize = Number(request.nextUrl.searchParams.get('pageSize') || '25');
      const result = await browseTable(admin, tableName, page, pageSize);
      return NextResponse.json({ success: true, ...result }, { headers: noStoreHeaders() });
    }
    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/database — Execute database control operations
 * Body: { action: 'delete_rows' | 'delete_user_data' | 'delete_all_except' | 'nuclear_reset', ... }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    assertAdminMutationRequest(request, admin.id, 'database_control');
    const body = await request.json();
    const { action } = body;

    if (action === 'delete_rows') {
      const { table, rowIds } = body;
      const result = await deleteTableRows(admin, table, rowIds || []);
      return NextResponse.json({ success: true, ...result }, { headers: noStoreHeaders() });
    }

    if (action === 'delete_user_data') {
      const { userId } = body;
      if (!userId) return NextResponse.json({ success: false, message: 'userId required' }, { status: 400 });
      const result = await deleteUserData(admin, userId);
      return NextResponse.json({ success: true, ...result }, { headers: noStoreHeaders() });
    }

    if (action === 'delete_all_except') {
      const { keepUserId } = body;
      if (!keepUserId) return NextResponse.json({ success: false, message: 'keepUserId required' }, { status: 400 });
      const result = await deleteAllExceptUser(admin, keepUserId);
      return NextResponse.json({ success: true, ...result }, { headers: noStoreHeaders() });
    }

    if (action === 'nuclear_reset') {
      const { password } = body;
      if (!password) return NextResponse.json({ success: false, message: 'Password required for nuclear reset' }, { status: 400 });
      const result = await nuclearReset(admin, password);
      return NextResponse.json({ success: true, ...result }, { headers: noStoreHeaders() });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
