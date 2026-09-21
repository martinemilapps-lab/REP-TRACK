import { db, users, organizationRelationships, hierarchyPaths, managerRepScopes } from '@/lib/db';
import { inArray, eq } from 'drizzle-orm';
import { hierarchyService } from '@/lib/services/hierarchyService';

async function main() {
  const usernames = ['MR36', 'DM6', 'BUM2'];
  const foundUsers = await db.select().from(users).where(inArray(users.username, usernames));
  const userMap = new Map(foundUsers.map(u => [u.id, u.username]));

  console.log('--- FOUND USERS ---');
  for (const u of foundUsers) {
    console.log(`${u.username} (${u.positionCode}) - ID: ${u.id}, RepID: ${u.repId}`);
  }

  console.log('\n--- ORGANIZATION RELATIONSHIPS ---');
  const orgRels = await db.select().from(organizationRelationships);
  for (const r of orgRels) {
    if (userMap.has(r.subordinateUserId) || userMap.has(r.managerUserId)) {
      console.log(`${userMap.get(r.subordinateUserId) || r.subordinateUserId} -> Managed by -> ${userMap.get(r.managerUserId) || r.managerUserId} [type: ${r.relationshipType}, active: ${r.isActive}]`);
    }
  }

  console.log('\n--- HIERARCHY PATHS ---');
  const paths = await db.select().from(hierarchyPaths);
  for (const p of paths) {
    if (userMap.has(p.sourceUserId) || userMap.has(p.ancestorUserId)) {
      console.log(`Path: ${userMap.get(p.sourceUserId) || p.sourceUserId} --[depth: ${p.depth}]--> ${userMap.get(p.ancestorUserId) || p.ancestorUserId} (${p.ancestorPosition})`);
    }
  }

  console.log('\n--- HIERARCHY SERVICE SCOPES ---');
  for (const u of foundUsers) {
    const session = {
      id: u.id,
      username: u.username,
      role: u.role,
      positionCode: u.positionCode,
      systemRole: u.systemRole,
      repId: u.repId,
      name: u.name,
      businessLine: u.businessLine,
      mustChangePassword: false,
    };
    try {
      const subordinates = await hierarchyService.getSubordinates(u.id);
      const visibleReps = await hierarchyService.getVisibleRepresentatives(session);
      console.log(`User ${u.username} (${u.positionCode}):`);
      console.log(`  Subordinates count: ${subordinates.length} (${subordinates.map(s => s.username).slice(0, 10).join(', ')}${subordinates.length > 10 ? '...' : ''})`);
      console.log(`  Visible Reps count: ${visibleReps.length} (${visibleReps.map(r => r.name).slice(0, 5).join(', ')}${visibleReps.length > 5 ? '...' : ''})`);
      const canSeeMR36 = visibleReps.some(r => r.id === 'rep-mr36');
      console.log(`  Can see MR36 (rep-mr36): ${canSeeMR36}`);
    } catch (e: any) {
      console.error(`  Error calculating hierarchy for ${u.username}:`, e.message);
    }
  }
}

main().catch(console.error);
