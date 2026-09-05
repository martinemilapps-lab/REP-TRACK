import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { resetUserPasswordByAdmin } from '@/lib/services/adminAuthService';

export async function POST(req: NextRequest) {
  try {
    // 1. Guard: Strictly requires ADMIN system role (e.g. SMD executive administration).
    // Normal managers will be rejected with 403.
    const adminSession = await requireAdmin();

    const body = await req.json();
    const { targetUserId } = body;

    const result = await resetUserPasswordByAdmin(adminSession, targetUserId);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    if (err?.statusCode) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.statusCode }
      );
    }
    console.error('Password reset error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إعادة تعيين كلمة المرور' },
      { status: 500 }
    );
  }
}
