import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createCredentialCsv } from '../src/lib/adminCredentialCsv';

const reportKinds=['hospital','pharmacy','doctor','branch','availability','events','trainings','special-tasks'];
for(const kind of reportKinds){
  const route=readFileSync(`src/app/api/reports/${kind}/route.ts`,'utf8');
  assert.match(route,/requireAuthenticatedUser\(\)/,`${kind} route must reject anonymous requests`);
  assert.doesNotMatch(route,/getServerSession\(\)/,`${kind} route must not pass a nullable session to writes`);
}
for(const serviceName of ['hospital','pharmacy','doctor','branch','availability','event','training','specialTask']){
  const service=readFileSync(`src/lib/services/${serviceName}Service.ts`,'utf8');
  assert.match(service,/assertAuthenticatedSession\(session\)/,`${serviceName} enforces authentication in the service layer`);
  assert.match(service,/resolveWritableRepId\(session\)/,`${serviceName} applies the personal-sales-assignment write policy`);
  assert.doesNotMatch(service,/firstRep|\.limit\(1\)[\s\S]*representatives/,`${serviceName} has no first-representative identity fallback`);
  assert.doesNotMatch(service,/!repId\s*&&\s*input\.rep/,`${serviceName} does not accept client-authoritative representative identity`);
}
for(const serviceName of ['event','training','specialTask']){
  const service=readFileSync(`src/lib/services/${serviceName}Service.ts`,'utf8');
  assert.match(service,/hierarchyService\.getScopedRepIds\(session\)/,`${serviceName} manager reads use graph scope`);
  assert.match(service,/inArray\(/,`${serviceName} read query is restricted to authorized IDs`);
}
const weekly=readFileSync('src/lib/services/weeklyPlanService.ts','utf8');
assert.match(weekly,/hierarchyService\.assertRepVisible\(session, repId\)/,'manager weekly-plan writes verify hierarchy');
assert.match(weekly,/hierarchyService\.assertRepVisible\(session, targetRepId\)/,'manager weekly-plan reads verify hierarchy');
assert.match(weekly,/existing\.userId !== session\.id/,'personal manager-plan mutations reject non-owners');
const login=readFileSync('src/app/api/auth/login/route.ts','utf8');
assert.doesNotMatch(login,/Manager Password Direct Entry|managerUser/,'username-less legacy manager login is removed');
assert.match(login,/اسم المستخدم أو كلمة السر غير صحيحة/);
const changePassword=readFileSync('src/app/api/auth/change-password/route.ts','utf8');
assert.match(changePassword,/db\.delete\(sessions\)\.where\(eq\(sessions\.userId, userRecord\.id\)\)/,'password change revokes every old session');
assert.match(changePassword,/createDbSession\(userRecord\.id\)/,'password change creates a fresh authenticated session');
assert.match(changePassword,/setSessionCookie\(response, newSessionToken\)/,'password change replaces the browser session cookie');
const provision=readFileSync('scripts/provision_dev_organization.js','utf8');
assert.match(provision,/randomBytes\(18\)/,'provisioned credentials are random');
assert.doesNotMatch(provision,/RepTrack2026/);
const seed=readFileSync('src/lib/db/seed.ts','utf8');
assert.match(seed,/MANAGER_DEFAULT_PASSWORD is required/);
assert.doesNotMatch(seed,/22515215monna|rep123456/);
assert.equal(existsSync('scripts/provision_dev_organization.sql'),false,'predictable generated credential hashes are not committed');
const csv=createCredentialCsv([{name:'=WEBSERVICE("x")',username:'@user',position:'-MR',temporaryPassword:'+secret',status:'Generated'}]);
for(const dangerous of ['"=','"@','"-','"+'])assert.doesNotMatch(csv,new RegExp(dangerous.replace(/[+]/g,'\\+')),'CSV formula prefix is neutralized');
assert.match(csv,/"'=WEBSERVICE/);
console.log('Final QA authorization, hierarchy, login, and credential-provisioning regressions passed');
