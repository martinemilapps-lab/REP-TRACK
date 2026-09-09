import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm';
import { AppError } from '@/lib/errors';
import type { UserSessionPayload } from '@/lib/auth';
import { db, adminAuditEvents, organizationRelationships, salesAssignments, sessions, users } from '@/lib/db';
import { generateSecureTemporaryPassword, hashPassword } from '@/lib/services/passwordService';

export const ADMIN_ACTIONS = {
  ACTIVATE: 'USER_ACTIVATED',
  DEACTIVATE: 'USER_DEACTIVATED',
  RESET_PASSWORD: 'PASSWORD_RESET',
  TEMPORARY_PASSWORD: 'TEMPORARY_PASSWORD_GENERATED',
  DEMO_PASSWORDS: 'DEMO_PASSWORDS_GENERATED',
  FORCE_CHANGE: 'PASSWORD_CHANGE_FORCED',
  REVOKE_SESSIONS: 'SESSIONS_REVOKED',
} as const;

export function assertAdminActor(session: UserSessionPayload | null): asserts session is UserSessionPayload {
  if (!session?.id) throw new AppError('Authentication required', 401);
  if (session.mustChangePassword) throw new AppError('Password change required', 403);
  if (session.systemRole !== 'ADMIN') throw new AppError('Administrator access required', 403);
}

export function sanitizeAuditMetadata(metadata: Record<string, unknown> = {}) {
  const blocked = /password|secret|hash|token|credential|api.?key/i;
  return JSON.stringify(Object.fromEntries(Object.entries(metadata).filter(([key]) => !blocked.test(key))));
}

function audit(adminId: string, actionType: string, targetId: string, metadata: Record<string, unknown> = {}) {
  return db.insert(adminAuditEvents).values({
    id: crypto.randomUUID(), adminUserId: adminId, actionType, targetType: 'USER', targetId,
    metadata: sanitizeAuditMetadata(metadata), createdAt: new Date(),
  });
}

export async function recordAdminAudit(adminId: string, actionType: string, targetType: string, targetId: string, metadata: Record<string, unknown> = {}) {
  return db.insert(adminAuditEvents).values({ id: crypto.randomUUID(), adminUserId: adminId, actionType, targetType, targetId, metadata: sanitizeAuditMetadata(metadata), createdAt: new Date() });
}

async function targetUser(userId: string) {
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function getAdminOverview(admin: UserSessionPayload) {
  assertAdminActor(admin);
  const [counts, recent, vacant] = await Promise.all([
    db.select({
      active: sql<number>`sum(case when ${users.isActive} = 1 then 1 else 0 end)`,
      inactive: sql<number>`sum(case when ${users.isActive} = 0 then 1 else 0 end)`,
      mustChange: sql<number>`sum(case when ${users.mustChangePassword} = 1 then 1 else 0 end)`,
      mr: sql<number>`sum(case when ${users.positionCode} = 'MR' then 1 else 0 end)`,
      managers: sql<number>`sum(case when ${users.role} = 'MANAGER' then 1 else 0 end)`,
    }).from(users).get(),
    db.select().from(adminAuditEvents).orderBy(desc(adminAuditEvents.createdAt)).limit(8).all(),
    db.select({ count: sql<number>`count(*)` }).from(salesAssignments).where(and(eq(salesAssignments.isActive, true), sql`${salesAssignments.userId} is null`)).get().catch(() => ({ count: 0 })),
  ]);
  return { ...counts, vacantAssignments: vacant?.count ?? 0, recentActions: recent };
}

export async function listAdminUsers(admin: UserSessionPayload, input: { search?: string; page?: number; pageSize?: number; status?: string } = {}) {
  assertAdminActor(admin);
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(50, Math.max(10, input.pageSize ?? 20));
  const search = input.search?.trim();
  const filters = [];
  if (search) filters.push(or(like(users.name, `%${search}%`), like(users.username, `%${search}%`), like(users.positionCode, `%${search}%`))!);
  if (input.status === 'active') filters.push(eq(users.isActive, true));
  if (input.status === 'inactive') filters.push(eq(users.isActive, false));
  if (input.status === 'must-change') filters.push(eq(users.mustChangePassword, true));
  const where = filters.length ? and(...filters) : undefined;
  const [rows, totalRow, assignments] = await Promise.all([
    db.select({ id: users.id, name: users.name, username: users.username, positionCode: users.positionCode, systemRole: users.systemRole, role: users.role, isActive: users.isActive, mustChangePassword: users.mustChangePassword, createdAt: users.createdAt, updatedAt: users.updatedAt }).from(users).where(where).orderBy(asc(users.name)).limit(pageSize).offset((page - 1) * pageSize).all(),
    db.select({ count: sql<number>`count(*)` }).from(users).where(where).get(),
    db.select().from(salesAssignments).where(eq(salesAssignments.isActive, true)).all().catch(() => []),
  ]);
  const byUser = new Map<string, string[]>();
  for (const item of assignments) byUser.set(item.userId, [...(byUser.get(item.userId) ?? []), item.territoryName]);
  return { users: rows.map((row) => ({ ...row, assignments: byUser.get(row.id) ?? [] })), total: totalRow?.count ?? 0, page, pageSize };
}

export async function getAdminUserDetail(admin: UserSessionPayload, userId: string) {
  assertAdminActor(admin);
  const user = await targetUser(userId);
  const [relationships, assignments, history, activeSessions] = await Promise.all([
    db.select().from(organizationRelationships).where(or(eq(organizationRelationships.subordinateUserId, userId), eq(organizationRelationships.managerUserId, userId))).all(),
    db.select().from(salesAssignments).where(eq(salesAssignments.userId, userId)).all(),
    db.select().from(adminAuditEvents).where(eq(adminAuditEvents.targetId, userId)).orderBy(desc(adminAuditEvents.createdAt)).limit(30).all(),
    db.select({ count: sql<number>`count(*)` }).from(sessions).where(eq(sessions.userId, userId)).get(),
  ]);
  const relatedIds = [...new Set(relationships.flatMap((row) => [row.managerUserId, row.subordinateUserId]).filter((id) => id !== userId))];
  const related = relatedIds.length ? await db.select({ id: users.id, name: users.name, positionCode: users.positionCode }).from(users).where(inArray(users.id, relatedIds)).all() : [];
  const names = new Map(related.map((row) => [row.id, row]));
  return {
    user: { id: user.id, name: user.name, username: user.username, positionCode: user.positionCode, systemRole: user.systemRole, role: user.role, isActive: user.isActive, mustChangePassword: user.mustChangePassword, createdAt: user.createdAt, updatedAt: user.updatedAt },
    directManagers: relationships.filter((row) => row.subordinateUserId === userId && row.isActive).map((row) => names.get(row.managerUserId)).filter(Boolean),
    directReports: relationships.filter((row) => row.managerUserId === userId && row.isActive).map((row) => names.get(row.subordinateUserId)).filter(Boolean),
    assignments, auditHistory: history, activeSessions: activeSessions?.count ?? 0,
  };
}

export async function setAdminUserActive(admin: UserSessionPayload, userId: string, active: boolean) {
  assertAdminActor(admin);
  const target = await targetUser(userId);
  if (!active && target.id === admin.id) throw new AppError('You cannot deactivate your own account', 409);
  if (!active && target.systemRole === 'ADMIN' && target.isActive) {
    const row = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.systemRole, 'ADMIN'), eq(users.isActive, true))).get();
    if ((row?.count ?? 0) <= 1) throw new AppError('The last active administrator cannot be deactivated', 409);
  }
  const now = new Date();
  if (active) {
    await db.batch([
      db.update(users).set({ isActive: true, updatedAt: now }).where(eq(users.id, userId)),
      audit(admin.id, ADMIN_ACTIONS.ACTIVATE, userId, { username: target.username }),
    ]);
  } else {
    await db.batch([
      db.update(users).set({ isActive: false, updatedAt: now }).where(eq(users.id, userId)),
      db.delete(sessions).where(eq(sessions.userId, userId)),
      audit(admin.id, ADMIN_ACTIONS.DEACTIVATE, userId, { username: target.username }),
    ]);
  }
  return { success: true, active };
}

export async function issueAdminTemporaryPassword(admin: UserSessionPayload, userId: string, forceChange: boolean, actionType: string = ADMIN_ACTIONS.TEMPORARY_PASSWORD) {
  assertAdminActor(admin);
  const target = await targetUser(userId);
  const temporaryPassword = generateSecureTemporaryPassword(16);
  await db.batch([
    db.update(users).set({ passwordHash: hashPassword(temporaryPassword), mustChangePassword: forceChange, updatedAt: new Date() }).where(eq(users.id, userId)),
    db.delete(sessions).where(eq(sessions.userId, userId)),
    audit(admin.id, actionType, userId, { username: target.username, forceChange }),
  ]);
  return { id: target.id, name: target.name, username: target.username, position: target.positionCode ?? '', temporaryPassword, status: 'Generated' };
}

export async function forceAdminPasswordChange(admin: UserSessionPayload, userId: string) {
  assertAdminActor(admin); await targetUser(userId);
  await db.batch([
    db.update(users).set({ mustChangePassword: true, updatedAt: new Date() }).where(eq(users.id, userId)),
    db.delete(sessions).where(eq(sessions.userId, userId)),
    audit(admin.id, ADMIN_ACTIONS.FORCE_CHANGE, userId),
  ]);
  return { success: true };
}

export async function revokeAdminUserSessions(admin: UserSessionPayload, userId: string) {
  assertAdminActor(admin); await targetUser(userId);
  await db.batch([db.delete(sessions).where(eq(sessions.userId, userId)), audit(admin.id, ADMIN_ACTIONS.REVOKE_SESSIONS, userId)]);
  return { success: true };
}

export async function generateDemoPasswords(admin: UserSessionPayload, userIds: string[], forceChange: boolean) {
  assertAdminActor(admin);
  const ids = [...new Set(userIds)].slice(0, 100);
  if (!ids.length) throw new AppError('Select at least one eligible user', 400);
  const selected = await db.select().from(users).where(and(inArray(users.id, ids), eq(users.isActive, true))).all();
  const eligible = selectEligibleDemoUsers(selected, ids);
  if (eligible.length !== ids.length) throw new AppError('Selection contains inactive, missing, or ineligible accounts', 400);
  const results = [];
  for (const user of eligible) results.push(await issueAdminTemporaryPassword(admin, user.id, forceChange, ADMIN_ACTIONS.DEMO_PASSWORDS));
  return results;
}

export function selectEligibleDemoUsers<T extends { id: string; isActive: boolean | null; positionCode: string | null; role: string; systemRole: string | null }>(all: T[], selectedIds: string[]) {
  const selected = new Set(selectedIds);
  return all.filter((user) => selected.has(user.id) && user.isActive === true && (user.positionCode === 'MR' || (user.role === 'MANAGER' && user.systemRole !== 'ADMIN')));
}

export async function listAdminAudit(admin: UserSessionPayload, input: { action?: string; targetId?: string; limit?: number } = {}) {
  assertAdminActor(admin);
  const filters = [];
  if (input.action) filters.push(eq(adminAuditEvents.actionType, input.action));
  if (input.targetId) filters.push(eq(adminAuditEvents.targetId, input.targetId));
  return db.select().from(adminAuditEvents).where(filters.length ? and(...filters) : undefined).orderBy(desc(adminAuditEvents.createdAt)).limit(Math.min(100, input.limit ?? 50)).all();
}
