import { db, organizationRelationships, salesAssignments, hierarchyPaths, users, areas, positions, representatives } from '@/lib/db';
import { eq, and, inArray } from 'drizzle-orm';
import { OrganizationRelationship, SalesAssignment, HierarchyPath, PositionCode } from '@/types';

/**
 * Cycle Detection & DAG Validation
 * Ensures the organization reporting graph is strictly acyclic (no cycles)
 * and has no self-referential relationships.
 */
export function validateHierarchyAcyclicity(
  edges: Array<{ subordinateUserId: string; managerUserId: string }>
): { isValid: boolean; cyclePath?: string[] } {
  const adj = new Map<string, string[]>();

  for (const edge of edges) {
    if (edge.subordinateUserId === edge.managerUserId) {
      return {
        isValid: false,
        cyclePath: [edge.subordinateUserId, edge.managerUserId],
      };
    }
    if (!adj.has(edge.subordinateUserId)) {
      adj.set(edge.subordinateUserId, []);
    }
    adj.get(edge.subordinateUserId)!.push(edge.managerUserId);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const currentPath: string[] = [];

  function dfs(node: string): boolean {
    visited.add(node);
    inStack.add(node);
    currentPath.push(node);

    const neighbors = adj.get(node) || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        if (dfs(next)) return true;
      } else if (inStack.has(next)) {
        currentPath.push(next);
        return true; // Cycle detected
      }
    }

    inStack.delete(node);
    currentPath.pop();
    return false;
  }

  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      if (dfs(node)) {
        return { isValid: false, cyclePath: [...currentPath] };
      }
    }
  }

  return { isValid: true };
}

/**
 * Computes the complete Transitive Closure (hierarchy_paths)
 * Precomputes all valid ancestor paths from every user and sales assignment up to executive leadership.
 * Handles skipped levels, multi-BUM relationships, and marketing lines without recursive query overhead.
 */
export function computeTransitiveClosure(
  relationships: Array<{
    subordinateUserId: string;
    managerUserId: string;
    managerPosition: string;
    subordinateAssignmentId?: string | null;
  }>,
  userPositions: Map<string, string>,
  assignmentsByUser: Map<string, Array<{ id: string }>>
): Array<{
  id: string;
  sourceAssignmentId?: string | null;
  sourceUserId: string;
  ancestorUserId: string;
  ancestorPosition: string;
  depth: number;
}> {
  // Build parent adjacency: child -> list of direct parents
  const parentMap = new Map<string, Array<{ managerId: string; managerPos: string; assignmentId?: string | null }>>();

  for (const rel of relationships) {
    if (!parentMap.has(rel.subordinateUserId)) {
      parentMap.set(rel.subordinateUserId, []);
    }
    parentMap.get(rel.subordinateUserId)!.push({
      managerId: rel.managerUserId,
      managerPos: rel.managerPosition,
      assignmentId: rel.subordinateAssignmentId,
    });
  }

  const paths: Array<{
    id: string;
    sourceAssignmentId?: string | null;
    sourceUserId: string;
    ancestorUserId: string;
    ancestorPosition: string;
    depth: number;
  }> = [];

  const seenPaths = new Set<string>();

  // For every user, traverse upwards to discover all ancestors
  for (const startUserId of userPositions.keys()) {
    const queue: Array<{ currentId: string; depth: number }> = [{ currentId: startUserId, depth: 1 }];
    const visitedAncestors = new Set<string>();

    const userAssignments = assignmentsByUser.get(startUserId) || [];

    while (queue.length > 0) {
      const { currentId, depth } = queue.shift()!;
      const parents = parentMap.get(currentId) || [];

      for (const p of parents) {
        const ancestorId = p.managerId;
        const ancestorPos = p.managerPos || userPositions.get(ancestorId) || 'MANAGER';

        // 1. Path from user to ancestor
        const userPathKey = `${startUserId}:${ancestorId}`;
        if (!seenPaths.has(userPathKey)) {
          seenPaths.add(userPathKey);
          paths.push({
            id: `hp-u-${startUserId}-${ancestorId}`.toLowerCase(),
            sourceUserId: startUserId,
            sourceAssignmentId: null,
            ancestorUserId: ancestorId,
            ancestorPosition: ancestorPos,
            depth,
          });
        }

        // 2. Paths from each of the user's sales assignments to ancestor
        for (const assign of userAssignments) {
          const assignPathKey = `${assign.id}:${ancestorId}`;
          if (!seenPaths.has(assignPathKey)) {
            seenPaths.add(assignPathKey);
            paths.push({
              id: `hp-sa-${assign.id}-${ancestorId}`.toLowerCase(),
              sourceUserId: startUserId,
              sourceAssignmentId: assign.id,
              ancestorUserId: ancestorId,
              ancestorPosition: ancestorPos,
              depth,
            });
          }
        }

        if (!visitedAncestors.has(ancestorId)) {
          visitedAncestors.add(ancestorId);
          queue.push({ currentId: ancestorId, depth: depth + 1 });
        }
      }
    }
  }

  return paths;
}

/**
 * Pure aggregation function for manager product sales
 * Rule: Sum of all unique leaf sales assignments in manager's scope
 *       + manager's own personal sales assignment (if one exists).
 * Deduplicates assignments across multi-BUM lines to ensure exact 1-to-1 accounting.
 */
export function aggregateSalesForManager(
  managerUserId: string,
  managerAssignments: SalesAssignment[],
  subordinateAssignments: SalesAssignment[],
  salesByAssignment: Map<string, number>
): {
  totalSales: number;
  subordinateSales: number;
  personalSales: number;
  uniqueAssignmentCount: number;
  assignmentDetails: Array<{ id: string; territory: string; titleRaw: string; type: string; sales: number }>;
} {
  const countedAssignments = new Set<string>();
  const details: Array<{ id: string; territory: string; titleRaw: string; type: string; sales: number }> = [];

  let subordinateSales = 0;
  let personalSales = 0;

  // 1. Process Subordinate Leaf Assignments
  for (const assign of subordinateAssignments) {
    if (!countedAssignments.has(assign.id)) {
      countedAssignments.add(assign.id);
      const sales = salesByAssignment.get(assign.id) || 0;
      subordinateSales += sales;
      const territory = assign.territoryName || (assign as any).territory_name || '';
      const titleRaw = assign.titleRaw || (assign as any).title_raw || '';
      const type = assign.assignmentType || (assign as any).assignment_type || '';
      details.push({
        id: assign.id,
        territory,
        titleRaw,
        type,
        sales,
      });
    }
  }

  // 2. Process Manager's Own Personal Sales Assignment (e.g. Azza Karim personal MR1)
  const personalAssignments = managerAssignments.filter(
    a => (a.assignmentType || (a as any).assignment_type) === 'PERSONAL_MR'
  );
  for (const passign of personalAssignments) {
    if (!countedAssignments.has(passign.id)) {
      countedAssignments.add(passign.id);
      const sales = salesByAssignment.get(passign.id) || 0;
      personalSales += sales;
      const territory = passign.territoryName || (passign as any).territory_name || '';
      const titleRaw = passign.titleRaw || (passign as any).title_raw || '';
      const type = passign.assignmentType || (passign as any).assignment_type || '';
      details.push({
        id: passign.id,
        territory,
        titleRaw,
        type,
        sales,
      });
    }
  }

  const totalSales = subordinateSales + personalSales;

  return {
    totalSales,
    subordinateSales,
    personalSales,
    uniqueAssignmentCount: countedAssignments.size,
    assignmentDetails: details,
  };
}

/**
 * Service Layer: Organization & Sales Assignment API
 */
export const organizationService = {
  /**
   * Retrieves all sales assignments for a given user
   * Handles both pure MRs (single assignment) and dual-role managers (primary management role + personal sales assignment).
   */
  async getSalesAssignmentsForUser(userId: string): Promise<SalesAssignment[]> {
    const rows = await db
      .select()
      .from(salesAssignments)
      .where(and(eq(salesAssignments.userId, userId), eq(salesAssignments.isActive, true)))
      .all();

    return rows.map(r => ({
      id: r.id,
      userId: r.userId,
      assignmentType: r.assignmentType as any,
      titleRaw: r.titleRaw,
      businessLine: r.businessLine,
      areaId: r.areaId,
      territoryName: r.territoryName,
      repId: r.repId,
      sourceRow: r.sourceRow,
      isActive: r.isActive,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined,
    }));
  },

  /**
   * Retrieves all direct supervisors for a user
   */
  async getDirectSupervisors(userId: string): Promise<OrganizationRelationship[]> {
    const rows = await db
      .select()
      .from(organizationRelationships)
      .where(and(eq(organizationRelationships.subordinateUserId, userId), eq(organizationRelationships.isActive, true)))
      .all();

    return rows.map(r => ({
      id: r.id,
      subordinateUserId: r.subordinateUserId,
      managerUserId: r.managerUserId,
      relationshipType: r.relationshipType,
      sourcePosition: r.sourcePosition,
      managerPosition: r.managerPosition,
      subordinateAssignmentId: r.subordinateAssignmentId,
      isActive: r.isActive,
      sourceMetadata: r.sourceMetadata ? JSON.parse(r.sourceMetadata) : null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
    }));
  },

  /**
   * Retrieves all immediate direct reports for a manager
   */
  async getDirectReports(managerUserId: string): Promise<OrganizationRelationship[]> {
    const rows = await db
      .select()
      .from(organizationRelationships)
      .where(and(eq(organizationRelationships.managerUserId, managerUserId), eq(organizationRelationships.isActive, true)))
      .all();

    return rows.map(r => ({
      id: r.id,
      subordinateUserId: r.subordinateUserId,
      managerUserId: r.managerUserId,
      relationshipType: r.relationshipType,
      sourcePosition: r.sourcePosition,
      managerPosition: r.managerPosition,
      subordinateAssignmentId: r.subordinateAssignmentId,
      isActive: r.isActive,
      sourceMetadata: r.sourceMetadata ? JSON.parse(r.sourceMetadata) : null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
    }));
  },

  /**
   * Retrieves all sales assignments within a manager's hierarchy scope
   * Uses the precalculated hierarchy_paths closure table for instant sub-millisecond retrieval.
   */
  async getScopedSalesAssignments(managerUserId: string): Promise<SalesAssignment[]> {
    // 1. Fetch assignment IDs from hierarchy_paths
    const paths = await db
      .select({ assignmentId: hierarchyPaths.sourceAssignmentId })
      .from(hierarchyPaths)
      .where(eq(hierarchyPaths.ancestorUserId, managerUserId))
      .all();

    const validAssignIds = paths.map(p => p.assignmentId).filter((id): id is string => Boolean(id));

    // Also include the manager's own personal sales assignments
    const ownPersonalAssignments = await db
      .select()
      .from(salesAssignments)
      .where(and(eq(salesAssignments.userId, managerUserId), eq(salesAssignments.assignmentType, 'PERSONAL_MR')))
      .all();

    if (validAssignIds.length === 0 && ownPersonalAssignments.length === 0) {
      return [];
    }

    let subordinateRows: any[] = [];
    if (validAssignIds.length > 0) {
      subordinateRows = await db
        .select()
        .from(salesAssignments)
        .where(inArray(salesAssignments.id, validAssignIds))
        .all();
    }

    const allRows = [...subordinateRows, ...ownPersonalAssignments];
    const seen = new Set<string>();
    const unique: SalesAssignment[] = [];

    for (const r of allRows) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        unique.push({
          id: r.id,
          userId: r.userId,
          assignmentType: r.assignmentType as any,
          titleRaw: r.titleRaw,
          businessLine: r.businessLine,
          areaId: r.areaId,
          territoryName: r.territoryName,
          repId: r.repId,
          sourceRow: r.sourceRow,
          isActive: r.isActive,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
          updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined,
        });
      }
    }

    return unique;
  },

  /**
   * Retrieves all representatives within a manager's hierarchy scope.
   * SMD receives organization-wide scope from its real executive position.
   * Admin capability alone never expands operational report scope.
   */
  async getScopedRepresentatives(
    managerUserId: string,
    systemRole?: string | null,
    positionCode?: string | null
  ): Promise<Array<{ id: string; name: string; area: string }>> {
    if (positionCode === 'SMD') {
      const all = await db
        .select({ id: representatives.id, name: representatives.name, area: representatives.area })
        .from(representatives)
        .where(eq(representatives.isActive, true))
        .all();
      return all;
    }

    const scopedAssignments = await this.getScopedSalesAssignments(managerUserId);
    const repIds = new Set<string>();
    for (const a of scopedAssignments) {
      if (a.repId) repIds.add(a.repId);
    }

    // Also find users for these assignments and their rep_ids
    const userIds = Array.from(new Set(scopedAssignments.map(a => a.userId)));
    if (userIds.length > 0) {
      const userRows = await db
        .select({ repId: users.repId })
        .from(users)
        .where(inArray(users.id, userIds))
        .all();
      for (const u of userRows) {
        if (u.repId) repIds.add(u.repId);
      }
    }

    if (repIds.size === 0) {
      return [];
    }

    const matchedReps = await db
      .select({ id: representatives.id, name: representatives.name, area: representatives.area })
      .from(representatives)
      .where(inArray(representatives.id, Array.from(repIds)))
      .all();

    return matchedReps;
  },

  /**
   * Verifies if a given representative (by ID or name) is within the manager's hierarchy scope.
   */
  async isRepInScope(
    managerUserId: string,
    targetRepIdOrName: string,
    systemRole?: string | null,
    positionCode?: string | null
  ): Promise<boolean> {
    if (!targetRepIdOrName) return false;
    if (positionCode === 'SMD') return true;

    const scopedReps = await this.getScopedRepresentatives(managerUserId, systemRole, positionCode);
    const targetClean = targetRepIdOrName.trim().toLowerCase();
    return scopedReps.some(
      r => r.id.toLowerCase() === targetClean || r.name.toLowerCase() === targetClean
    );
  },
};
