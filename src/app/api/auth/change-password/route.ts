import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuthenticatedUser,
  verifyPassword,
  validatePasswordQuality,
  hashPassword,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';
import { db, users, sessions } from '@/lib/db';
import { eq, and, ne } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    // 1. Validate Authenticated Session (allow pending password change)
    const session = await requireAuthenticatedUser(true);

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json(
        { success: false, message: 'كلمة المرور الحالية مطلوبة' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { success: false, message: 'كلمة المرور الجديدة مطلوبة' },
        { status: 400 }
      );
    }

    // 2. Fetch User Record
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, session.id))
      .get();

    if (!userRecord) {
      return NextResponse.json(
        { success: false, message: 'تعذر العثور على بيانات المستخدم' },
        { status: 404 }
      );
    }

    // 3. Verify Current Password
    const isCurrentValid = verifyPassword(currentPassword, userRecord.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, message: 'كلمة المرور الحالية غير صحيحة' },
        { status: 400 }
      );
    }

    // 4. Validate Confirmation Match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'تأكيد كلمة المرور غير متطابق مع كلمة المرور الجديدة' },
        { status: 400 }
      );
    }

    // 5. Ensure New Password Differs from Current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, message: 'يجب اختيار كلمة مرور جديدة تختلف عن كلمة المرور الحالية' },
        { status: 400 }
      );
    }

    // 6. Validate Password Quality & Complexity
    const qualityResult = validatePasswordQuality(newPassword);
    if (!qualityResult.valid) {
      return NextResponse.json(
        {
          success: false,
          message: qualityResult.errors[0],
          errors: qualityResult.errors,
        },
        { status: 400 }
      );
    }

    // 7. Update Password Hash & Clear must_change_password
    const newHash = hashPassword(newPassword);
    const now = new Date();

    await db
      .update(users)
      .set({
        passwordHash: newHash,
        mustChangePassword: false,
        updatedAt: now,
      })
      .where(eq(users.id, userRecord.id));

    // 8. Revoke Other Active Sessions (preserving current session)
    const currentToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (currentToken) {
      try {
        await db
          .delete(sessions)
          .where(and(eq(sessions.userId, userRecord.id), ne(sessions.id, currentToken)));
      } catch (err) {
        console.error('Error revoking other sessions:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث وتأمين كلمة المرور بنجاح',
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    if (err?.statusCode === 401) {
      return NextResponse.json({ success: false, message: err.message }, { status: 401 });
    }
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تغيير كلمة المرور' },
      { status: 500 }
    );
  }
}
