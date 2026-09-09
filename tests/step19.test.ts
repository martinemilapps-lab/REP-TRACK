import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { SQL } from 'drizzle-orm';
import { getTableConfig, SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';
import { NextRequest } from 'next/server';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { dataGatewayClient } from '../src/lib/dataGatewayClient';
import { db, users, sessions, salesAssignments, representatives, weeklyPlans, organizationRelationships } from '../src/lib/db';
import type { UserSessionPayload } from '../src/lib/auth';
import { AppError } from '../src/lib/errors';
import { applyStep19Migration, assertExplicitMigrationTarget } from '../src/lib/db/step19Migration';
import { ManagerActivitySchema, WeeklyPlanSchema } from '../src/lib/validation';
import { saveManagerActivity, getManagerActivities, getManagerActivityById, deleteManagerActivity } from '../src/lib/services/managerActivityService';
import { saveWeeklyPlan, getWeeklyPlans, getWeeklyPlanById, deleteWeeklyPlan, updateWeeklyPlanStatus } from '../src/lib/services/weeklyPlanService';
import * as activitiesRoute from '../src/app/api/manager/activities/route';
import * as activityRoute from '../src/app/api/manager/activities/[id]/route';
import * as reportsRoute from '../src/app/api/reports/route';
import { hospitals, pharmacies, doctors, distributionBranches, hospitalVisits, pharmacyVisits, doctorVisits, branchVisits, productAvailabilities, products, events, trainings, specialTasks } from '../src/lib/db';
import * as plansRoute from '../src/app/api/weekly-plans/route';
import * as planRoute from '../src/app/api/weekly-plans/[id]/route';
import * as exportRoute from '../src/app/api/weekly-plans/[id]/export/route';
import { WeeklyPlanView } from '../src/components/weekly-plan/WeeklyPlanView';
import { I18nProvider } from '../src/lib/i18nContext';
import { runWeeklyPlanTests } from './weeklyPlan.test';

// No dotenv. Never connect to the configured gateway, even if the developer has credentials.
// The app retains Node 20 typings; this isolated runner requires Node 24's built-in SQLite.
const requireModule = createRequire(`${process.cwd()}/package.json`);
interface FixtureDatabase {
  exec(sql: string): void;
  close(): void;
  prepare(sql: string): {
    run(...params: (string | number | null)[]): unknown;
    get(...params: (string | number | null)[]): unknown;
    all(...params: (string | number | null)[]): unknown[];
    setReturnArrays(enabled: boolean): void;
  };
}
const { DatabaseSync } = requireModule('node:sqlite') as { DatabaseSync: new (path: string) => FixtureDatabase };
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error('Network is forbidden in STEP 19 tests'); };
const sqlite = new DatabaseSync(':memory:');
const originalProxy = dataGatewayClient.executeDrizzleProxy;
const originalBatch = dataGatewayClient.executeDrizzleProxyBatch;
const originalQuery = dataGatewayClient.query;
dataGatewayClient.executeDrizzleProxy = async (sql, params, method) => {
  const stmt = sqlite.prepare(sql);
  const bound = params as (string | number | null)[];
  if (method === 'run') { stmt.run(...bound); return { rows: [] }; }
  stmt.setReturnArrays(true);
  return { rows: method === 'get' ? stmt.get(...bound) : stmt.all(...bound) };
};
dataGatewayClient.executeDrizzleProxyBatch = async () => { throw new Error('Unexpected batch'); };
dataGatewayClient.query = async () => { throw new Error('Unexpected gateway query'); };

// Stub only the framework cookie boundary. Routes still execute the real session SQL and guards.
const headers = requireModule('next/headers') as { cookies: () => Promise<unknown> };
const originalCookies = headers.cookies;
let cookieToken: string | null = null;
headers.cookies = async () => ({ get: () => cookieToken ? { value: cookieToken } : undefined });

let passed = 0;
async function check(name: string, fn: () => unknown | Promise<unknown>) {
  await fn();
  passed++;
  console.log(`PASS ${name}`);
}
const denied = (fn: () => Promise<unknown>, status: number) =>
  assert.rejects(fn, (error: unknown) => error instanceof AppError && error.statusCode === status);
const mgr: UserSessionPayload = { id: 'manager-a', username: 'manager-a', name: 'Manager A', role: 'MANAGER', repId: null, positionCode: 'DM', systemRole: 'MANAGER' };
const other: UserSessionPayload = { ...mgr, id: 'manager-b', name: 'Manager B', username: 'manager-b', positionCode: 'SMD', systemRole: 'ADMIN' };
const mr: UserSessionPayload = { id: 'mr', name: 'MR', username: 'mr', role: 'REPRESENTATIVE', repId: 'rep-a', positionCode: 'MR', systemRole: 'REPRESENTATIVE' };
const pending = { ...mgr, mustChangePassword: true };
const activityInput = { activityType: 'Visit', activityDate: '2026-09-07', visitType: 'Single' };
const planInput = { isManagerPersonal: true, startDate: '2026-09-05', endDate: '2026-09-11', saturdayAm: 'Selected historical plan' };
const request = (url: string, method = 'GET', body?: unknown) => new NextRequest(`http://localhost${url}`, {
  method, ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
});
const context = (id: string) => ({ params: Promise.resolve({ id }) });

async function main() {
  // Only fixture prerequisites are derived from existing schemas. Manager DDL is the exact migration.
  const dialect = new SQLiteSyncDialect();
  for (const table of [users, sessions, salesAssignments, representatives, weeklyPlans, organizationRelationships, hospitals, pharmacies, doctors, distributionBranches, hospitalVisits, pharmacyVisits, doctorVisits, branchVisits, productAvailabilities, products, events, trainings, specialTasks]) {
    const config = getTableConfig(table);
    const columns = config.columns.map(column => {
      let definition = `"${column.name}" ${column.getSQLType()}${column.primary ? ' PRIMARY KEY' : ''}`;
      if (column.notNull) definition += ' NOT NULL';
      if (column.default !== undefined) {
        const value = column.default;
        definition += ' DEFAULT ' + (value instanceof SQL ? dialect.sqlToQuery(value).sql :
          typeof value === 'string' ? `'${value.replaceAll("'", "''")}'` : Number(value));
      }
      return definition;
    });
    sqlite.exec(`CREATE TABLE "${config.name}" (${columns.join(',')});`);
  }
  for (const user of [mgr, other, mr]) {
    await db.insert(users).values({ ...user, passwordHash: 'unused-test-hash' });
    await db.insert(sessions).values({ id: `session-${user.id}`, userId: user.id, expiresAt: new Date(Date.now() + 3600000) });
  }
  await db.insert(representatives).values({ id: 'rep-a', name: 'MR', area: 'Test' });
  await db.insert(organizationRelationships).values({ id: 'rel-mr-manager', subordinateUserId: mr.id, managerUserId: mgr.id, sourcePosition: 'MR', managerPosition: 'DM' });
  const executor = { execute: async (sql: string) => sqlite.exec(sql) };
  await check('exact migration applies and reruns idempotently', async () => {
    await applyStep19Migration(executor); await applyStep19Migration(executor);
  });
  await check('migration propagates failure and stops', async () => {
    let calls = 0;
    await assert.rejects(() => applyStep19Migration({ execute: async () => { calls++; throw new Error('fixture failure'); } }));
    assert.equal(calls, 1);
  });
  await check('migration refuses missing/whitespace targets and absent approval', () => {
    for (const target of [undefined, '', '   ', 'not a URL', 'file:local.db']) {
      assert.throws(() => assertExplicitMigrationTarget(target, true));
    }
    assert.throws(() => assertExplicitMigrationTarget('https://example.invalid', false));
    assert.doesNotThrow(() => assertExplicitMigrationTarget('https://example.invalid', true));
  });
  await check('unauthenticated activity operations rejected', async () => {
    for (const fn of [() => saveManagerActivity(null, activityInput), () => getManagerActivities(null), () => getManagerActivityById(null, 'x'), () => deleteManagerActivity(null, 'x')]) await denied(fn, 401);
  });
  await check('MR and unknown positions rejected for manager activity', async () => {
    await denied(() => saveManagerActivity(mr, activityInput), 403);
    await denied(() => saveManagerActivity({ ...mgr, positionCode: null }, activityInput), 403);
    await denied(() => saveManagerActivity({ ...mgr, positionCode: 'MR' }, activityInput), 403);
  });
  await check('all seven authorized manager positions can create', async () => {
    for (const positionCode of ['DM', 'AM', 'OM', 'BUM', 'PM', 'MM', 'SMD']) {
      const saved = await saveManagerActivity({ ...mgr, positionCode }, activityInput);
      assert.equal(saved.userId, mgr.id);
    }
  });
  const activity = await saveManagerActivity(mgr, { ...activityInput, userId: other.id });
  await check('activity ownership comes from session, actual owner display from database', async () => {
    assert.equal(activity.userId, mgr.id);
    const saved = await getManagerActivityById({ ...mgr, name: 'Stale name', positionCode: 'AM' }, activity.id);
    assert.equal(saved?.userName, 'Manager A'); assert.equal(saved?.userPosition, 'DM');
  });
  await check('other manager including ADMIN cannot read or delete activity', async () => {
    await denied(() => getManagerActivityById(other, activity.id), 403);
    await denied(() => deleteManagerActivity(other, activity.id), 403);
    assert.ok(await getManagerActivityById(mgr, activity.id));
  });
  await check('password-change users blocked across activity and plan services', async () => {
    for (const fn of [() => saveManagerActivity(pending, activityInput), () => getManagerActivities(pending), () => getManagerActivityById(pending, activity.id), () => deleteManagerActivity(pending, activity.id), () => saveWeeklyPlan(pending, planInput), () => getWeeklyPlans(pending, { personalOnly: true }), () => getWeeklyPlanById('x', pending), () => deleteWeeklyPlan(pending, 'x'), () => updateWeeklyPlanStatus(pending, 'x', 'Submitted')]) await denied(fn, 403);
  });
  await check('activity enum, dates and Double accompaniment validated', () => {
    for (const patch of [{ activityType: 'Other' }, { activityDate: '2026-02-30' }, { activityDate: 'wrong' }, { visitType: 'Triple' }, { visitType: 'Double', accompaniedPerson: '  ' }]) assert.equal(ManagerActivitySchema.safeParse({ ...activityInput, ...patch }).success, false);
    assert.equal(ManagerActivitySchema.safeParse({ ...activityInput, visitType: 'Double', accompaniedPerson: 'Colleague' }).success, true);
  });
  await check('all type-specific required fields match current form', () => {
    for (const [activityType, field] of [['Event', 'eventName'], ['Training', 'trainingTopic'], ['Office Working', 'workSummary'], ['Others', 'description']]) {
      assert.equal(ManagerActivitySchema.safeParse({ activityType, activityDate: '2026-09-07', [field]: '  ' }).success, false);
      assert.equal(ManagerActivitySchema.safeParse({ activityType, activityDate: '2026-09-07', [field]: 'Details' }).success, true);
    }
  });
  await check('activity date/type filters validated', async () => {
    await assert.rejects(() => getManagerActivities(mgr, { startDate: 'bad' }));
    await assert.rejects(() => getManagerActivities(mgr, { startDate: '2026-09-08', endDate: '2026-09-07' }));
    await assert.rejects(() => getManagerActivities(mgr, { activityType: 'invalid' }));
  });
  await check('unauthenticated weekly plan operations rejected', async () => {
    for (const fn of [() => saveWeeklyPlan(null, planInput), () => getWeeklyPlans(null, { personalOnly: true, userId: mgr.id }), () => getWeeklyPlanById('x', null), () => deleteWeeklyPlan(null, 'x'), () => updateWeeklyPlanStatus(null, 'x', 'Submitted')]) await denied(fn, 401);
  });
  await check('MR cannot manipulate personal flag or userId', async () => {
    await denied(() => saveWeeklyPlan(mr, planInput), 403);
    await denied(() => getWeeklyPlans(mr, { personalOnly: true }), 403);
    await denied(() => saveWeeklyPlan(mgr, { ...planInput, userId: other.id }), 403);
    await denied(() => getWeeklyPlans(mgr, { personalOnly: true, userId: other.id }), 403);
    await denied(() => getWeeklyPlans(mgr, { userId: other.id }), 403);
  });
  const plan = await saveWeeklyPlan(mgr, planInput);
  await check('manager saves own plan and ignores fake representative identity', async () => {
    const saved = await saveWeeklyPlan(mgr, { ...planInput, repId: 'rep-a', rep: 'Fake', userId: mgr.id });
    assert.equal(saved.userId, mgr.id); assert.equal(saved.rep, mgr.name); assert.equal(saved.id, plan.id);
  });
  await check('other manager cannot read, delete or change personal status', async () => {
    await denied(() => getWeeklyPlanById(plan.id, other), 403);
    await denied(() => deleteWeeklyPlan(other, plan.id), 403);
    await denied(() => updateWeeklyPlanStatus(other, plan.id, 'Submitted'), 403);
  });
  await check('personal plan cannot self-approve or set reviewer notes', async () => {
    await assert.rejects(() => saveWeeklyPlan(mgr, { ...planInput, status: 'Approved' }));
    await assert.rejects(() => saveWeeklyPlan(mgr, { ...planInput, status: 'Draft' }));
    await assert.rejects(() => saveWeeklyPlan(mgr, { ...planInput, managerNotes: 'Approved by supervisor' }));
    await assert.rejects(() => updateWeeklyPlanStatus(mgr, plan.id, 'Approved'));
    await assert.rejects(() => updateWeeklyPlanStatus(mgr, plan.id, 'Submitted', 'Fake reviewer'));
  });
  await check('weekly dates, range and status enum validated', () => {
    for (const patch of [{ status: 'Anything' }, { startDate: '2026-02-30' }, { endDate: '2026-09-04' }]) assert.equal(WeeklyPlanSchema.safeParse({ ...planInput, ...patch }).success, false);
  });
  await check('concurrent saves resolve to one user/week and retain ID', async () => {
    const saved = await Promise.all(Array.from({ length: 8 }, (_, i) => saveWeeklyPlan(mgr, { ...planInput, saturdayAm: `Update ${i}` })));
    assert.ok(saved.every(p => p.id === plan.id));
    assert.equal((await getWeeklyPlans(mgr, { personalOnly: true })).length, 1);
    assert.throws(() => sqlite.exec("INSERT INTO manager_weekly_plans(id,user_id,start_date,end_date) VALUES ('duplicate','manager-a','2026-09-05','2026-09-11')"), /UNIQUE/);
  });
  await check('migration fails on rescued duplicates without deleting data', async () => {
    sqlite.exec('DROP INDEX idx_mgr_weekly_plans_user_week');
    sqlite.exec("INSERT INTO manager_weekly_plans(id,user_id,start_date,end_date) VALUES ('duplicate','manager-a','2026-09-05','2026-09-11')");
    await assert.rejects(() => applyStep19Migration(executor), /UNIQUE/);
    assert.equal((sqlite.prepare('SELECT COUNT(*) AS n FROM manager_weekly_plans').get() as { n: number }).n, 2);
    sqlite.exec("DELETE FROM manager_weekly_plans WHERE id='duplicate'");
    await applyStep19Migration(executor);
  });
  await check('MR own plan behavior survives without manager table dependency', async () => {
    const saved = await saveWeeklyPlan(mr, { startDate: '2026-09-05', endDate: '2026-09-11', rep: 'MR' });
    sqlite.exec('ALTER TABLE manager_weekly_plans RENAME TO fixture_hidden_plans');
    try {
      assert.equal((await getWeeklyPlanById(saved.id, mr))?.repId, 'rep-a');
      assert.equal((await getWeeklyPlans(mr)).length, 1);
      assert.equal((await updateWeeklyPlanStatus(mgr, saved.id, 'Approved')).status, 'Approved');
      await deleteWeeklyPlan(mr, saved.id);
    } finally { sqlite.exec('ALTER TABLE fixture_hidden_plans RENAME TO manager_weekly_plans'); }
  });
  await check('HTTP routes reject anonymous requests including aliases/detail/export/delete', async () => {
    cookieToken = null;
    const calls = [activitiesRoute.GET(request('/api/manager/activities')), activitiesRoute.POST(request('/api/manager/activities', 'POST', activityInput)), activityRoute.GET(request('/'), context(activity.id)), activityRoute.DELETE(request('/', 'DELETE'), context(activity.id)), plansRoute.GET(request(`/api/weekly-plans?personal=true&userId=${mgr.id}`)), plansRoute.GET(request(`/api/weekly-plans?isManagerPersonal=true&userId=${mgr.id}`)), plansRoute.POST(request('/', 'POST', planInput)), planRoute.GET(request('/'), context(plan.id)), planRoute.DELETE(request('/', 'DELETE'), context(plan.id)), planRoute.PATCH(request('/', 'PATCH', { status: 'Submitted' }), context(plan.id)), exportRoute.GET(request('/'), context(plan.id))];
    for (const response of await Promise.all(calls)) assert.equal(response.status, 401);
  });
  await check('HTTP ownership enforcement protects detail/export/delete and both list aliases', async () => {
    cookieToken = 'session-manager-b';
    for (const response of await Promise.all([planRoute.GET(request('/'), context(plan.id)), exportRoute.GET(request('/'), context(plan.id)), planRoute.DELETE(request('/', 'DELETE'), context(plan.id)), activityRoute.DELETE(request('/', 'DELETE'), context(activity.id)), plansRoute.GET(request(`/api/weekly-plans?personal=true&userId=${mgr.id}`)), plansRoute.GET(request(`/api/weekly-plans?isManagerPersonal=true&userId=${mgr.id}`))])) assert.equal(response.status, 403);
  });
  await check('HTTP password-change and MR personal manipulation rejected', async () => {
    cookieToken = 'session-mr';
    assert.equal((await plansRoute.POST(request('/', 'POST', planInput))).status, 403);
    assert.equal((await activitiesRoute.POST(request('/', 'POST', activityInput))).status, 403);
    cookieToken = 'session-manager-a';
    sqlite.exec("UPDATE users SET must_change_password=1 WHERE id='manager-a'");
    for (const response of await Promise.all([activitiesRoute.GET(request('/')), plansRoute.POST(request('/', 'POST', planInput)), exportRoute.GET(request('/'), context(plan.id))])) assert.equal(response.status, 403);
    sqlite.exec("UPDATE users SET must_change_password=0 WHERE id='manager-a'");
  });
  await check('HTTP owner can create/read/export; invalid status is 400', async () => {
    cookieToken = 'session-manager-a';
    assert.equal((await activitiesRoute.POST(request('/', 'POST', activityInput))).status, 200);
    assert.equal((await plansRoute.POST(request('/', 'POST', planInput))).status, 200);
    assert.equal((await planRoute.GET(request('/'), context(plan.id))).status, 200);
    const exported = await exportRoute.GET(request('/'), context(plan.id));
    assert.equal(exported.status, 200); assert.ok((await exported.arrayBuffer()).byteLength > 100);
    assert.equal((await planRoute.PATCH(request('/', 'PATCH', { status: 'Anything' }), context(plan.id))).status, 400);
    assert.equal((await plansRoute.POST(request('/', 'POST', { ...planInput, status: 'Approved' }))).status, 400);
  });
  await check('selected historical plan renders its date/content; no personal approval controls', () => {
    const html = renderToStaticMarkup(React.createElement(I18nProvider, null,
      React.createElement(WeeklyPlanView, { initialPlan: plan, isManagerPersonal: true, isManager: true, currentUser: mgr })));
    assert.ok(html.includes('Selected historical plan')); assert.ok(html.includes('2026-09-05'));
    assert.match(html, /<fieldset disabled=""/); // Save/edit are unavailable until the history request settles.
    assert.equal(html.includes('Approve Plan'), false);
    const workspace = readFileSync('src/components/workspace/ManagerWorkspace.tsx', 'utf8');
    assert.match(workspace, /onOpenPlan=\{\(plan\) => \{\s*setSelectedPlan\(plan\)/);
    assert.match(workspace, /initialPlan=\{selectedPlan\}/);
    assert.match(workspace, /key=\{selectedPlan\?\.id/);
    const teamSection = workspace.slice(workspace.indexOf("activeNav === 'team_plans'"), workspace.indexOf('{/* 6. Team Lists */}'));
    assert.equal(teamSection.includes('<WeeklyPlanView'), false);
    const editor = readFileSync('src/components/weekly-plan/WeeklyPlanView.tsx', 'utf8');
    assert.match(editor, /if \(loading \|\| loadFailed \|\| saving\) return/);
    assert.match(editor, /disabled=\{loading \|\| saving \|\| loadFailed\}/);
    assert.match(editor, /sequence !== loadSequence.current/);
  });
  await check('MR report explorer ignores forged representative identity and never includes other reps', async () => {
    await db.insert(representatives).values({ id:'rep-private', name:'Private Rep', area:'Private area' });
    await db.insert(hospitals).values([{id:'hospital-own',repId:'rep-a',name:'Own Hospital',area:'Test'},{id:'hospital-private',repId:'rep-private',name:'Private Hospital',area:'Private'}]);
    await db.insert(hospitalVisits).values([{id:'visit-own',repId:'rep-a',hospitalId:'hospital-own',lastVisitDate:'2026-09-07'},{id:'visit-private',repId:'rep-private',hospitalId:'hospital-private',lastVisitDate:'2026-09-07'}]);
    cookieToken='session-mr';
    for (const url of ['/api/reports','/api/reports?rep=Private%20Rep&scopeMode=ALL_DESCENDANTS']) {
      const response=await reportsRoute.GET(request(url));assert.equal(response.status,200);
      const data=await response.json();assert.deepEqual(data.hospitals.map((row:{id:string})=>row.id),['visit-own']);assert.deepEqual(data.reps,[]);assert.deepEqual(data.managerActivities,[]);assert(!JSON.stringify(data).includes('Private Hospital'));
    }
    cookieToken=null;assert.equal((await reportsRoute.GET(request('/api/reports'))).status,401);
  });
  await check('owner deletes own activity and plan', async () => {
    assert.equal(await deleteManagerActivity(mgr, activity.id), true);
    assert.equal(await getManagerActivityById(mgr, activity.id), null);
    assert.equal(await deleteWeeklyPlan(mgr, plan.id), true);
    assert.equal(await getWeeklyPlanById(plan.id, mgr), null);
  });
  await check('existing MR weekly-plan regression suite runs entirely on the fixture', async () => {
    const result = await runWeeklyPlanTests();
    assert.equal(result.failed, 0);
    assert.ok(result.passed >= 10);
  });
  console.log(`STEP 19: ${passed} checks passed; no remote access.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  globalThis.fetch = originalFetch;
  dataGatewayClient.executeDrizzleProxy = originalProxy;
  dataGatewayClient.executeDrizzleProxyBatch = originalBatch;
  dataGatewayClient.query = originalQuery;
  headers.cookies = originalCookies;
  sqlite.close();
});
