import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db, users, sessions, loginAttempts, salesAssignments } from '@/lib/db';
import { eq, and, gt } from 'drizzle-orm';
import { AppError } from '@/lib/errors';
import { assertAuthenticatedSession } from '@/lib/authPolicy';
import {
  generateSecureTemporaryPassword,
  validatePasswordQuality,
  hashPassword,
  verifyPassword,
} from '@/lib/services/passwordService';

export {
  generateSecureTemporaryPassword,
  validatePasswordQuality,
  hashPassword,
  verifyPassword,
};

export const SESSION_COOKIE_NAME = 'rep_track_session';
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 1000 * 60 * 15; // 15 minutes

export interface UserSessionPayload {
  id: string;
  username: string;
  name: string;
  role: 'MANAGER' | 'REPRESENTATIVE';
  repId: string | null;
  positionCode?: string | null;
  systemRole?: 'REPRESENTATIVE' | 'MANAGER' | 'ADMIN' | null;
  mustChangePassword?: boolean;
  hasPersonalSalesAssignment?: boolean;
  personalSalesAssignment?: {
    id: string;
    titleRaw: string;
    businessLine: number | null;
    territoryName: string;
    repId: string | null;
  } | null;
  primarySalesAssignment?: {
    id: string;
    titleRaw: string;
    businessLine: number | null;
    territoryName: string;
    repId: string | null;
  } | null;
}

/**
 * Creates a database-backed session row and returns the session token.
 */
export async function createDbSession(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    id: token,
    userId,
    expiresAt,
  });

  return token;
}

/**
 * Destroys a database-backed session.
 */
export async function destroyDbSession(token: string): Promise<void> {
  try {
    await db.delete(sessions).where(eq(sessions.id, token));
  } catch (error) {
    console.error('Error destroying session:', error);
  }
}

/**
 * Revokes all active database sessions for a specific user.
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  try {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  } catch (error) {
    console.error('Error revoking user sessions:', error);
  }
}

/**
 * Reads the session cookie and verifies the session against the database.
 */
export async function getServerSession(): Promise<UserSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const now = new Date();

    // Query active session and join user details
    const sessionRecord = await db
      .select({
        sessionId: sessions.id,
        userId: users.id,
        username: users.username,
        name: users.name,
        role: users.role,
        repId: users.repId,
        positionCode: users.positionCode,
        systemRole: users.systemRole,
        mustChangePassword: users.mustChangePassword,
        isActive: users.isActive,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.id, token), gt(sessions.expiresAt, now)))
      .get();

    if (!sessionRecord || sessionRecord.isActive === false) {
      return null;
    }

    // Resolve sales assignments for this user
    let personalAssign: typeof salesAssignments.$inferSelect | null = null;
    let primaryAssign: typeof salesAssignments.$inferSelect | null = null;
    try {
      const userAssignments = await db
        .select()
        .from(salesAssignments)
        .where(and(eq(salesAssignments.userId, sessionRecord.userId), eq(salesAssignments.isActive, true)))
        .all();

      personalAssign = userAssignments.find(a => a.assignmentType === 'PERSONAL_MR') || null;
      primaryAssign = userAssignments.find(a => a.assignmentType === 'PRIMARY_REP') || null;
    } catch {
      // Graceful fallback if table is not yet populated
    }

    const effectiveRepId = sessionRecord.repId || primaryAssign?.repId || personalAssign?.repId || null;

    return {
      id: sessionRecord.userId,
      username: sessionRecord.username,
      name: sessionRecord.name,
      role: sessionRecord.role as 'MANAGER' | 'REPRESENTATIVE',
      repId: effectiveRepId,
      positionCode: sessionRecord.positionCode,
      systemRole: sessionRecord.systemRole as 'REPRESENTATIVE' | 'MANAGER' | 'ADMIN' | null,
      mustChangePassword: sessionRecord.mustChangePassword === true,
      hasPersonalSalesAssignment: !!personalAssign,
      personalSalesAssignment: personalAssign ? {
        id: personalAssign.id,
        titleRaw: personalAssign.titleRaw || 'MR',
        businessLine: personalAssign.businessLine,
        territoryName: personalAssign.territoryName,
        repId: personalAssign.repId,
      } : null,
      primarySalesAssignment: primaryAssign ? {
        id: primaryAssign.id,
        titleRaw: primaryAssign.titleRaw || 'MR',
        businessLine: primaryAssign.businessLine,
        territoryName: primaryAssign.territoryName,
        repId: primaryAssign.repId,
      } : null,
    };
  } catch (error) {
    console.error('Session retrieval error:', error);
    return null;
  }
}

/**
 * Authorization Guard: Requires an authenticated user session.
 * Throws 403 if mustChangePassword === true unless allowPendingPasswordChange is true.
 */
export async function requireAuthenticatedUser(allowPendingPasswordChange = false): Promise<UserSessionPayload> {
  const session = await getServerSession();
  assertAuthenticatedSession(session, allowPendingPasswordChange);
  return session;
}

/**
 * Authorization Guard: Requires a MANAGER role.
 */
export async function requireManager(): Promise<UserSessionPayload> {
  const session = await requireAuthenticatedUser();
  if (session.role !== 'MANAGER') {
    throw new AppError('غير مصرح لك بالوصول إلى هذه اللوحة أو التقرير', 403);
  }
  return session;
}

/**
 * Authorization Guard: Requires a REPRESENTATIVE role with a linked repId.
 */
export async function requireRepresentative(): Promise<UserSessionPayload & { repId: string }> {
  const session = await requireAuthenticatedUser();
  if (session.role !== 'REPRESENTATIVE' || !session.repId) {
    throw new AppError('هذا الإجراء مخصص للمندوبين المعتمدين فقط', 403);
  }
  return session as UserSessionPayload & { repId: string };
}

/**
 * Authorization Guard: Requires an ADMIN system role (e.g. SMD executive administration).
 * Normal managers are rejected with 403.
 */
export async function requireAdmin(): Promise<UserSessionPayload> {
  const session = await requireAuthenticatedUser();
  if (session.systemRole !== 'ADMIN') {
    throw new AppError('هذا الإجراء مخصص لإدارة النظام والمدير التنفيذي فقط', 403);
  }
  return session;
}

/**
 * Resolves the authorized representative ID:
 * - If REPRESENTATIVE: ALWAYS returns session.repId (ignores any client-provided repId).
 * - If MANAGER: returns requestedRepId (if filtering) or null (for all).
 * - If UNAUTHENTICATED: returns fallbackRepId if public lookup allowed, else null.
 */
export function resolveAuthorizedRepId(
  session: UserSessionPayload | null,
  requestedRepId?: string | null
): string | null {
  if (session?.role === 'REPRESENTATIVE') {
    return session.repId;
  }
  if (session?.role === 'MANAGER') {
    return requestedRepId || null;
  }
  return requestedRepId || null;
}

/**
 * Sets the HttpOnly session cookie on the response.
 */
export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clears the session cookie.
 */
export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Rate Limiting: Checks if an IP is currently locked out.
 */
export async function checkRateLimit(ip: string): Promise<{ locked: boolean; remainingMinutes?: number }> {
  try {
    const attempt = await db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.ipAddress, ip))
      .get();

    if (!attempt) return { locked: false };

    if (attempt.lockedUntil && attempt.lockedUntil.getTime() > Date.now()) {
      const remainingMs = attempt.lockedUntil.getTime() - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
      return { locked: true, remainingMinutes };
    }

    return { locked: false };
  } catch {
    return { locked: false };
  }
}

/**
 * Rate Limiting: Records a failed login attempt for an IP.
 */
export async function recordFailedLogin(ip: string): Promise<void> {
  try {
    const attempt = await db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.ipAddress, ip))
      .get();

    const now = new Date();

    if (!attempt) {
      await db.insert(loginAttempts).values({
        ipAddress: ip,
        attemptCount: 1,
        lastAttemptAt: now,
      });
    } else {
      const newCount = attempt.attemptCount + 1;
      const shouldLock = newCount >= MAX_FAILED_ATTEMPTS;
      const lockedUntil = shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null;

      await db
        .update(loginAttempts)
        .set({
          attemptCount: shouldLock ? 0 : newCount,
          lastAttemptAt: now,
          lockedUntil,
        })
        .where(eq(loginAttempts.ipAddress, ip));
    }
  } catch (error) {
    console.error('Error recording failed login attempt:', error);
  }
}

/**
 * Rate Limiting: Resets login attempts on successful authentication.
 */
export async function resetRateLimit(ip: string): Promise<void> {
  try {
    await db.delete(loginAttempts).where(eq(loginAttempts.ipAddress, ip));
  } catch (error) {
    console.error('Error resetting login attempts:', error);
  }
}
