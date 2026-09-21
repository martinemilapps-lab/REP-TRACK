import { db, users, organizationRelationships, hierarchyPaths } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { rebuildHierarchyPaths } from '@/lib/services/adminCompanyService';
import { hierarchyService } from '@/lib/services/hierarchyService';

async function main() {
  console.log('--- LINKING MR36 TO DM6 ---');
  const [mrUser] = await db.select().from(users).where(eq(users.username, 'MR36'));
  const [dmUser] = await db.select().from(users).where(eq(users.username, 'DM6'));
  const [bumUser] = await db.select().from(users).where(eq(users.username, 'BUM2'));

  if (!mrUser || !dmUser || !bumUser) {
    throw new Error(`Could not find required users: MR36=${!!mrUser}, DM6=${!!dmUser}, BUM2=${!!bumUser}`);
  }

  console.log(`MR36 ID: ${mrUser.id}, repId: ${mrUser.repId}`);
  console.log(`DM6 ID: ${dmUser.id}`);
  console.log(`BUM2 ID: ${bumUser.id}`);

  // 1. Deactivate existing direct relationships for MR36
  await db
    .update(organizationRelationships)
    .set({ isActive: false })
    .where(and(eq(organizationRelationships.subordinateUserId, mrUser.id), eq(organizationRelationships.isActive, true)));

  // 2. Check if a relationship between MR36 and DM6 already exists
  const existingRel = await db
    .select()
    .from(organizationRelationships)
    .where(
      and(
        eq(organizationRelationships.subordinateUserId, mrUser.id),
        eq(organizationRelationships.managerUserId, dmUser.id),
      ),
    )
    .get();

  if (existingRel) {
    await db
      .update(organizationRelationships)
      .set({
        isActive: true,
        relationshipType: 'DIRECT',
        sourcePosition: 'MR',
        managerPosition: 'DM',
        sourceMetadata: JSON.stringify({ updatedBy: 'LINK_MR36_TO_DM6_SCRIPT' }),
      })
      .where(eq(organizationRelationships.id, existingRel.id));
    console.log(`Reactivated existing relationship ${existingRel.id}`);
  } else {
    const newId = crypto.randomUUID();
    await db.insert(organizationRelationships).values({
      id: newId,
      subordinateUserId: mrUser.id,
      managerUserId: dmUser.id,
      relationshipType: 'DIRECT',
      sourcePosition: 'MR',
      managerPosition: 'DM',
      isActive: true,
      sourceMetadata: JSON.stringify({ createdBy: 'LINK_MR36_TO_DM6_SCRIPT' }),
    });
    console.log(`Inserted new relationship ${newId}`);
  }

  // 3. Rebuild transitive closure hierarchy paths
  console.log('Rebuilding hierarchy paths...');
  const pathsCount = await rebuildHierarchyPaths();
  console.log(`Rebuilt ${pathsCount} hierarchy paths successfully.`);

  // 4. Verify scoped representatives for DM6 and BUM2
  console.log('\n--- VERIFYING SCOPES ---');
  const dmSession = {
    id: dmUser.id,
    username: dmUser.username,
    role: dmUser.role,
    positionCode: dmUser.positionCode,
    systemRole: dmUser.systemRole,
    repId: dmUser.repId,
    name: dmUser.name,
    businessLine: dmUser.businessLine,
    mustChangePassword: false,
  };

  const bumSession = {
    id: bumUser.id,
    username: bumUser.username,
    role: bumUser.role,
    positionCode: bumUser.positionCode,
    systemRole: bumUser.systemRole,
    repId: bumUser.repId,
    name: bumUser.name,
    businessLine: bumUser.businessLine,
    mustChangePassword: false,
  };

  const dmScopedReps = await hierarchyService.getScopedRepresentatives(dmSession);
  const bumScopedReps = await hierarchyService.getScopedRepresentatives(bumSession);

  console.log(`DM6 scoped reps count: ${dmScopedReps.length}`);
  console.log(`DM6 scoped reps:`, dmScopedReps.map((r) => `${r.name} (${r.id})`));
  const dmCanSeeMR36 = dmScopedReps.some((r) => r.id === mrUser.repId);
  console.log(`DM6 can see MR36: ${dmCanSeeMR36}`);

  console.log(`\nBUM2 scoped reps count: ${bumScopedReps.length}`);
  const bumCanSeeMR36 = bumScopedReps.some((r) => r.id === mrUser.repId);
  console.log(`BUM2 can see MR36: ${bumCanSeeMR36}`);

  if (!dmCanSeeMR36 || !bumCanSeeMR36) {
    throw new Error('Verification failed: MR36 is not visible to DM6 or BUM2');
  }

  console.log('\n✓ HIERARCHY LINKAGE COMPLETED AND VERIFIED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
