import type { UserSessionPayload } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { assertAuthenticatedSession } from '@/lib/authPolicy';

export function resolveWritableRepId(session: UserSessionPayload | null, requestedRepId?: string | null): string {
  assertAuthenticatedSession(session);
  if (session.systemRole === 'ADMIN') {
    if (!requestedRepId) throw new AppError('Representative ID is required', 400);
    return requestedRepId;
  }
  if (session.role === 'MANAGER') {
    if (!session.hasPersonalSalesAssignment || !session.personalSalesAssignment?.repId) throw new AppError('No editable personal representative assignment', 403);
    return session.personalSalesAssignment.repId;
  }
  if (!session.repId) throw new AppError('No representative assignment', 403);
  return session.repId;
}
