import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', quiet: true });
import { client } from '../src/lib/db';
import { dataGatewayClient } from '../src/lib/dataGatewayClient';
import { computeTransitiveClosure, validateHierarchyAcyclicity } from '../src/lib/services/organizationService';

/**
 * Authoritative reporting hierarchy from rep_track_hierarchy_d1.sql
 * 30 active employees, 33 immediate relationships (29 active user edges + 4 vacancies)
 */
const AUTHORITATIVE_RELATIONSHIPS = [
  { subordinate: 'Osama Bert', manager: 'Maged Raouf', subPos: 'BUM', mgrPos: 'SMD' },
  { subordinate: 'Bassem Hanna', manager: 'Osama Bert', subPos: 'DM', mgrPos: 'BUM' },
  { subordinate: 'Marwa shaaban', manager: 'Osama Bert', subPos: 'DM', mgrPos: 'BUM' },
  { subordinate: 'Mina Michel', manager: 'Osama Bert', subPos: 'OM', mgrPos: 'BUM' },
  { subordinate: 'Rafik Maged', manager: 'Osama Bert', subPos: 'DM', mgrPos: 'BUM' },
  { subordinate: 'Peter Abdel Nour', manager: 'Osama Bert', subPos: 'OM', mgrPos: 'BUM' },
  { subordinate: 'Peter Basily', manager: 'Osama Bert', subPos: 'DM', mgrPos: 'BUM' },
  { subordinate: 'Michael Antonyo', manager: 'Osama Bert', subPos: 'AM', mgrPos: 'BUM' },
  { subordinate: 'Ashraf Shawky', manager: 'Osama Bert', subPos: 'DM', mgrPos: 'BUM' },
  { subordinate: 'Wael Atef', manager: 'Osama Bert', subPos: 'OM', mgrPos: 'BUM' },
  { subordinate: 'Maher Khamis', manager: 'Osama Bert', subPos: 'DM', mgrPos: 'BUM' },
  { subordinate: 'Philip Nayer', manager: 'Osama Bert', subPos: 'MR', mgrPos: 'BUM' },
  { subordinate: 'Fawzy Nasser', manager: 'Osama Bert', subPos: 'MR', mgrPos: 'BUM' },
  { subordinate: 'Engy Hosny', manager: 'Osama Bert', subPos: 'MR', mgrPos: 'BUM' },
  { subordinate: 'Sara Adel', manager: 'Bassem Hanna', subPos: 'MR', mgrPos: 'DM' },
  { subordinate: 'Mostafa Ahmed', manager: 'Bassem Hanna', subPos: 'MR', mgrPos: 'DM' },
  { subordinate: 'Mohamed Baiomy', manager: 'Bassem Hanna', subPos: 'MR', mgrPos: 'DM' },
  { subordinate: 'Esraa shehata', manager: 'Marwa shaaban', subPos: 'MR', mgrPos: 'DM' },
  { subordinate: 'Helana Alex 1', manager: 'Mina Michel', subPos: 'MR', mgrPos: 'OM' },
  { subordinate: 'Amanda Medhat', manager: 'Rafik Maged', subPos: 'MR', mgrPos: 'DM' },
  { subordinate: 'Marina Sameh', manager: 'Peter Abdel Nour', subPos: 'MR', mgrPos: 'OM' },
  { subordinate: 'Marian Adel', manager: 'Peter Abdel Nour', subPos: 'DM', mgrPos: 'OM' },
  { subordinate: 'Ahmed Hassan', manager: 'Marian Adel', subPos: 'MR', mgrPos: 'DM' },
  { subordinate: 'Ahmed el Mesalamy', manager: 'Peter Basily', subPos: 'MR', mgrPos: 'DM' },
  { subordinate: 'Emad Latif', manager: 'Peter Basily', subPos: 'MR', mgrPos: 'DM' },
  { subordinate: 'Randa Magdy', manager: 'Ashraf Shawky', subPos: 'MR', mgrPos: 'DM' },
  { subordinate: 'Kirollos Adel', manager: 'Ashraf Shawky', subPos: 'MR', mgrPos: 'DM' },
  { subordinate: 'John Amin', manager: 'Wael Atef', subPos: 'MR', mgrPos: 'OM' },
  { subordinate: 'Ahmed El Kot', manager: 'Maher Khamis', subPos: 'MR', mgrPos: 'DM' },
];

const normalize = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ');

async function main() {
  const isApply = process.argv.includes('--apply');
  console.log(`=== RECONCILING HIERARCHY D1 (${isApply ? 'APPLY' : 'DRY RUN'}) ===\n`);

  // 1. Fetch Users
  const users = await client.execute('SELECT id, name, position_code, role, system_role, rep_id, is_active FROM users') as any[];
  const userMapByName = new Map<string, any>();
  for (const u of users) {
    userMapByName.set(normalize(u.name), u);
  }

  // Verify all people exist
  for (const rel of AUTHORITATIVE_RELATIONSHIPS) {
    const sub = userMapByName.get(normalize(rel.subordinate));
    const mgr = userMapByName.get(normalize(rel.manager));
    if (!sub) throw new Error(`Subordinate user not found: ${rel.subordinate}`);
    if (!mgr) throw new Error(`Manager user not found: ${rel.manager}`);
  }
  console.log('All 30 active employees verified in users table.');

  // 2. Update Positions hierarchy levels
  const posStatements: any[] = [
    { sql: "UPDATE positions SET hierarchy_level = 10, title_en = 'Medical Representative', title_ar = 'مندوب دعاية طبية' WHERE code = 'MR'", params: [], method: 'run' },
    { sql: "UPDATE positions SET hierarchy_level = 20, title_en = 'District Manager', title_ar = 'مدير منطقة' WHERE code = 'DM'", params: [], method: 'run' },
    { sql: "UPDATE positions SET hierarchy_level = 30, title_en = 'Area Manager', title_ar = 'مدير إقليمي' WHERE code = 'AM'", params: [], method: 'run' },
    { sql: "UPDATE positions SET hierarchy_level = 40, title_en = 'Operations Manager', title_ar = 'مدير عمليات' WHERE code = 'OM'", params: [], method: 'run' },
    { sql: "UPDATE positions SET hierarchy_level = 50, title_en = 'Business Unit Manager', title_ar = 'مدير وحدة أعمال' WHERE code = 'BUM'", params: [], method: 'run' },
    { sql: "UPDATE positions SET hierarchy_level = 50, title_en = 'Product Manager', title_ar = 'مدير منتج' WHERE code = 'PM'", params: [], method: 'run' },
    { sql: "UPDATE positions SET hierarchy_level = 55, title_en = 'Marketing Manager', title_ar = 'مدير تسويق' WHERE code = 'MM'", params: [], method: 'run' },
    { sql: "UPDATE positions SET hierarchy_level = 60, title_en = 'Senior Managing Director', title_ar = 'رئيس مجلس الإدارة التنفيذي' WHERE code = 'SMD'", params: [], method: 'run' },
  ];

  // 3. Organization Relationships
  const currentRels = await client.execute('SELECT id, subordinate_user_id, manager_user_id, relationship_type, source_position, manager_position, is_active FROM organization_relationships') as any[];
  const relStatements: any[] = [];

  const authEdgeKeys = new Set<string>();
  for (const rel of AUTHORITATIVE_RELATIONSHIPS) {
    const sub = userMapByName.get(normalize(rel.subordinate))!;
    const mgr = userMapByName.get(normalize(rel.manager))!;
    authEdgeKeys.add(`${sub.id}:${mgr.id}`);
    const newId = `rel-${sub.id}-${mgr.id}`.slice(0, 36);
    relStatements.push({
      sql: `INSERT INTO organization_relationships (id, subordinate_user_id, manager_user_id, relationship_type, source_position, manager_position, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?)
            ON CONFLICT(subordinate_user_id, manager_user_id, relationship_type) DO UPDATE SET
              is_active = 1,
              source_position = excluded.source_position,
              manager_position = excluded.manager_position`,
      params: [newId, sub.id, mgr.id, 'DIRECT', rel.subPos, rel.mgrPos, Date.now()],
      method: 'run',
    });
  }

  // Deactivate any relationship between these users that is NOT in the authoritative list
  // (e.g. Michael Antonyo -> Kirollos Rizk, or any duplicate)
  for (const r of currentRels) {
    if (r.is_active === 1 && !authEdgeKeys.has(`${r.subordinate_user_id}:${r.manager_user_id}`)) {
      const subUser = users.find(u => u.id === r.subordinate_user_id);
      const mgrUser = users.find(u => u.id === r.manager_user_id);
      console.log(`Deactivating non-authoritative relationship: ${mgrUser?.name || r.manager_user_id} -> ${subUser?.name || r.subordinate_user_id} (${r.id})`);
      relStatements.push({
        sql: 'UPDATE organization_relationships SET is_active = 0 WHERE id = ?',
        params: [r.id],
        method: 'run',
      });
    }
  }

  // 4. Compute Transitive Closure for hierarchy_paths
  const activeEdgesForClosure = AUTHORITATIVE_RELATIONSHIPS.map(rel => {
    const sub = userMapByName.get(normalize(rel.subordinate))!;
    const mgr = userMapByName.get(normalize(rel.manager))!;
    return {
      subordinateUserId: sub.id,
      managerUserId: mgr.id,
      managerPosition: rel.mgrPos,
      subordinateAssignmentId: null,
    };
  });

  const dagCheck = validateHierarchyAcyclicity(activeEdgesForClosure);
  if (!dagCheck.isValid) {
    throw new Error(`Cycle detected in authoritative relationships: ${dagCheck.cyclePath?.join(' -> ')}`);
  }
  console.log('DAG validation passed: 0 cycles, strictly acyclic.');

  // Sales assignments
  const assignments = await client.execute('SELECT id, user_id, rep_id, assignment_type FROM sales_assignments WHERE is_active = 1') as any[];
  const assignmentsByUser = new Map<string, Array<{ id: string }>>();
  for (const a of assignments) {
    assignmentsByUser.set(a.user_id, [...(assignmentsByUser.get(a.user_id) ?? []), { id: a.id }]);
  }

  const userPositions = new Map<string, string>();
  for (const u of users) {
    userPositions.set(u.id, u.position_code || 'MR');
  }

  const computedPaths = computeTransitiveClosure(activeEdgesForClosure, userPositions, assignmentsByUser);
  console.log(`Computed transitive closure paths: ${computedPaths.length}`);

  const pathStatements: any[] = [
    { sql: 'DELETE FROM hierarchy_paths', params: [], method: 'run' }
  ];
  for (const p of computedPaths) {
    pathStatements.push({
      sql: 'INSERT INTO hierarchy_paths (id, source_assignment_id, source_user_id, ancestor_user_id, ancestor_position, depth, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      params: [p.id, p.sourceAssignmentId ?? null, p.sourceUserId, p.ancestorUserId, p.ancestorPosition, p.depth, Date.now()],
      method: 'run',
    });
  }

  // 5. Reconcile manager_rep_scopes to match the EXACT hierarchy!
  // Map of managerId -> Set of descendant repIds
  // A descendant is any descendant in hierarchy that has a rep_id or whose sales assignment has a rep_id
  const managerDescendantReps = new Map<string, Set<string>>();
  
  // Helper: traverse downstream
  const childrenMap = new Map<string, string[]>();
  for (const edge of activeEdgesForClosure) {
    childrenMap.set(edge.managerUserId, [...(childrenMap.get(edge.managerUserId) || []), edge.subordinateUserId]);
  }

  function getDescendants(mgrId: string): string[] {
    const res: string[] = [];
    const q = [...(childrenMap.get(mgrId) || [])];
    const seen = new Set<string>([mgrId]);
    while (q.length > 0) {
      const curr = q.shift()!;
      if (seen.has(curr)) continue;
      seen.add(curr);
      res.push(curr);
      for (const ch of childrenMap.get(curr) || []) q.push(ch);
    }
    return res;
  }

  const scopeStatements: any[] = [
    { sql: 'DELETE FROM manager_rep_scopes', params: [], method: 'run' }
  ];

  const managerUsers = users.filter(u => u.role === 'MANAGER' || u.position_code !== 'MR');
  let totalScopedEntries = 0;

  for (const mgr of managerUsers) {
    const descUserIds = getDescendants(mgr.id);
    const repIds = new Set<string>();

    for (const uid of descUserIds) {
      const u = users.find(x => x.id === uid);
      if (u?.rep_id) repIds.add(u.rep_id);
      const userAssigns = assignments.filter(a => a.user_id === uid);
      for (const a of userAssigns) {
        if (a.rep_id) repIds.add(a.rep_id);
      }
    }

    // Special case for Maged Raouf (SMD): can see all active Line 2 reps
    if (mgr.position_code === 'SMD') {
      // All descendants of Osama Bert
      const osama = userMapByName.get('osama bert');
      if (osama) {
        for (const uid of getDescendants(osama.id)) {
          const u = users.find(x => x.id === uid);
          if (u?.rep_id) repIds.add(u.rep_id);
          const userAssigns = assignments.filter(a => a.user_id === uid);
          for (const a of userAssigns) {
            if (a.rep_id) repIds.add(a.rep_id);
          }
        }
      }
    }

    managerDescendantReps.set(mgr.name, repIds);
    console.log(`Manager: ${mgr.name.padEnd(20)} (${mgr.position_code}) -> Scoped reps count: ${repIds.size}`);

    for (const repId of repIds) {
      const scopeId = `scope-${mgr.id}-${repId}`.slice(0, 36);
      scopeStatements.push({
        sql: 'INSERT INTO manager_rep_scopes (id, manager_user_id, rep_id, created_at) VALUES (?, ?, ?, ?)',
        params: [scopeId, mgr.id, repId, Date.now()],
        method: 'run',
      });
      totalScopedEntries++;
    }
  }

  console.log(`Total manager_rep_scopes entries generated: ${totalScopedEntries}`);

  const allStatements = [
    ...posStatements,
    ...relStatements,
    ...pathStatements,
    ...scopeStatements,
  ];

  console.log(`Total SQL statements to execute: ${allStatements.length}`);

  if (isApply) {
    const url = process.env.REP_TRACK_DATA_API_URL;
    const secret = process.env.REP_TRACK_DATA_API_SECRET;
    const BATCH_SIZE = 25;
    for (let i = 0; i < allStatements.length; i += BATCH_SIZE) {
      const batch = allStatements.slice(i, i + BATCH_SIZE);
      const res = await fetch(`${url}/api/batch`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statements: batch }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error(`Batch error at ${i}:`, data);
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      console.log(`Executed statements ${i + 1} to ${Math.min(i + BATCH_SIZE, allStatements.length)} directly on D1`);
    }
    console.log('Migration applied directly to Cloudflare D1!');
  } else {
    console.log('Dry run complete. Use --apply to execute.');
  }
}

main().catch(console.error);
