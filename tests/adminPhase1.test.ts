import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertAdminActor, sanitizeAuditMetadata, selectEligibleDemoUsers } from '../src/lib/services/adminService';
import { generateSecureTemporaryPassword, hashPassword, verifyPassword } from '../src/lib/services/passwordService';
import { createCredentialCsv } from '../src/lib/adminCredentialCsv';
import { applyAdminPhase1Migration, assertAdminMigrationApproval, preflightAdminMigration, verifyAdminPhase1Migration } from '../src/lib/db/adminPhase1Migration';
import type { UserSessionPayload } from '../src/lib/auth';

async function main() {
const admin = { id:'admin-1', username:'SMD1', name:'Admin', role:'MANAGER', systemRole:'ADMIN', mustChangePassword:false } as UserSessionPayload;
assert.throws(() => assertAdminActor(null), /Authentication/);
assert.throws(() => assertAdminActor({ ...admin, role:'REPRESENTATIVE', systemRole:'REPRESENTATIVE' }), /Administrator/);
assert.throws(() => assertAdminActor({ ...admin, systemRole:'MANAGER' }), /Administrator/);
assert.throws(() => assertAdminActor({ ...admin, mustChangePassword:true }), /Password change/);
assert.doesNotThrow(() => assertAdminActor(admin));

const passwords = new Set(Array.from({ length: 40 }, () => generateSecureTemporaryPassword(16)));
assert.equal(passwords.size, 40, 'demo passwords must be unique');
const plaintext = [...passwords][0]; const hash = hashPassword(plaintext);
assert.notEqual(hash, plaintext); assert.equal(verifyPassword(plaintext, hash), true);

const eligible = selectEligibleDemoUsers([
  {id:'mr',isActive:true,positionCode:'MR',role:'REPRESENTATIVE',systemRole:'REPRESENTATIVE'},
  {id:'manager',isActive:true,positionCode:'DM',role:'MANAGER',systemRole:'MANAGER'},
  {id:'admin',isActive:true,positionCode:'SMD',role:'MANAGER',systemRole:'ADMIN'},
  {id:'inactive',isActive:false,positionCode:'MR',role:'REPRESENTATIVE',systemRole:'REPRESENTATIVE'},
], ['manager','inactive']);
assert.deepEqual(eligible.map((row) => row.id), ['manager'], 'only selected eligible active accounts are affected');

const csv = createCredentialCsv([{name:'Selected User',username:'MR1',position:'MR',temporaryPassword:'A,b"c',status:'Generated'}]);
assert.match(csv, /^Name,Username,Position,Temporary Password,Status/); assert.match(csv, /Selected User/); assert.equal(csv.includes('Other User'), false);
const metadata = sanitizeAuditMetadata({ username:'MR1', password:'no', passwordHash:'no', token:'no', reason:'demo' });
assert.equal(metadata.includes('password'), false); assert.equal(metadata.includes('token'), false); assert.match(metadata, /username/);

const executed:string[]=[]; const executor={execute:async(sql:string)=>{executed.push(sql);return sql.startsWith('SELECT name FROM sqlite_master')?[{name:'users'},{name:'sessions'}]:[];}};
assert.throws(()=>assertAdminMigrationApproval(undefined,false));
assert.doesNotThrow(()=>assertAdminMigrationApproval('https://gateway.example.test',true));
await preflightAdminMigration(executor); await applyAdminPhase1Migration(executor); await verifyAdminPhase1Migration(executor);
assert(executed.some(sql=>sql.includes('CREATE TABLE IF NOT EXISTS `admin_audit_events`'))); assert(executed.some(sql=>sql.includes('idx_admin_audit_target')));
assert(executed.some(sql=>sql.includes('trg_admin_audit_no_update'))); assert(executed.some(sql=>sql.includes('trg_admin_audit_no_delete')));

for (const path of ['overview','users','audit']) {
  const file = path === 'users' ? 'src/app/api/admin/users/route.ts' : `src/app/api/admin/${path}/route.ts`;
  assert.match(readFileSync(file,'utf8'), /requireAdmin\(\)/, `${file} must independently guard access`);
}
for (const page of ['src/app/admin/page.tsx','src/app/admin/users/page.tsx','src/app/admin/security/page.tsx','src/app/admin/audit/page.tsx']) assert.match(readFileSync(page,'utf8'), /requireAdminPage\(\)/);
const service = readFileSync('src/lib/services/adminService.ts','utf8');
assert.match(service,/target\.id === admin\.id/); assert.match(service,/last active administrator/i); assert.match(service,/db\.delete\(sessions\)/); assert.match(service,/adminAuditEvents/);
assert.match(service,/salesAssignments[\s\S]*\.catch\(\(\) => \[\]\)/,'user listing must survive legacy D1 without assignment enrichment');
assert.equal(/console\.(log|error).*temporaryPassword/.test(service),false,'plaintext credentials must not be logged');
const credentialRoute=readFileSync('src/app/api/admin/users/demo-passwords/route.ts','utf8'); assert.match(credentialRoute,/noStoreHeaders/); assert.match(credentialRoute,/assertAdminMutationRequest/);
const home=readFileSync('src/app/page.tsx','utf8');assert.doesNotMatch(home,/router\.push\('\/admin'\)/);assert.match(home,/setManagerView\(id as ManagerNavType\)/);
const manager=readFileSync('src/components/workspace/ManagerWorkspace.tsx','utf8');assert.match(manager,/systemRole === 'ADMIN'[\s\S]*<AdminWorkspace/);
const adminWorkspace=readFileSync('src/components/admin/AdminWorkspace.tsx','utf8');for(const component of ['AdminUsers','AdminSecurity','AdminOrganization','AdminAssignments'])assert.match(adminWorkspace,new RegExp(`<${component}`));
const legacyLayout=readFileSync('src/app/admin/layout.tsx','utf8');assert.match(legacyLayout,/redirect\('\/\?view=admin'\)/);
const securityUi=readFileSync('src/components/admin/AdminSecurity.tsx','utf8');assert.match(securityUi,/if\(!r\.ok\)throw new Error/,'demo-password UI must not silently map API errors to an empty list');
console.log('Admin Phase 1 authorization, credential, migration, audit, selection, CSV and route guard tests passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
