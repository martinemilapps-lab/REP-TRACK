import * as fs from 'fs';
import * as path from 'path';
import { buildOrganizationDataset } from './provision_organization_foundation';
import { computeTransitiveClosure, validateHierarchyAcyclicity } from '../src/lib/services/organizationService';

async function generateResetSql() {
  console.log('=== PREPARING AUTHORITATIVE DATABASE RESET ===\n');

  const rootDir = path.resolve(__dirname, '..');
  const backupContent = fs.readFileSync(path.join(rootDir, 'd1_backup.sql'), 'utf8');
  const backupLines = backupContent.split('\n');

  // 1. Build authoritative foundation dataset
  const dataset = buildOrganizationDataset();

  // Adjust MR36 linkage: MR36 (Ahmed El Kot, u-mr36) -> DM6 (Ashraf Shawky, u-dm6) -> BUM2 (Osama Bert, u-bum2) -> SMD1 (Maged Raouf, u-smd1)
  const relationships = dataset.relationships.filter(r => {
    // Remove any old/conflicting relationship for MR36
    if (r.subordinate_user_id === 'u-mr36') return false;
    return true;
  });

  // Add the explicit authoritative relationship for MR36 -> DM6
  relationships.push({
    id: 'rel-mr36-dm6',
    subordinate_user_id: 'u-mr36',
    manager_user_id: 'u-dm6',
    relationship_type: 'DIRECT',
    source_position: 'MR',
    manager_position: 'DM',
    subordinate_assignment_id: 'sa-mr36',
    source_metadata: JSON.stringify({ path: 'MR->DM (Authoritative)', territory: 'Behira/Kafr el shiekh' }),
  });

  // Verify acyclicity
  const acyclicCheck = validateHierarchyAcyclicity(
    relationships.map(r => ({ subordinateUserId: r.subordinate_user_id, managerUserId: r.manager_user_id }))
  );
  if (!acyclicCheck.isValid) {
    throw new Error(`Hierarchy cycle detected: ${acyclicCheck.cyclePath?.join(' -> ')}`);
  }
  console.log('✓ Organization relationship graph is strictly acyclic (DAG).');

  // Compute transitive closure paths
  const userPositions = new Map(dataset.users.map(u => [u.id, u.position_code]));
  const assignmentsByUser = new Map<string, Array<{ id: string }>>();
  for (const assign of dataset.salesAssignments) {
    if (!assignmentsByUser.has(assign.user_id)) assignmentsByUser.set(assign.user_id, []);
    assignmentsByUser.get(assign.user_id)!.push({ id: assign.id });
  }

  const paths = computeTransitiveClosure(
    relationships.map(r => ({
      subordinateUserId: r.subordinate_user_id,
      managerUserId: r.manager_user_id,
      managerPosition: r.manager_position,
      subordinateAssignmentId: r.subordinate_assignment_id,
    })),
    userPositions,
    assignmentsByUser
  );
  console.log(`✓ Computed ${paths.length} transitive closure hierarchy paths.`);

  // Compute manager rep scopes
  // For each manager, all descendant reps
  const managerRepScopes: Array<{ id: string; manager_user_id: string; rep_id: string }> = [];
  const repByUser = new Map(dataset.users.filter(u => u.rep_id).map(u => [u.id, u.rep_id!]));
  const scopeSet = new Set<string>();

  for (const p of paths) {
    const repId = repByUser.get(p.sourceUserId);
    if (repId) {
      const key = `${p.ancestorUserId}:${repId}`;
      if (!scopeSet.has(key)) {
        scopeSet.add(key);
        managerRepScopes.push({
          id: `mrs-${scopeSet.size}`,
          manager_user_id: p.ancestorUserId,
          rep_id: repId,
        });
      }
    }
  }
  console.log(`✓ Computed ${managerRepScopes.length} manager_rep_scopes.`);

  // Compute manager area scopes
  const managerAreaScopes: Array<{ id: string; manager_user_id: string; area_id: string }> = [];
  const areaByUser = new Map(dataset.salesAssignments.filter(a => a.area_id).map(a => [a.user_id, a.area_id!]));
  const areaScopeSet = new Set<string>();

  for (const p of paths) {
    const areaId = areaByUser.get(p.sourceUserId);
    if (areaId) {
      const key = `${p.ancestorUserId}:${areaId}`;
      if (!areaScopeSet.has(key)) {
        areaScopeSet.add(key);
        managerAreaScopes.push({
          id: `mas-${areaScopeSet.size}`,
          manager_user_id: p.ancestorUserId,
          area_id: areaId,
        });
      }
    }
  }
  console.log(`✓ Computed ${managerAreaScopes.length} manager_area_scopes.`);

  // 2. Extract Fawzy Nasser ({MR11}) data lines from backup
  console.log('\n--- Extracting Fawzy Nasser ({MR11}) data from backup ---');
  const fawzyInserts: string[] = [];
  const fawzyCounts: Record<string, number> = {};

  const fawzyTables = [
    'doctors',
    'pharmacies',
    'hospitals',
    'distribution_branches',
    'doctor_visits',
    'pharmacy_visits',
    'hospital_visits',
    'hospital_visit_departments',
    'hospital_visit_department_doctors',
    'doctor_visit_products',
    'weekly_plans',
    'daily_reports',
  ];

  // We need all visit IDs for Fawzy's hospital visits and doctor visits
  const fawzyHospVisitIds = new Set<string>();
  const fawzyDrVisitIds = new Set<string>();
  const fawzyHospDeptIds = new Set<string>();

  for (const line of backupLines) {
    if (line.includes('rep-mr11')) {
      if (line.startsWith('INSERT INTO "hospital_visits"') || line.startsWith('INSERT INTO `hospital_visits`')) {
        const idMatch = line.match(/VALUES\('([^']+)'/i);
        if (idMatch) fawzyHospVisitIds.add(idMatch[1]);
      }
      if (line.startsWith('INSERT INTO "doctor_visits"') || line.startsWith('INSERT INTO `doctor_visits`')) {
        const idMatch = line.match(/VALUES\('([^']+)'/i);
        if (idMatch) fawzyDrVisitIds.add(idMatch[1]);
      }
    }
  }

  // Find department IDs for Fawzy's hospital visits
  for (const line of backupLines) {
    if (line.startsWith('INSERT INTO "hospital_visit_departments"') || line.startsWith('INSERT INTO `hospital_visit_departments`')) {
      for (const vId of fawzyHospVisitIds) {
        if (line.includes(`'${vId}'`)) {
          const idMatch = line.match(/VALUES\('([^']+)'/i);
          if (idMatch) fawzyHospDeptIds.add(idMatch[1]);
        }
      }
    }
  }

  // Extract Fawzy rows
  for (const line of backupLines) {
    let keep = false;
    let tbl = '';

    if (line.startsWith('INSERT INTO "doctors"') || line.startsWith('INSERT INTO `doctors`')) {
      tbl = 'doctors';
      if (line.includes('rep-mr11')) keep = true;
    } else if (line.startsWith('INSERT INTO "pharmacies"') || line.startsWith('INSERT INTO `pharmacies`')) {
      tbl = 'pharmacies';
      if (line.includes('rep-mr11')) keep = true;
    } else if (line.startsWith('INSERT INTO "hospitals"') || line.startsWith('INSERT INTO `hospitals`')) {
      tbl = 'hospitals';
      if (line.includes('rep-mr11')) keep = true;
    } else if (line.startsWith('INSERT INTO "distribution_branches"') || line.startsWith('INSERT INTO `distribution_branches`')) {
      tbl = 'distribution_branches';
      if (line.includes('rep-mr11')) keep = true;
    } else if (line.startsWith('INSERT INTO "doctor_visits"') || line.startsWith('INSERT INTO `doctor_visits`')) {
      tbl = 'doctor_visits';
      if (line.includes('rep-mr11')) keep = true;
    } else if (line.startsWith('INSERT INTO "pharmacy_visits"') || line.startsWith('INSERT INTO `pharmacy_visits`')) {
      tbl = 'pharmacy_visits';
      if (line.includes('rep-mr11')) keep = true;
    } else if (line.startsWith('INSERT INTO "hospital_visits"') || line.startsWith('INSERT INTO `hospital_visits`')) {
      tbl = 'hospital_visits';
      if (line.includes('rep-mr11')) keep = true;
    } else if (line.startsWith('INSERT INTO "weekly_plans"') || line.startsWith('INSERT INTO `weekly_plans`')) {
      tbl = 'weekly_plans';
      if (line.includes('rep-mr11')) keep = true;
    } else if (line.startsWith('INSERT INTO "daily_reports"') || line.startsWith('INSERT INTO `daily_reports`')) {
      tbl = 'daily_reports';
      if (line.includes('rep-mr11')) keep = true;
    } else if (line.startsWith('INSERT INTO "hospital_visit_departments"') || line.startsWith('INSERT INTO `hospital_visit_departments`')) {
      tbl = 'hospital_visit_departments';
      for (const vId of fawzyHospVisitIds) {
        if (line.includes(`'${vId}'`)) { keep = true; break; }
      }
    } else if (line.startsWith('INSERT INTO "hospital_visit_department_doctors"') || line.startsWith('INSERT INTO `hospital_visit_department_doctors`')) {
      tbl = 'hospital_visit_department_doctors';
      for (const deptId of fawzyHospDeptIds) {
        if (line.includes(`'${deptId}'`)) { keep = true; break; }
      }
    } else if (line.startsWith('INSERT INTO "doctor_visit_products"') || line.startsWith('INSERT INTO `doctor_visit_products`')) {
      tbl = 'doctor_visit_products';
      for (const vId of fawzyDrVisitIds) {
        if (line.includes(`'${vId}'`)) { keep = true; break; }
      }
    }

    if (keep) {
      fawzyInserts.push(line);
      fawzyCounts[tbl] = (fawzyCounts[tbl] || 0) + 1;
    }
  }

  console.log('Fawzy Nasser preserved counts:');
  console.table(fawzyCounts);

  // Assert expected counts for Fawzy
  if (fawzyCounts['doctors'] !== 80) throw new Error(`Expected 80 doctors for Fawzy, found ${fawzyCounts['doctors']}`);
  if (fawzyCounts['pharmacies'] !== 19) throw new Error(`Expected 19 pharmacies for Fawzy, found ${fawzyCounts['pharmacies']}`);
  if (fawzyCounts['hospitals'] !== 43) throw new Error(`Expected 43 hospitals for Fawzy, found ${fawzyCounts['hospitals']}`);
  if (fawzyCounts['distribution_branches'] !== 3) throw new Error(`Expected 3 branches for Fawzy, found ${fawzyCounts['distribution_branches']}`);
  if (fawzyCounts['doctor_visits'] !== 25) throw new Error(`Expected 25 doctor visits for Fawzy, found ${fawzyCounts['doctor_visits']}`);
  if (fawzyCounts['pharmacy_visits'] !== 15) throw new Error(`Expected 15 pharmacy visits for Fawzy, found ${fawzyCounts['pharmacy_visits']}`);
  if (fawzyCounts['hospital_visits'] !== 22) throw new Error(`Expected 22 hospital visits for Fawzy, found ${fawzyCounts['hospital_visits']}`);
  if (fawzyCounts['weekly_plans'] !== 3) throw new Error(`Expected 3 weekly plans for Fawzy, found ${fawzyCounts['weekly_plans']}`);
  if (fawzyCounts['daily_reports'] !== 22) throw new Error(`Expected 22 daily reports for Fawzy, found ${fawzyCounts['daily_reports']}`);

  // 3. Extract products and visit objectives from backup
  const productInserts = backupLines.filter(l => l.startsWith('INSERT INTO "products"') || l.startsWith('INSERT INTO `products`'));
  const objectiveInserts = backupLines.filter(l => l.startsWith('INSERT INTO "visit_objectives"') || l.startsWith('INSERT INTO `visit_objectives`'));

  // 4. Assemble the complete reset SQL
  const sql: string[] = [];

  sql.push('-- ==============================================================================');
  sql.push('-- REP TRACK — COMPLETE SYSTEM RESET & RESTORATION');
  sql.push('-- Authoritative Hierarchy, Synchronized Linking Titles, Pure Fawzy Nasser Data');
  sql.push('-- ==============================================================================');

  // Clean all dynamic data tables
  const tablesToClear = [
    'doctor_visit_products',
    'hospital_visit_department_doctors',
    'hospital_visit_departments',
    'hospital_visit_doctors',
    'hospital_visits',
    'doctor_visits',
    'pharmacy_visits',
    'branch_visits',
    'branch_visit_products',
    'weekly_plans',
    'manager_weekly_plans',
    'daily_reports',
    'manager_activity_extended_entries',
    'manager_activity_products',
    'manager_activity_entry_doctors',
    'manager_activity_entries',
    'manager_activities',
    'product_availabilities',
    'trainings',
    'special_tasks',
    'events',
    'representative_visit_rates',
    'sessions',
    'login_attempts',
    'admin_audit_events',
    'doctor_nearby_pharmacies',
    'doctor_working_hospitals',
    'hierarchy_paths',
    'manager_rep_scopes',
    'manager_area_scopes',
    'organization_relationships',
    'sales_assignments',
    'doctors',
    'pharmacies',
    'hospitals',
    'distribution_branches',
    'representatives',
    'users',
    'areas',
    'positions',
  ];

  for (const tbl of tablesToClear) {
    sql.push(`DELETE FROM \`${tbl}\`;`);
  }

  // Insert Positions
  sql.push('\n-- 1. POSITIONS');
  for (const p of dataset.positions) {
    sql.push(`INSERT INTO \`positions\` (\`code\`, \`title_en\`, \`title_ar\`, \`hierarchy_level\`) VALUES ('${p.code}', '${p.title_en}', '${p.title_ar}', ${p.hierarchy_level});`);
  }

  // Insert Areas
  sql.push('\n-- 2. AREAS');
  for (const a of dataset.areas) {
    sql.push(`INSERT INTO \`areas\` (\`id\`, \`name\`, \`is_active\`) VALUES ('${a.id}', '${a.name.replace(/'/g, "''")}', 1);`);
  }

  // Password hashes mapping for the tested credentials
  // MR36: 12345@54321As -> $2b$10$Xc4ej9ZVPhbd/lBSqr59MeXtOxg0DovHvD70Qmy0z.BUJv7a/lJLm
  // BUM2: 12345@54321As -> $2b$10$WsicY5G9c6H1pUF88G6QG.4K4Bhr5IV3aG8erg2t2SR9QYEoo0ze2
  // DM6:  12345@54321As -> $2b$10$qalnW8IPm7yKuaKJaTSI7.S7UpxpkjXWiIt8D7cZy6D9iltMUDPBO
  // PM1:  22515215@Monna -> $2b$10$wKy6juJdiZLY3p6Z7vkH..p3.ztzjYVME1W4uMXGVNFwOoB0h7.oe
  // Fawzy Nasser (MR11): preserve hash from backup
  let fawzyPasswordHash = '$2b$10$EJo/gjfAaDr7GZwVOaFGDuMCl6ZHNk2RD9O4qOy3MhNMQc485gaOm';
  const fawzyUserLine = backupLines.find(l => l.includes("'MR11'") && (l.startsWith('INSERT INTO "users"') || l.startsWith('INSERT INTO `users`')));
  if (fawzyUserLine) {
    const hashMatch = fawzyUserLine.match(/\$2b\$10\$[A-Za-z0-9./]{53}/);
    if (hashMatch) fawzyPasswordHash = hashMatch[0];
  }

  const explicitHashes: Record<string, string> = {
    'MR36': '$2b$10$Xc4ej9ZVPhbd/lBSqr59MeXtOxg0DovHvD70Qmy0z.BUJv7a/lJLm',
    'BUM2': '$2b$10$WsicY5G9c6H1pUF88G6QG.4K4Bhr5IV3aG8erg2t2SR9QYEoo0ze2',
    'DM6':  '$2b$10$qalnW8IPm7yKuaKJaTSI7.S7UpxpkjXWiIt8D7cZy6D9iltMUDPBO',
    'PM1':  '$2b$10$wKy6juJdiZLY3p6Z7vkH..p3.ztzjYVME1W4uMXGVNFwOoB0h7.oe',
    'MR11': fawzyPasswordHash,
  };

  // Insert Representatives
  sql.push('\n-- 3. REPRESENTATIVES');
  const canonicalReps = dataset.users.filter(u => u.rep_id).map(u => {
    const assign = dataset.salesAssignments.find(a => a.user_id === u.id && a.assignment_type === 'PRIMARY_REP');
    return {
      id: u.rep_id!,
      name: u.name,
      area: assign?.territory_name || 'Unassigned',
      isActive: 1,
    };
  });
  for (const r of canonicalReps) {
    sql.push(`INSERT INTO \`representatives\` (\`id\`, \`name\`, \`area\`, \`assigned_hospitals\`, \`assigned_pharmacies\`, \`assigned_drs\`, \`is_active\`) VALUES ('${r.id}', '${r.name.replace(/'/g, "''")}', '${r.area.replace(/'/g, "''")}', 0, 0, 0, 1);`);
  }

  // Insert Users
  sql.push('\n-- 4. USERS (63 Canonical Personnel)');
  for (const u of dataset.users) {
    const hash = explicitHashes[u.username] || '$2b$10$Xc4ej9ZVPhbd/lBSqr59MeXtOxg0DovHvD70Qmy0z.BUJv7a/lJLm'; // Default working test password
    const repIdVal = u.rep_id ? `'${u.rep_id}'` : 'NULL';
    const lineVal = u.business_line !== null ? u.business_line : 'NULL';
    const legacyVal = u.legacy_title_raw ? `'${u.legacy_title_raw}'` : 'NULL';
    sql.push(`INSERT INTO \`users\` (\`id\`, \`username\`, \`password_hash\`, \`name\`, \`role\`, \`rep_id\`, \`position_code\`, \`system_role\`, \`legacy_title_raw\`, \`business_line\`, \`username_number\`, \`must_change_password\`, \`is_active\`) VALUES ('${u.id}', '${u.username}', '${hash}', '${u.name.replace(/'/g, "''")}', '${u.role}', ${repIdVal}, '${u.position_code}', '${u.system_role}', ${legacyVal}, ${lineVal}, ${u.username_number}, 0, 1);`);
  }

  // Insert Sales Assignments
  sql.push('\n-- 5. SALES ASSIGNMENTS');
  for (const a of dataset.salesAssignments) {
    const areaIdVal = a.area_id ? `'${a.area_id}'` : 'NULL';
    const repIdVal = a.rep_id ? `'${a.rep_id}'` : 'NULL';
    const lineVal = a.business_line !== null ? a.business_line : 'NULL';
    sql.push(`INSERT INTO \`sales_assignments\` (\`id\`, \`user_id\`, \`assignment_type\`, \`title_raw\`, \`business_line\`, \`area_id\`, \`territory_name\`, \`rep_id\`, \`source_row\`, \`is_active\`) VALUES ('${a.id}', '${a.user_id}', '${a.assignment_type}', '${a.title_raw}', ${lineVal}, ${areaIdVal}, '${a.territory_name.replace(/'/g, "''")}', ${repIdVal}, ${a.source_row}, 1);`);
  }

  // Insert Organization Relationships
  sql.push('\n-- 6. ORGANIZATION RELATIONSHIPS (All Active, Strictly Acyclic)');
  for (const r of relationships) {
    const assignVal = r.subordinate_assignment_id ? `'${r.subordinate_assignment_id}'` : 'NULL';
    const metaVal = `'${r.source_metadata.replace(/'/g, "''")}'`;
    sql.push(`INSERT INTO \`organization_relationships\` (\`id\`, \`subordinate_user_id\`, \`manager_user_id\`, \`relationship_type\`, \`source_position\`, \`manager_position\`, \`subordinate_assignment_id\`, \`is_active\`, \`source_metadata\`) VALUES ('${r.id}', '${r.subordinate_user_id}', '${r.manager_user_id}', '${r.relationship_type}', '${r.source_position}', '${r.manager_position}', ${assignVal}, 1, ${metaVal});`);
  }

  // Insert Hierarchy Paths
  sql.push('\n-- 7. HIERARCHY PATHS (Transitive Closure)');
  for (const p of paths) {
    const assignVal = p.sourceAssignmentId ? `'${p.sourceAssignmentId}'` : 'NULL';
    sql.push(`INSERT INTO \`hierarchy_paths\` (\`id\`, \`source_assignment_id\`, \`source_user_id\`, \`ancestor_user_id\`, \`ancestor_position\`, \`depth\`) VALUES ('${p.id}', ${assignVal}, '${p.sourceUserId}', '${p.ancestorUserId}', '${p.ancestorPosition}', ${p.depth});`);
  }

  // Insert Manager Rep Scopes
  sql.push('\n-- 8. MANAGER REP SCOPES');
  for (const mrs of managerRepScopes) {
    sql.push(`INSERT INTO \`manager_rep_scopes\` (\`id\`, \`manager_user_id\`, \`rep_id\`) VALUES ('${mrs.id}', '${mrs.manager_user_id}', '${mrs.rep_id}');`);
  }

  // Insert Manager Area Scopes
  sql.push('\n-- 9. MANAGER AREA SCOPES');
  for (const mas of managerAreaScopes) {
    sql.push(`INSERT INTO \`manager_area_scopes\` (\`id\`, \`manager_user_id\`, \`area_id\`) VALUES ('${mas.id}', '${mas.manager_user_id}', '${mas.area_id}');`);
  }

  // Insert Products & Objectives
  sql.push('\n-- 10. PRODUCTS');
  for (const p of productInserts) sql.push(p);

  sql.push('\n-- 11. VISIT OBJECTIVES');
  for (const o of objectiveInserts) sql.push(o);

  // Insert Fawzy Nasser Data
  sql.push('\n-- 12. FAWZY NASSER ({MR11}) PRESERVED DATA');
  for (const f of fawzyInserts) sql.push(f);


  const finalSql = sql.join('\n');
  const outPath = path.join(rootDir, 'scripts/system_reset.sql');
  fs.writeFileSync(outPath, finalSql, 'utf8');
  console.log(`\n✓ Generated authoritative reset SQL: ${outPath} (${finalSql.length} bytes, ${sql.length} statements).`);
}

generateResetSql().catch(console.error);
