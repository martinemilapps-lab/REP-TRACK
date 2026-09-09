import type { UserSessionPayload } from '@/lib/auth';
import { ADMIN_ACTIONS, issueAdminTemporaryPassword } from '@/lib/services/adminService';

/** Backward-compatible STEP 16 entry point; new admin routes use adminService directly. */
export async function resetUserPasswordByAdmin(adminSession: UserSessionPayload, targetUserId: string) {
  const credential = await issueAdminTemporaryPassword(adminSession, targetUserId, true, ADMIN_ACTIONS.RESET_PASSWORD);
  return {
    success: true,
    userId: credential.id,
    username: credential.username,
    temporaryPassword: credential.temporaryPassword,
    message: `Password reset for ${credential.username}. A password change is required at next login.`,
  };
}
