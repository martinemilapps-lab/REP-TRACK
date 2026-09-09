import * as fs from 'fs';
import * as path from 'path';
import { validateHierarchyAcyclicity, computeTransitiveClosure } from '../src/lib/services/organizationService';

// CSV parsing helper
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let inQuote = false;
  let cell = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuote && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (char === ',' && !inQuote) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuote) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell.trim());
      if (row.some(c => c.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some(c => c.length > 0)) rows.push(row);
  }
  return rows;
}

function escapeSql(str: unknown): string {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

export interface OrganizationDataset {
  positions: Array<{ code: string; title_en: string; title_ar: string; hierarchy_level: number }>;
  areas: Array<{ id: string; name: string }>;
  users: Array<{
    id: string;
    username: string;
    username_number: number;
    name: string;
    position_code: string;
    system_role: string;
    role: string;
    rep_id: string | null;
    business_line: number | null;
    legacy_title_raw: string | null;
  }>;
  salesAssignments: Array<{
    id: string;
    user_id: string;
    assignment_type: 'PRIMARY_REP' | 'PERSONAL_MR' | 'TERRITORY_COVERAGE';
    title_raw: string;
    business_line: number | null;
    area_id: string | null;
    territory_name: string;
    rep_id: string | null;
    source_row: number;
  }>;
  relationships: Array<{
    id: string;
    subordinate_user_id: string;
    manager_user_id: string;
    relationship_type: string;
    source_position: string;
    manager_position: string;
    subordinate_assignment_id: string | null;
    source_metadata: string;
  }>;
  hierarchyPaths: Array<{
    id: string;
    source_assignment_id: string | null;
    source_user_id: string;
    ancestor_user_id: string;
    ancestor_position: string;
    depth: number;
    sourceAssignmentId: string | null;
    sourceUserId: string;
    ancestorUserId: string;
    ancestorPosition: string;
  }>;
  managerRepScopes: Array<{ id: string; manager_user_id: string; rep_id: string }>;
  managerAreaScopes: Array<{ id: string; manager_user_id: string; area_id: string }>;
}

export function buildOrganizationDataset(): OrganizationDataset {
  const rootDir = path.resolve(__dirname, '..');
  const employeeCsvPath = path.join(rootDir, 'docs/data-migration/employee-account-manifest.csv');
  const hierarchyCsvPath = path.join(rootDir, 'docs/data-migration/hierarchy-manifest.csv');

  const empRows = parseCSV(fs.readFileSync(employeeCsvPath, 'utf8'));
  const empHeader = empRows[0];
  const employees = empRows.slice(1).map(r => {
    const obj: Record<string, string> = {};
    empHeader.forEach((h, i) => (obj[h] = r[i] || ''));
    return obj;
  });

  const hierRows = parseCSV(fs.readFileSync(hierarchyCsvPath, 'utf8'));
  const hierHeader = hierRows[0];
  const hierarchy = hierRows.slice(1).map(r => {
    const obj: Record<string, string> = {};
    hierHeader.forEach((h, i) => (obj[h] = r[i] || ''));
    return obj;
  });

  // 1. Positions
  const positionsList = [
    { code: 'MR', title_en: 'Medical Representative', title_ar: 'مندوب دعاية طبية', hierarchy_level: 1 },
    { code: 'DM', title_en: 'District Manager', title_ar: 'مدير منطقة', hierarchy_level: 2 },
    { code: 'AM', title_en: 'Area Manager', title_ar: 'مدير إقليمي', hierarchy_level: 3 },
    { code: 'OM', title_en: 'Operations Manager', title_ar: 'مدير عمليات', hierarchy_level: 3 },
    { code: 'BUM', title_en: 'Business Unit Manager', title_ar: 'مدير وحدة أعمال', hierarchy_level: 4 },
    { code: 'PM', title_en: 'Product Manager', title_ar: 'مدير منتج', hierarchy_level: 4 },
    { code: 'MM', title_en: 'Marketing Manager', title_ar: 'مدير تسويق', hierarchy_level: 5 },
    { code: 'SMD', title_en: 'Senior Managing Director', title_ar: 'رئيس مجلس الإدارة التنفيذي', hierarchy_level: 6 },
  ];

  // 2. Areas
  const territorySet = new Set<string>();
  employees.forEach(e => {
    if (e.territory && e.territory.trim()) territorySet.add(e.territory.trim());
  });
  hierarchy.forEach(h => {
    if (h.territory && h.territory.trim()) territorySet.add(h.territory.trim());
  });
  territorySet.add('Unassigned');

  const sortedTerritories = Array.from(territorySet).sort();
  const areaMap = new Map<string, string>();
  const areasList = sortedTerritories.map((t, idx) => {
    const id = `area-${String(idx + 1).padStart(3, '0')}`;
    areaMap.set(t, id);
    return { id, name: t };
  });

  // 3. Extract Business Line Helper
  function extractBusinessLine(title: string): number | null {
    if (!title) return null;
    const match = title.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  // 4. Build Canonical User Accounts (Strictly 63 Active Unique Accounts)
  const activeEmployees = employees.filter(e => e.account_status === 'ACTIVE');
  const userMap = new Map<string, string>(); // username -> userId
  const userByCanonicalName = new Map<string, { id: string; username: string; position: string; name: string }>();

  const usersList = activeEmployees.map(emp => {
    const username = emp.proposed_username;
    const userId = `u-${username.toLowerCase()}`;
    userMap.set(username, userId);

    const numMatch = username.match(/\d+/);
    const usernameNumber = numMatch ? parseInt(numMatch[0], 10) : 1;

    const pos = emp.normalized_position;
    const isMR = pos === 'MR';
    const role = isMR ? 'REPRESENTATIVE' : 'MANAGER';
    const isMarioAdmin = username === 'PM1' && emp.employee_name.trim().toLowerCase() === 'mario nader';
    const systemRole = isMarioAdmin ? 'ADMIN' : isMR ? 'USER' : 'MANAGER';
    const repId = isMR ? `rep-${username.toLowerCase()}` : null;
    const line = extractBusinessLine(emp.legacy_title_raw);

    const record = {
      id: userId,
      username,
      username_number: usernameNumber,
      name: emp.employee_name.trim(),
      position_code: pos,
      system_role: systemRole,
      role,
      rep_id: repId,
      business_line: line,
      legacy_title_raw: emp.legacy_title_raw || null,
    };

    const normName = emp.employee_name.trim().toLowerCase().replace('kiollos', 'kirollos');
    userByCanonicalName.set(normName, { id: userId, username, position: pos, name: emp.employee_name.trim() });

    return record;
  });

  // 5. Sales Assignments:
  //    A. 36 Primary MR Assignments
  //    B. 6 Secondary PERSONAL_MR Assignments for the dual-role managers
  const salesAssignmentsList: OrganizationDataset['salesAssignments'] = [];
  const assignmentsByUser = new Map<string, Array<{ id: string }>>();

  function addAssignment(assign: OrganizationDataset['salesAssignments'][0]) {
    salesAssignmentsList.push(assign);
    if (!assignmentsByUser.has(assign.user_id)) {
      assignmentsByUser.set(assign.user_id, []);
    }
    assignmentsByUser.get(assign.user_id)!.push({ id: assign.id });
  }

  // A. Primary MR assignments
  const activeMRs = activeEmployees.filter(e => e.normalized_position === 'MR');
  activeMRs.forEach(mr => {
    const userId = userMap.get(mr.proposed_username)!;
    const assignId = `sa-${mr.proposed_username.toLowerCase()}`;
    let terr = mr.territory ? mr.territory.trim() : '';
    if (!terr) {
      if (mr.employee_name === 'Fady Kamal') terr = 'Shobra /Shobra el Khema';
      else if (mr.employee_name === 'Ahmed El Kot') terr = 'Behira/Kafr el shiekh';
      else terr = 'Unassigned';
    }
    const areaId = areaMap.get(terr) || null;
    const line = extractBusinessLine(mr.legacy_title_raw);
    const repId = `rep-${mr.proposed_username.toLowerCase()}`;

    addAssignment({
      id: assignId,
      user_id: userId,
      assignment_type: 'PRIMARY_REP',
      title_raw: mr.legacy_title_raw || 'MR',
      business_line: line,
      area_id: areaId,
      territory_name: terr,
      rep_id: repId,
      source_row: parseInt(mr.source_row, 10) || 0,
    });
  });

  // B. Verified Dual-Role Personal MR Assignments
  // Candidate specifications derived from Final Areas sheet.xlsx:
  const dualRoleConfigs = [
    {
      canonicalName: 'azza karim',
      targetUser: 'DM1',
      sourceRow: 70,
      titleRaw: 'MR1',
      line: 1,
      territory: 'Masr El gedida',
    },
    {
      canonicalName: 'kirollos rizk',
      targetUser: 'DM2',
      sourceRow: 71,
      titleRaw: 'MR1',
      line: 1,
      territory: 'Doki/Mohandseen',
      rawSpelling: 'Kiollos Rizk',
    },
    {
      canonicalName: 'esraa el shimy',
      targetUser: 'DM3',
      sourceRow: 73,
      titleRaw: 'MR1',
      line: 1,
      territory: 'Down Town, Maadi/Helwan',
    },
    {
      canonicalName: 'maher khamis',
      targetUser: 'DM13',
      sourceRow: 14,
      titleRaw: 'MR1',
      line: 1,
      territory: 'Vacant Behira',
    },
    {
      canonicalName: 'marian adel',
      targetUser: 'DM11',
      sourceRow: 72,
      titleRaw: 'MR1',
      line: 1,
      territory: 'Menofya /Qalubia',
    },
    {
      canonicalName: 'beshoy samy',
      targetUser: 'DM14',
      sourceRow: 74,
      titleRaw: 'MR3',
      line: 3,
      territory: 'Shobra /Shobra el Khema',
    },
  ];

  dualRoleConfigs.forEach(cfg => {
    const userId = userMap.get(cfg.targetUser);
    if (!userId) return;
    const assignId = `sa-${cfg.targetUser.toLowerCase()}-personal`;
    const areaId = areaMap.get(cfg.territory) || null;

    addAssignment({
      id: assignId,
      user_id: userId,
      assignment_type: 'PERSONAL_MR',
      title_raw: cfg.titleRaw,
      business_line: cfg.line,
      area_id: areaId,
      territory_name: cfg.territory,
      rep_id: null, // Personal MR assignment attached directly to manager user
      source_row: cfg.sourceRow,
    });
  });

  // 6. Organization Relationships (Direct Reporting Graph)
  const relationshipsList: OrganizationDataset['relationships'] = [];
  const relDedupe = new Set<string>();

  function addRelationship(
    subUserId: string,
    mgrUserId: string,
    relType: string,
    subPos: string,
    mgrPos: string,
    assignId: string | null,
    meta: Record<string, unknown>
  ) {
    if (subUserId === mgrUserId) return; // Prevent self loops
    const key = `${subUserId}:${mgrUserId}:${relType}`;
    if (relDedupe.has(key)) return;
    relDedupe.add(key);

    const relId = `rel-${relationshipsList.length + 1}`;
    relationshipsList.push({
      id: relId,
      subordinate_user_id: subUserId,
      manager_user_id: mgrUserId,
      relationship_type: relType,
      source_position: subPos,
      manager_position: mgrPos,
      subordinate_assignment_id: assignId,
      source_metadata: JSON.stringify(meta),
    });
  }

  // Map each hierarchy row to direct parent relationship edges
  hierarchy.forEach((h, hIdx) => {
    const rawName = h.employee_name.trim();
    const normName = rawName.toLowerCase().replace('kiollos', 'kirollos');
    const subUser = userByCanonicalName.get(normName);

    // If vacant or no active user account, skip relationship creation
    if (!subUser) return;

    // Find the user's primary sales assignment if MR
    const primaryAssign = salesAssignmentsList.find(a => a.user_id === subUser.id && a.assignment_type === 'PRIMARY_REP');

    const dmList = h.dm ? h.dm.split(',').map(s => s.trim()).filter(Boolean) : [];
    const amList = h.am ? h.am.split(',').map(s => s.trim()).filter(Boolean) : [];
    const omList = h.om ? h.om.split(',').map(s => s.trim()).filter(Boolean) : [];
    const bumList = h.bum ? h.bum.split(',').map(s => s.trim()).filter(Boolean) : [];
    const mmList = h.mm ? h.mm.split(',').map(s => s.trim()).filter(Boolean) : [];
    const smdList = h.smd ? h.smd.split(',').map(s => s.trim()).filter(Boolean) : [];

    // Determine direct managers based on source hierarchy paths
    // For MR:
    // If DM exists -> direct to DM
    // Else if AM exists -> direct to AM
    // Else if OM exists -> direct to OM
    // Else if BUM exists -> direct to BUM
    if (subUser.position === 'MR') {
      if (dmList.length > 0 && dmList[0].toLowerCase() !== 'none') {
        dmList.forEach(dmName => {
          const mgr = userByCanonicalName.get(dmName.toLowerCase().replace('kiollos', 'kirollos'));
          if (mgr) {
            addRelationship(subUser.id, mgr.id, 'DIRECT', subUser.position, mgr.position, primaryAssign?.id || null, {
              sourceRow: hIdx + 3,
              path: 'MR->DM',
              territory: h.territory,
            });
          }
        });
      } else if (amList.length > 0 && amList[0].toLowerCase() !== 'none') {
        amList.forEach(amName => {
          const mgr = userByCanonicalName.get(amName.toLowerCase());
          if (mgr) {
            addRelationship(subUser.id, mgr.id, 'SKIP_LEVEL', subUser.position, mgr.position, primaryAssign?.id || null, {
              sourceRow: hIdx + 3,
              path: 'MR->AM (Direct)',
              territory: h.territory,
            });
          }
        });
      } else if (omList.length > 0 && omList[0].toLowerCase() !== 'none') {
        omList.forEach(omName => {
          const mgr = userByCanonicalName.get(omName.toLowerCase());
          if (mgr) {
            addRelationship(subUser.id, mgr.id, 'SKIP_LEVEL', subUser.position, mgr.position, primaryAssign?.id || null, {
              sourceRow: hIdx + 3,
              path: 'MR->OM (Direct)',
              territory: h.territory,
            });
          }
        });
      } else if (bumList.length > 0 && bumList[0].toLowerCase() !== 'none') {
        bumList.forEach(bumName => {
          const mgr = userByCanonicalName.get(bumName.toLowerCase());
          if (mgr) {
            const relType = bumList.length > 1 ? 'MULTI_BUM' : 'SKIP_LEVEL';
            addRelationship(subUser.id, mgr.id, relType, subUser.position, mgr.position, primaryAssign?.id || null, {
              sourceRow: hIdx + 3,
              path: 'MR->BUM (Direct)',
              territory: h.territory,
            });
          }
        });
      }
    }

    // For DM:
    // If AM exists -> DM -> AM
    // Else if OM exists -> DM -> OM
    // Else if BUM exists -> DM -> BUM
    if (subUser.position === 'DM') {
      if (amList.length > 0 && amList[0].toLowerCase() !== 'none') {
        amList.forEach(amName => {
          const mgr = userByCanonicalName.get(amName.toLowerCase());
          if (mgr) {
            addRelationship(subUser.id, mgr.id, 'DIRECT', subUser.position, mgr.position, null, {
              sourceRow: hIdx + 3,
              path: 'DM->AM',
              territory: h.territory,
            });
          }
        });
      } else if (omList.length > 0 && omList[0].toLowerCase() !== 'none') {
        omList.forEach(omName => {
          const mgr = userByCanonicalName.get(omName.toLowerCase());
          if (mgr) {
            addRelationship(subUser.id, mgr.id, 'DIRECT', subUser.position, mgr.position, null, {
              sourceRow: hIdx + 3,
              path: 'DM->OM',
              territory: h.territory,
            });
          }
        });
      } else if (bumList.length > 0 && bumList[0].toLowerCase() !== 'none') {
        bumList.forEach(bumName => {
          const mgr = userByCanonicalName.get(bumName.toLowerCase());
          if (mgr) {
            const relType = bumList.length > 1 ? 'MULTI_BUM' : 'DIRECT';
            addRelationship(subUser.id, mgr.id, relType, subUser.position, mgr.position, null, {
              sourceRow: hIdx + 3,
              path: 'DM->BUM (Direct)',
              territory: h.territory,
            });
          }
        });
      }
    }

    // For AM & OM:
    // AM/OM -> BUM (single or multi-BUM)
    if (subUser.position === 'AM' || subUser.position === 'OM') {
      bumList.forEach(bumName => {
        const mgr = userByCanonicalName.get(bumName.toLowerCase());
        if (mgr) {
          const relType = bumList.length > 1 ? 'MULTI_BUM' : 'DIRECT';
          addRelationship(subUser.id, mgr.id, relType, subUser.position, mgr.position, null, {
            sourceRow: hIdx + 3,
            path: `${subUser.position}->BUM`,
            territory: h.territory,
          });
        }
      });
    }

    // For BUM:
    // BUM -> SMD (Maged Raouf)
    if (subUser.position === 'BUM') {
      const smdName = smdList[0] || 'Maged Raouf';
      const smdUser = userByCanonicalName.get(smdName.toLowerCase());
      if (smdUser) {
        addRelationship(subUser.id, smdUser.id, 'DIRECT', subUser.position, smdUser.position, null, {
          sourceRow: hIdx + 3,
          path: 'BUM->SMD',
        });
      }
    }

    // For PM:
    // PM -> MM (Magdy Nassif)
    if (subUser.position === 'PM') {
      const mmName = mmList[0] || 'Magdy Nassif';
      const mmUser = userByCanonicalName.get(mmName.toLowerCase());
      if (mmUser) {
        addRelationship(subUser.id, mmUser.id, 'DIRECT', subUser.position, mmUser.position, null, {
          sourceRow: hIdx + 3,
          path: 'PM->MM',
        });
      }
    }

    // For MM:
    // MM -> SMD (Maged Raouf)
    if (subUser.position === 'MM') {
      const smdName = smdList[0] || 'Maged Raouf';
      const smdUser = userByCanonicalName.get(smdName.toLowerCase());
      if (smdUser) {
        addRelationship(subUser.id, smdUser.id, 'DIRECT', subUser.position, smdUser.position, null, {
          sourceRow: hIdx + 3,
          path: 'MM->SMD',
        });
      }
    }
  });

  // 7. Validate Acyclicity (DAG Constraint)
  const validation = validateHierarchyAcyclicity(
    relationshipsList.map(r => ({
      subordinateUserId: r.subordinate_user_id,
      managerUserId: r.manager_user_id,
    }))
  );

  if (!validation.isValid) {
    throw new Error(`Hierarchy validation failed: Cycle detected: ${validation.cyclePath?.join(' -> ')}`);
  }

  // 8. Precompute Transitive Closure (hierarchy_paths)
  const userPositionsMap = new Map<string, string>();
  usersList.forEach(u => userPositionsMap.set(u.id, u.position_code));

  const paths = computeTransitiveClosure(
    relationshipsList.map(r => ({
      subordinateUserId: r.subordinate_user_id,
      managerUserId: r.manager_user_id,
      managerPosition: r.manager_position,
      subordinateAssignmentId: r.subordinate_assignment_id,
    })),
    userPositionsMap,
    assignmentsByUser
  );

  const mappedPaths = paths.map(p => ({
    id: p.id,
    source_assignment_id: p.sourceAssignmentId || null,
    source_user_id: p.sourceUserId,
    ancestor_user_id: p.ancestorUserId,
    ancestor_position: p.ancestorPosition,
    depth: p.depth,
    sourceAssignmentId: p.sourceAssignmentId || null,
    sourceUserId: p.sourceUserId,
    ancestorUserId: p.ancestorUserId,
    ancestorPosition: p.ancestorPosition,
  }));

  // 9. Derive Backward-Compatible manager_rep_scopes and manager_area_scopes
  const repScopesSet = new Set<string>();
  const areaScopesSet = new Set<string>();
  const managerRepScopes: OrganizationDataset['managerRepScopes'] = [];
  const managerAreaScopes: OrganizationDataset['managerAreaScopes'] = [];

  mappedPaths.forEach(p => {
    if (p.sourceAssignmentId) {
      const assign = salesAssignmentsList.find(a => a.id === p.sourceAssignmentId);
      if (assign && assign.rep_id) {
        const repKey = `${p.ancestorUserId}:${assign.rep_id}`;
        if (!repScopesSet.has(repKey)) {
          repScopesSet.add(repKey);
          managerRepScopes.push({
            id: `mrs-${managerRepScopes.length + 1}`,
            manager_user_id: p.ancestorUserId,
            rep_id: assign.rep_id,
          });
        }
      }
      if (assign && assign.area_id) {
        const areaKey = `${p.ancestorUserId}:${assign.area_id}`;
        if (!areaScopesSet.has(areaKey)) {
          areaScopesSet.add(areaKey);
          managerAreaScopes.push({
            id: `mas-${managerAreaScopes.length + 1}`,
            manager_user_id: p.ancestorUserId,
            area_id: assign.area_id,
          });
        }
      }
    }
  });

  return {
    positions: positionsList,
    areas: areasList,
    users: usersList,
    salesAssignments: salesAssignmentsList,
    relationships: relationshipsList,
    hierarchyPaths: mappedPaths,
    managerRepScopes,
    managerAreaScopes,
  };
}

export function generateOrganizationDataSql(dataset: OrganizationDataset): string {
  const lines: string[] = [
    '-- ==============================================================================',
    '-- REP TRACK: STEP 15B Organization & Sales Foundation Provisioning Data',
    '-- Target: Cloudflare D1 rep-track-dev',
    '-- Generated strictly from approved manifests and Final Areas sheet.xlsx',
    '-- ==============================================================================',
    '',
    '-- 1. Positions',
    ...dataset.positions.map(
      p =>
        `INSERT OR REPLACE INTO \`positions\` (\`code\`, \`title_en\`, \`title_ar\`, \`hierarchy_level\`) VALUES (${escapeSql(
          p.code
        )}, ${escapeSql(p.title_en)}, ${escapeSql(p.title_ar)}, ${p.hierarchy_level});`
    ),
    '',
    '-- 2. Areas',
    ...dataset.areas.map(
      a => `INSERT OR REPLACE INTO \`areas\` (\`id\`, \`name\`, \`is_active\`) VALUES (${escapeSql(a.id)}, ${escapeSql(a.name)}, 1);`
    ),
    '',
    '-- 3. Sales Assignments (Primary MR + Manager Personal MR)',
    ...dataset.salesAssignments.map(
      sa =>
        `INSERT OR REPLACE INTO \`sales_assignments\` (\`id\`, \`user_id\`, \`assignment_type\`, \`title_raw\`, \`business_line\`, \`area_id\`, \`territory_name\`, \`rep_id\`, \`source_row\`, \`is_active\`) VALUES (${escapeSql(
          sa.id
        )}, ${escapeSql(sa.user_id)}, ${escapeSql(sa.assignment_type)}, ${escapeSql(sa.title_raw)}, ${
          sa.business_line !== null ? sa.business_line : 'NULL'
        }, ${escapeSql(sa.area_id)}, ${escapeSql(sa.territory_name)}, ${escapeSql(sa.rep_id)}, ${sa.source_row}, 1);`
    ),
    '',
    '-- 4. Organization Relationships (Direct Hierarchy Edges)',
    ...dataset.relationships.map(
      r =>
        `INSERT OR REPLACE INTO \`organization_relationships\` (\`id\`, \`subordinate_user_id\`, \`manager_user_id\`, \`relationship_type\`, \`source_position\`, \`manager_position\`, \`subordinate_assignment_id\`, \`is_active\`, \`source_metadata\`) VALUES (${escapeSql(
          r.id
        )}, ${escapeSql(r.subordinate_user_id)}, ${escapeSql(r.manager_user_id)}, ${escapeSql(r.relationship_type)}, ${escapeSql(
          r.source_position
        )}, ${escapeSql(r.manager_position)}, ${escapeSql(r.subordinate_assignment_id)}, 1, ${escapeSql(r.source_metadata)});`
    ),
    '',
    '-- 5. Hierarchy Paths (Precalculated Transitive Closure)',
    ...dataset.hierarchyPaths.map(
      hp =>
        `INSERT OR REPLACE INTO \`hierarchy_paths\` (\`id\`, \`source_assignment_id\`, \`source_user_id\`, \`ancestor_user_id\`, \`ancestor_position\`, \`depth\`) VALUES (${escapeSql(
          hp.id
        )}, ${escapeSql(hp.source_assignment_id)}, ${escapeSql(hp.source_user_id)}, ${escapeSql(hp.ancestor_user_id)}, ${escapeSql(
          hp.ancestor_position
        )}, ${hp.depth});`
    ),
    '',
    '-- 6. Backward Compatibility: Manager Rep Scopes',
    ...dataset.managerRepScopes.map(
      mrs =>
        `INSERT OR REPLACE INTO \`manager_rep_scopes\` (\`id\`, \`manager_user_id\`, \`rep_id\`) VALUES (${escapeSql(
          mrs.id
        )}, ${escapeSql(mrs.manager_user_id)}, ${escapeSql(mrs.rep_id)});`
    ),
    '',
    '-- 7. Backward Compatibility: Manager Area Scopes',
    ...dataset.managerAreaScopes.map(
      mas =>
        `INSERT OR REPLACE INTO \`manager_area_scopes\` (\`id\`, \`manager_user_id\`, \`area_id\`) VALUES (${escapeSql(
          mas.id
        )}, ${escapeSql(mas.manager_user_id)}, ${escapeSql(mas.area_id)});`
    ),
    '',
  ];

  return lines.join('\n');
}

// Execute standalone if called via CLI
if (require.main === module) {
  console.log('🏗️ Building STEP 15B Organization Dataset...');
  const dataset = buildOrganizationDataset();
  console.log(`  ✓ Positions: ${dataset.positions.length}`);
  console.log(`  ✓ Areas: ${dataset.areas.length}`);
  console.log(`  ✓ Users (Unique Employee Accounts): ${dataset.users.length}`);
  console.log(`  ✓ Sales Assignments: ${dataset.salesAssignments.length}`);
  console.log(`    - Primary MR: ${dataset.salesAssignments.filter(a => a.assignment_type === 'PRIMARY_REP').length}`);
  console.log(`    - Personal MR: ${dataset.salesAssignments.filter(a => a.assignment_type === 'PERSONAL_MR').length}`);
  console.log(`  ✓ Organization Relationships: ${dataset.relationships.length}`);
  console.log(`  ✓ Precalculated Hierarchy Paths: ${dataset.hierarchyPaths.length}`);
  console.log(`  ✓ Backward-Compat Manager Rep Scopes: ${dataset.managerRepScopes.length}`);
  console.log(`  ✓ Backward-Compat Manager Area Scopes: ${dataset.managerAreaScopes.length}`);

  const sqlContent = generateOrganizationDataSql(dataset);
  const sqlOutPath = path.join(__dirname, 'migrations/step15b_organization_data.sql');
  fs.writeFileSync(sqlOutPath, sqlContent, 'utf8');
  console.log(`💾 Wrote migration data SQL to: ${sqlOutPath} (${sqlContent.length} bytes)`);
}
