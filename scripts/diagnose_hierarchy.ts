import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', quiet: true });
import { client, db, users, representatives, organizationRelationships, hierarchyPaths, managerRepScopes, positions } from '../src/lib/db';
import { hierarchyService } from '../src/lib/services/hierarchyService';
import type { UserSessionPayload } from '../src/lib/auth';

async function main() {
  console.log('=== 1. POSITIONS IN D1 ===');
  const posList = await client.execute('SELECT code, title_en, title_ar, hierarchy_level FROM positions ORDER BY hierarchy_level ASC');
  console.log(posList);

  console.log('\n=== 2. USERS IN D1 ===');
  const userList = await client.execute('SELECT id, name, username, position_code, role, system_role, rep_id, is_active FROM users ORDER BY position_code, name') as any[];
  console.log(`Total users: ${userList.length}`);
  for (const u of userList) {
    console.log(`${u.name.padEnd(25)} | pos: ${(u.position_code || '-').padEnd(5)} | role: ${(u.role || '-').padEnd(14)} | sys: ${(u.system_role || '-').padEnd(6)} | repId: ${u.rep_id || 'null'}`);
  }

  console.log('\n=== 3. ACTIVE RELATIONSHIPS IN D1 ===');
  const rels = await client.execute(`
    SELECT r.id, su.name as subordinate, mu.name as manager, r.source_position, r.manager_position, r.relationship_type, r.is_active
    FROM organization_relationships r
    JOIN users su ON su.id = r.subordinate_user_id
    JOIN users mu ON mu.id = r.manager_user_id
    WHERE r.is_active = 1
    ORDER BY mu.name, su.name
  `) as any[];
  console.log(`Total active relationships: ${rels.length}`);
  for (const r of rels) {
    console.log(`  ${r.manager.padEnd(20)} -> ${r.subordinate.padEnd(22)} (${r.manager_position} -> ${r.source_position}) [${r.relationship_type}]`);
  }

  console.log('\n=== 4. HIERARCHY PATHS IN D1 ===');
  const pathCount = await client.execute('SELECT count(*) as count FROM hierarchy_paths');
  console.log('Hierarchy paths count:', pathCount[0]?.count);

  console.log('\n=== 5. MANAGER REP SCOPES IN D1 ===');
  const scopeCount = await client.execute('SELECT count(*) as count FROM manager_rep_scopes');
  console.log('Manager rep scopes count:', scopeCount[0]?.count);
  const scopes = await client.execute(`
    SELECT mu.name as manager, count(s.rep_id) as scoped_rep_count
    FROM manager_rep_scopes s
    JOIN users mu ON mu.id = s.manager_user_id
    GROUP BY mu.name
  `) as any[];
  console.log('Scopes by manager:', scopes);

  console.log('\n=== 6. TEST HIERARCHY SERVICE SCOPES FOR EACH MANAGER ===');
  const managers = userList.filter(u => u.role === 'MANAGER' || u.position_code !== 'MR');
  for (const mgr of managers) {
    const mockSession: UserSessionPayload = {
      id: mgr.id,
      username: mgr.username,
      name: mgr.name,
      role: mgr.role,
      systemRole: mgr.system_role,
      positionCode: mgr.position_code,
      repId: mgr.rep_id,
      isActive: true,
      mustChangePassword: false,
    };
    try {
      const descendants = await hierarchyService.getScopedUserIds(mockSession, 'ALL_DESCENDANTS');
      const direct = await hierarchyService.getScopedUserIds(mockSession, 'DIRECT_REPORTS');
      const scopedReps = await hierarchyService.getScopedRepresentatives(mockSession, 'ALL_DESCENDANTS');
      const repNames = scopedReps.map(r => r.name);
      console.log(`\nManager: ${mgr.name} (${mgr.position_code}) [systemRole: ${mgr.system_role || 'none'}]`);
      console.log(`  Descendant user count: ${descendants.length}, Direct reports: ${direct.length}`);
      console.log(`  Scoped reps count: ${scopedReps.length}`);
      console.log(`  Scoped reps: ${repNames.slice(0, 10).join(', ')}${repNames.length > 10 ? ' ... and more' : ''}`);
    } catch (e: any) {
      console.log(`Manager: ${mgr.name} ERROR: ${e.message}`);
    }
  }

  console.log('\n=== 7. REPRESENTATIVES IN D1 ===');
  const reps = await client.execute('SELECT id, name, area, is_active FROM representatives ORDER BY name') as any[];
  console.log(`Total representatives: ${reps.length}`);
  for (const r of reps) {
    const linkedUser = userList.find(u => u.rep_id === r.id);
    console.log(`  ${r.name.padEnd(25)} | area: ${(r.area || '-').padEnd(25)} | linkedUser: ${linkedUser ? `${linkedUser.name} (${linkedUser.username})` : 'NONE'}`);
  }
}

main().catch(console.error);
