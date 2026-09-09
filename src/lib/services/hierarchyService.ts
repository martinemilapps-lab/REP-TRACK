import { and, eq, inArray } from 'drizzle-orm';
import { db, managerRepScopes, organizationRelationships, representatives, salesAssignments, users } from '@/lib/db';
import type { UserSessionPayload } from '@/lib/auth';
import { assertManagerSession } from '@/lib/authPolicy';
import { AppError } from '@/lib/errors';

export type HierarchyScopeMode = 'DIRECT_REPORTS' | 'ALL_DESCENDANTS';
export type HierarchyEdge = { subordinateUserId: string; managerUserId: string };

export function resolveHierarchyUserIds(
  managerUserId: string,
  edges: HierarchyEdge[],
  activeUserIds: ReadonlySet<string>,
  mode: HierarchyScopeMode,
): string[] {
  if (!activeUserIds.has(managerUserId)) return [];
  const children = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!activeUserIds.has(edge.managerUserId) || !activeUserIds.has(edge.subordinateUserId)) continue;
    if (edge.managerUserId === edge.subordinateUserId) continue;
    const set = children.get(edge.managerUserId) ?? new Set<string>();
    set.add(edge.subordinateUserId);
    children.set(edge.managerUserId, set);
  }
  const direct = [...(children.get(managerUserId) ?? [])];
  if (mode === 'DIRECT_REPORTS') return direct;
  const seen = new Set<string>([managerUserId]);
  const result: string[] = [];
  const queue = [...direct];
  while (queue.length) {
    const userId = queue.shift()!;
    if (seen.has(userId)) continue;
    seen.add(userId);
    result.push(userId);
    for (const child of children.get(userId) ?? []) queue.push(child);
  }
  return result;
}

export function resolveHierarchyAncestorIds(
  userId: string,
  edges: HierarchyEdge[],
  activeUserIds: ReadonlySet<string>,
  directOnly = false,
): string[] {
  const reversed = edges.map((e) => ({ subordinateUserId: e.managerUserId, managerUserId: e.subordinateUserId }));
  return resolveHierarchyUserIds(userId, reversed, activeUserIds, directOnly ? 'DIRECT_REPORTS' : 'ALL_DESCENDANTS');
}

async function loadGraph() {
  const [activeUsers, activeEdges] = await Promise.all([
    db.select({ id: users.id }).from(users).where(eq(users.isActive, true)).all(),
    db.select({ subordinateUserId: organizationRelationships.subordinateUserId, managerUserId: organizationRelationships.managerUserId })
      .from(organizationRelationships).where(eq(organizationRelationships.isActive, true)).all(),
  ]);
  return { activeUserIds: new Set(activeUsers.map((u) => u.id)), edges: activeEdges };
}

async function loadLegacyScopedRepIds(managerUserId: string) {
  const rows = await db.select({ repId: managerRepScopes.repId }).from(managerRepScopes)
    .where(eq(managerRepScopes.managerUserId, managerUserId)).all();
  return [...new Set(rows.map((row) => row.repId))];
}

export const hierarchyService = {
  async getScopedUserIds(session: UserSessionPayload | null, mode: HierarchyScopeMode = 'ALL_DESCENDANTS') {
    assertManagerSession(session);
    try {
      const graph = await loadGraph();
      return resolveHierarchyUserIds(session.id, graph.edges, graph.activeUserIds, mode);
    } catch {
      const repIds = await loadLegacyScopedRepIds(session.id);
      if (!repIds.length) return [];
      const rows = await db.select({ id: users.id }).from(users)
        .where(and(inArray(users.repId, repIds), eq(users.isActive, true))).all();
      return [...new Set(rows.map((row) => row.id))];
    }
  },
  async getDirectManagerIds(session: UserSessionPayload | null) {
    assertManagerSession(session);
    try {
      const graph = await loadGraph();
      return resolveHierarchyAncestorIds(session.id, graph.edges, graph.activeUserIds, true);
    } catch {
      return [];
    }
  },
  async getAncestorIds(session: UserSessionPayload | null) {
    assertManagerSession(session);
    try {
      const graph = await loadGraph();
      return resolveHierarchyAncestorIds(session.id, graph.edges, graph.activeUserIds);
    } catch {
      return [];
    }
  },
  async getScopedRepIds(session: UserSessionPayload | null, mode: HierarchyScopeMode = 'ALL_DESCENDANTS') {
    const userIds = await this.getScopedUserIds(session, mode);
    if (!userIds.length) return [];
    const [userRows, assignmentRows] = await Promise.all([
      db.select({ repId: users.repId }).from(users).where(inArray(users.id, userIds)).all(),
      db.select({ repId: salesAssignments.repId }).from(salesAssignments)
        .where(and(inArray(salesAssignments.userId, userIds), eq(salesAssignments.isActive, true))).all().catch(() => []),
    ]);
    return [...new Set([...userRows, ...assignmentRows].map((r) => r.repId).filter((id): id is string => Boolean(id)))];
  },
  async getScopedRepresentatives(session: UserSessionPayload | null, mode: HierarchyScopeMode = 'ALL_DESCENDANTS') {
    const ids = await this.getScopedRepIds(session, mode);
    if (!ids.length) return [];
    return db.select({ id: representatives.id, name: representatives.name, area: representatives.area })
      .from(representatives).where(and(inArray(representatives.id, ids), eq(representatives.isActive, true))).all();
  },
  async assertUserVisible(session: UserSessionPayload | null, userId: string) {
    assertManagerSession(session);
    if (userId === session.id) return;
    if (!(await this.getScopedUserIds(session)).includes(userId)) throw new AppError('غير مصرح لك بالوصول إلى هذا المستخدم', 403);
  },
  async assertRepVisible(session: UserSessionPayload | null, repId: string) {
    assertManagerSession(session);
    if (!(await this.getScopedRepIds(session)).includes(repId)) throw new AppError('غير مصرح لك بالوصول إلى هذا المندوب', 403);
  },
};
