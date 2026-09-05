import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { AppError } from '@/lib/errors';
import { UserSessionPayload, revokeAllUserSessions } from '@/lib/auth';
import {
  generateSecureTemporaryPassword,
  hashPassword,
} from '@/lib/services/passwordService';

export interface AdminResetPasswordResult {
  success: boolean;
  userId: string;
  username: string;
  temporaryPassword: string;
  message: string;
}

/**
 * Server-authoritative password reset capability.
 * Strictly restricted to SMD / ADMIN system role.
 * Generates a new cryptographically random temporary password,
 * sets must_change_password = 1, and revokes all active sessions for the user.
 */
export async function resetUserPasswordByAdmin(
  adminSession: UserSessionPayload,
  targetUserId: string
): Promise<AdminResetPasswordResult> {
  // 1. Authorization Check: ADMIN system role required (e.g. SMD Maged Raouf)
  if (adminSession.systemRole !== 'ADMIN') {
    throw new AppError('غير مصرح بهذا الإجراء إلا لمدير النظام التنفيذي (SMD / ADMIN)', 403);
  }

  if (!targetUserId || typeof targetUserId !== 'string') {
    throw new AppError('معرّف المستخدم المطلوب إعادة تعيين كلمة مروره مطلوب', 400);
  }

  // 2. Fetch Target User
  const targetUser = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .get();

  if (!targetUser) {
    throw new AppError('المستخدم المطلوب غير موجود', 404);
  }

  // 3. Generate High-Entropy Temporary Password & Hash
  const temporaryPassword = generateSecureTemporaryPassword(14);
  const passwordHash = hashPassword(temporaryPassword);
  const now = new Date();

  // 4. Update Database: Set new hash and force must_change_password = 1
  await db
    .update(users)
    .set({
      passwordHash,
      mustChangePassword: true,
      updatedAt: now,
    })
    .where(eq(users.id, targetUser.id));

  // 5. Invalidate All Active Sessions for Target User
  await revokeAllUserSessions(targetUser.id);

  return {
    success: true,
    userId: targetUser.id,
    username: targetUser.username,
    temporaryPassword,
    message: `تمت إعادة تعيين كلمة المرور للمستخدم ${targetUser.username} بنجاح. يجب عليه تغييرها عند تسجيل الدخول الأول.`,
  };
}
