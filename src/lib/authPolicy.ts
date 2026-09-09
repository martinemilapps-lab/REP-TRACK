import type { UserSessionPayload } from '@/lib/auth';
import { AppError } from '@/lib/errors';

/** Shared by HTTP guards and services; sessions must come from the server. */
export function assertAuthenticatedSession(
  session: UserSessionPayload | null,
  allowPendingPasswordChange = false,
): asserts session is UserSessionPayload {
  if (!session?.id) throw new AppError('Authentication required', 401);
  if (!allowPendingPasswordChange && session.mustChangePassword) {
    throw new AppError('Password change required', 403);
  }
}

const managerPositions = new Set(['DM', 'AM', 'OM', 'BUM', 'PM', 'MM', 'SMD']);

export function assertManagerSession(
  session: UserSessionPayload | null,
): asserts session is UserSessionPayload {
  assertAuthenticatedSession(session);
  if (session.role !== 'MANAGER' || !managerPositions.has(session.positionCode ?? '')) {
    throw new AppError('هذا الإجراء مخصص للمناصب الإدارية المعتمدة فقط', 403);
  }
}

/** STEP 19 is strictly personal, including SMD/ADMIN. Hierarchy is STEP 20. */
export function assertManagerOwner(session: UserSessionPayload | null, userId: string): void {
  assertManagerSession(session);
  if (userId !== session.id) throw new AppError('You are not authorized to access this record', 403);
}
