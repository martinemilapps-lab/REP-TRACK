import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { adminUserCreateSchema } from '../src/lib/adminSchemas';
import { swapRelationshipEndpoints, validateRelationshipGraph } from '../src/lib/services/adminCompanyService';
import { hierarchySwapSchema } from '../src/lib/adminPhase2Schemas';

const valid = adminUserCreateSchema.parse({ name: 'New User', positionCode: 'DM', username: 'dm99', managerUserId: 'manager-1' });
assert.equal(valid.username, 'DM99');
assert.throws(() => adminUserCreateSchema.parse({ name: 'New User', positionCode: 'DM', username: 'MR99', managerUserId: 'manager-1' }));
assert.throws(() => adminUserCreateSchema.parse({ name: 'New User', positionCode: 'MR', username: 'MR0', managerUserId: 'manager-1' }));

assert.doesNotThrow(() => validateRelationshipGraph([{ subordinateUserId: 'a', managerUserId: 'b' }], { subordinateUserId: 'c', managerUserId: 'a' }));
assert.throws(() => validateRelationshipGraph([{ subordinateUserId: 'a', managerUserId: 'b' }], { subordinateUserId: 'b', managerUserId: 'a' }));
assert.throws(() => validateRelationshipGraph([], { subordinateUserId: 'a', managerUserId: 'a' }));
assert.deepEqual(swapRelationshipEndpoints([
  { subordinateUserId: 'a', managerUserId: 'boss' },
  { subordinateUserId: 'report', managerUserId: 'b' },
  { subordinateUserId: 'b', managerUserId: 'a' },
], 'a', 'b'), [
  { subordinateUserId: 'b', managerUserId: 'boss' },
  { subordinateUserId: 'report', managerUserId: 'a' },
  { subordinateUserId: 'a', managerUserId: 'b' },
]);
assert.doesNotThrow(() => hierarchySwapSchema.parse({ firstUserId: 'a', secondUserId: 'b' }));
assert.throws(() => hierarchySwapSchema.parse({ firstUserId: 'a', secondUserId: 'a' }));

const userRoute = readFileSync('src/app/api/admin/users/route.ts', 'utf8');
const hierarchyRoute = readFileSync('src/app/api/admin/hierarchy/route.ts', 'utf8');
const service = readFileSync('src/lib/services/adminCompanyService.ts', 'utf8');
const createUi = readFileSync('src/components/admin/AdminCreateUser.tsx', 'utf8');
const hierarchyUi = readFileSync('src/components/admin/AdminOrganization.tsx', 'utf8');
assert.match(userRoute, /requireAdmin\(\)/);
assert.match(userRoute, /assertAdminMutationRequest/);
assert.match(userRoute, /adminUserCreateSchema\.parse/);
assert.match(service, /generateSecureTemporaryPassword/);
assert.match(service, /mustChangePassword:true/);
assert.match(service, /representatives\)\.values/);
assert.match(service, /rebuildHierarchyPaths\(\)/);
assert.match(service, /HIERARCHY_MANAGER_REPLACED/);
assert.match(service, /HIERARCHY_POSITIONS_SWAPPED/);
assert.match(hierarchyRoute, /export async function PUT/);
assert.match(hierarchyRoute, /export async function PATCH/);
assert.match(createUi, /Create and place in hierarchy/);
assert.match(hierarchyUi, /Save authority chain/);
assert.match(hierarchyUi, /Swap two hierarchy positions/);
console.log('Admin user creation and authority-chain regression checks passed');
