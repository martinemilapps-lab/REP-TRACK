import * as dotenv from 'dotenv';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as XLSX from 'xlsx';
import { client } from '../src/lib/db';
import { dataGatewayClient } from '../src/lib/dataGatewayClient';
import { computeTransitiveClosure, validateHierarchyAcyclicity } from '../src/lib/services/organizationService';

dotenv.config({ path: '.env.local', quiet: true });

type UserRow = { id: string; name: string; position_code: string; is_active: number };
type RelationshipRow = { id: string; subordinate_user_id: string; manager_user_id: string; relationship_type: string; source_position: string; manager_position: string; subordinate_assignment_id: string | null; is_active: number };
type WorkbookPerson = { name: string; title: string; territory: string; managerName: string | null; vacancy: boolean };
type Statement = { sql: string; params: unknown[]; method: 'run' };

const normalize = (value: unknown) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
const canonicalPosition = (value: unknown) => {
  const title = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (/^MR\d*$/.test(title)) return 'MR';
  if (/^DM\d*$/.test(title)) return 'DM';
  if (/^BUM\d*$/.test(title)) return 'BUM';
  if (title === 'SANDMD' || title === 'S&MD') return 'SMD';
  return title;
};
const populatedName = (value: unknown) => {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ');
  return text && normalize(text) !== 'none' ? text : null;
};

export function parseLine2Workbook(workbookPath: string): WorkbookPerson[] {
  const workbook = XLSX.readFile(resolve(workbookPath));
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const headerIndex = rows.findIndex((row) => row.some((value) => normalize(value) === 'employee name'));
  if (headerIndex < 0) throw new Error('Workbook header row containing Employee Name was not found.');
  const headers = rows[headerIndex].map((value) => normalize(value));
  const column = (name: string) => {
    const index = headers.indexOf(normalize(name));
    if (index < 0) throw new Error(`Workbook column was not found: ${name}`);
    return index;
  };
  const employeeColumn = column('Employee Name');
  const titleColumn = column('Title');
  const territoryColumn = column('Territory');
  const managerColumns: Record<string, string[]> = { MR: ['DM', 'AM', 'OM', 'BUM', 'MM', 'S and MD'], DM: ['AM', 'OM', 'BUM', 'MM', 'S and MD'], AM: ['OM', 'BUM', 'MM', 'S and MD'], OM: ['BUM', 'MM', 'S and MD'], BUM: ['MM', 'S and MD'], MM: ['S and MD'], SMD: [] };
  const parsed: WorkbookPerson[] = [];
  for (const row of rows.slice(headerIndex + 1)) {
    const name = populatedName(row[employeeColumn]);
    if (!name) continue;
    const title = canonicalPosition(row[titleColumn]);
    if (!managerColumns[title]) throw new Error(`Unsupported title for ${name}: ${String(row[titleColumn])}`);
    const managerName = managerColumns[title].map((managerColumn) => populatedName(row[column(managerColumn)])).find(Boolean) ?? null;
    parsed.push({ name, title, territory: String(row[territoryColumn] ?? '').trim(), managerName, vacancy: normalize(name).startsWith('vacant') });
  }
  return parsed;
}

export function parseHierarchySql(sqlPath: string): WorkbookPerson[] {
  const source = readFileSync(resolve(sqlPath), 'utf8');
  const employeeBlock = source.match(/INSERT INTO org_employees[\s\S]*?VALUES([\s\S]*?)ON CONFLICT\(id\)/i)?.[1];
  const relationshipBlock = source.match(/INSERT INTO org_reporting_relationships[\s\S]*?VALUES([\s\S]*?)ON CONFLICT\(employee_id\)/i)?.[1];
  if (!employeeBlock || !relationshipBlock) throw new Error('Authoritative org employee or relationship block was not found.');
  const titleById: Record<string, string> = { title_mr:'MR', title_mr2:'MR', title_dm:'DM', title_dm2:'DM', title_dm_2:'DM', title_am:'AM', title_om:'OM', title_bum2:'BUM', title_smd:'SMD' };
  const peopleById = new Map<string, WorkbookPerson>();
  const employeePattern = /\('([^']+)',\s*'[^']+',\s*'([^']+)',\s*'[^']+',\s*'([^']+)',\s*(?:NULL|'([^']+)'),\s*'(ACTIVE|INACTIVE|VACANT)'\)/g;
  for (const match of employeeBlock.matchAll(employeePattern)) {
    const title = titleById[match[3]];
    if (!title) throw new Error(`Unknown SQL title id: ${match[3]}`);
    peopleById.set(match[1], { name: match[2], title, territory: match[4] ?? '', managerName: null, vacancy: match[5] === 'VACANT' });
  }
  const relationshipPattern = /\('([^']+)',\s*'([^']+)'\)/g;
  let relationshipCount = 0;
  for (const match of relationshipBlock.matchAll(relationshipPattern)) {
    const person = peopleById.get(match[1]);
    const manager = peopleById.get(match[2]);
    if (!person || !manager) throw new Error(`Unknown SQL relationship identity: ${match[1]} -> ${match[2]}`);
    person.managerName = manager.name;
    relationshipCount++;
  }
  if (peopleById.size !== 34 || relationshipCount !== 33) throw new Error(`Expected 34 positions and 33 relationships; found ${peopleById.size} and ${relationshipCount}.`);
  return [...peopleById.values()];
}

export function crossCheckAuthoritativeSources(workbookRows: WorkbookPerson[], sqlRows: WorkbookPerson[]) {
  const workbookByName = new Map(workbookRows.map((row) => [normalize(row.name), row]));
  const sqlByName = new Map(sqlRows.map((row) => [normalize(row.name), row]));
  const issues: string[] = [];
  for (const row of workbookRows) {
    const sqlRow = sqlByName.get(normalize(row.name));
    if (!sqlRow) issues.push(`${row.name}: missing from SQL flow`);
    else if (row.title !== sqlRow.title || row.vacancy !== sqlRow.vacancy) issues.push(`${row.name}: title or vacancy status differs`);
  }
  for (const row of sqlRows) if (!workbookByName.has(normalize(row.name))) issues.push(`${row.name}: missing from spreadsheet`);
  if (issues.length || workbookRows.length !== 34 || sqlRows.length !== 34) {
    throw new Error(`Spreadsheet/SQL roster cross-check failed:\n${issues.join('\n')}`);
  }
  return sqlRows;
}

const stableRelationshipId = (subordinateId: string, managerId: string) => `line2-${createHash('sha256').update(`${subordinateId}:${managerId}`).digest('hex').slice(0, 20)}`;

async function counts() {
  const tables = ['users', 'representatives', 'hospital_visits', 'doctor_visits', 'pharmacy_visits', 'branch_visits', 'weekly_plans', 'manager_weekly_plans', 'hospitals', 'doctors', 'pharmacies', 'distribution_branches', 'product_availabilities'];
  const result: Record<string, number> = {};
  for (const table of tables) result[table] = Number((await client.execute(`select count(*) count from ${table}`))[0]?.count ?? 0);
  return result;
}

async function reconcile(sourceRows: WorkbookPerson[], sourceName: string, apply: boolean, strictAuthoritative = false) {
  const workbookRows = sourceRows;
  const realPeople = workbookRows.filter((row) => !row.vacancy);
  const vacancies = workbookRows.filter((row) => row.vacancy);
  const users = await client.execute('select id, name, position_code, is_active from users') as UserRow[];
  const byName = new Map<string, UserRow[]>();
  for (const user of users) byName.set(normalize(user.name), [...(byName.get(normalize(user.name)) ?? []), user]);
  const unresolved: string[] = [];
  const resolved = new Map<string, UserRow>();
  for (const person of realPeople) {
    const matches = byName.get(normalize(person.name)) ?? [];
    if (matches.length !== 1) { unresolved.push(`${person.name}: ${matches.length ? 'ambiguous' : 'missing'}`); continue; }
    const user = matches[0];
    if (canonicalPosition(user.position_code) !== person.title) unresolved.push(`${person.name}: title ${user.position_code} does not match ${person.title}`);
    else resolved.set(normalize(person.name), user);
  }
  for (const person of realPeople) if (person.managerName && !resolved.has(normalize(person.managerName))) unresolved.push(`${person.name}: manager ${person.managerName} is unresolved`);
  if (unresolved.length) throw new Error(`Identity preflight failed:\n${unresolved.join('\n')}`);

  const relationships = await client.execute('select id, subordinate_user_id, manager_user_id, relationship_type, source_position, manager_position, subordinate_assignment_id, is_active from organization_relationships') as RelationshipRow[];
  const expectedBySubordinate = new Map<string, { person: WorkbookPerson; subordinate: UserRow; manager: UserRow | null }>();
  for (const person of realPeople) expectedBySubordinate.set(resolved.get(normalize(person.name))!.id, { person, subordinate: resolved.get(normalize(person.name))!, manager: person.managerName ? resolved.get(normalize(person.managerName))! : null });
  const changes: Array<Record<string, unknown>> = [];
  const statements: Statement[] = [];
  const resultingRelationships = relationships.map((row) => ({ ...row }));
  for (const expected of expectedBySubordinate.values()) {
    const currentActive = resultingRelationships.filter((row) => row.subordinate_user_id === expected.subordinate.id && row.is_active === 1);
    const matching = expected.manager ? resultingRelationships.filter((row) => row.subordinate_user_id === expected.subordinate.id && row.manager_user_id === expected.manager!.id) : [];
    const keeper = matching.find((row) => row.relationship_type === 'DIRECT') ?? matching[0];
    for (const row of currentActive) {
      if (keeper && row.id === keeper.id) continue;
      row.is_active = 0;
      statements.push({ sql: 'update organization_relationships set is_active=0 where id=?', params: [row.id], method: 'run' });
    }
    if (expected.manager) {
      const metadata = JSON.stringify({ source: sourceName, authoritative: true });
      if (keeper) {
        keeper.is_active = 1;
        keeper.relationship_type = 'DIRECT';
        keeper.source_position = expected.subordinate.position_code;
        keeper.manager_position = expected.manager.position_code;
        statements.push({ sql: 'update organization_relationships set is_active=1, relationship_type=?, source_position=?, manager_position=?, source_metadata=? where id=?', params: ['DIRECT', expected.subordinate.position_code, expected.manager.position_code, metadata, keeper.id], method: 'run' });
      } else {
        const created: RelationshipRow = { id: stableRelationshipId(expected.subordinate.id, expected.manager.id), subordinate_user_id: expected.subordinate.id, manager_user_id: expected.manager.id, relationship_type: 'DIRECT', source_position: expected.subordinate.position_code, manager_position: expected.manager.position_code, subordinate_assignment_id: null, is_active: 1 };
        resultingRelationships.push(created);
        statements.push({ sql: 'insert into organization_relationships (id, subordinate_user_id, manager_user_id, relationship_type, source_position, manager_position, subordinate_assignment_id, is_active, source_metadata, created_at) values (?, ?, ?, ?, ?, ?, null, 1, ?, ?)', params: [created.id, created.subordinate_user_id, created.manager_user_id, 'DIRECT', created.source_position, created.manager_position, metadata, Date.now()], method: 'run' });
      }
    }
    const activeManagerNames = currentActive.map((row) => users.find((user) => user.id === row.manager_user_id)?.name ?? row.manager_user_id);
    const correctBefore = expected.manager ? currentActive.length === 1 && currentActive[0].manager_user_id === expected.manager.id : currentActive.length === 0;
    changes.push({ employee: expected.person.name, userId: expected.subordinate.id, spreadsheetTitle: expected.person.title, databaseTitle: expected.subordinate.position_code, requiredManager: expected.manager?.name ?? null, currentManagers: activeManagerNames, action: correctBefore ? 'already correct' : expected.manager && currentActive.length === 0 ? 'add' : expected.manager ? 'replace/deduplicate' : 'remove stale', historicalOwnershipPreserved: true });
  }

  const expectedEdgeKeys = new Set(
    [...expectedBySubordinate.values()]
      .filter((row) => row.manager)
      .map((row) => `${row.subordinate.id}:${row.manager!.id}`),
  );
  const removedOutsideAuthority: Array<{ subordinate: string; manager: string; relationshipId: string }> = [];
  if (strictAuthoritative) {
    for (const row of resultingRelationships) {
      if (row.is_active !== 1 || expectedEdgeKeys.has(`${row.subordinate_user_id}:${row.manager_user_id}`)) continue;
      row.is_active = 0;
      statements.push({ sql: 'update organization_relationships set is_active=0 where id=?', params: [row.id], method: 'run' });
      removedOutsideAuthority.push({
        subordinate: users.find((user) => user.id === row.subordinate_user_id)?.name ?? row.subordinate_user_id,
        manager: users.find((user) => user.id === row.manager_user_id)?.name ?? row.manager_user_id,
        relationshipId: row.id,
      });
    }
  }

  const activeRelationships = resultingRelationships.filter((row) => row.is_active === 1);
  const graphCheck = validateHierarchyAcyclicity(activeRelationships.map((row) => ({ subordinateUserId: row.subordinate_user_id, managerUserId: row.manager_user_id })));
  if (!graphCheck.isValid) throw new Error(`Resulting hierarchy contains a cycle: ${graphCheck.cyclePath?.join(' -> ')}`);
  for (const expected of expectedBySubordinate.values()) {
    const managers = activeRelationships.filter((row) => row.subordinate_user_id === expected.subordinate.id);
    if (managers.length !== (expected.manager ? 1 : 0)) throw new Error(`Immediate-manager invariant failed for ${expected.person.name}`);
  }
  if (strictAuthoritative) {
    const actualEdgeKeys = new Set(activeRelationships.map((row) => `${row.subordinate_user_id}:${row.manager_user_id}`));
    if (actualEdgeKeys.size !== expectedEdgeKeys.size || [...actualEdgeKeys].some((key) => !expectedEdgeKeys.has(key))) {
      throw new Error(`Strict hierarchy invariant failed: expected exactly ${expectedEdgeKeys.size} active user relationships.`);
    }
  }
  const assignments = await client.execute('select id, user_id from sales_assignments where is_active=1') as Array<{ id: string; user_id: string }>;
  const assignmentsByUser = new Map<string, Array<{ id: string }>>();
  for (const assignment of assignments) assignmentsByUser.set(assignment.user_id, [...(assignmentsByUser.get(assignment.user_id) ?? []), { id: assignment.id }]);
  const paths = computeTransitiveClosure(activeRelationships.map((row) => ({ subordinateUserId: row.subordinate_user_id, managerUserId: row.manager_user_id, managerPosition: row.manager_position, subordinateAssignmentId: row.subordinate_assignment_id })), new Map(users.map((user) => [user.id, user.position_code])), assignmentsByUser);
  statements.push({ sql: 'delete from hierarchy_paths', params: [], method: 'run' });
  for (const path of paths) statements.push({ sql: 'insert into hierarchy_paths (id, source_assignment_id, source_user_id, ancestor_user_id, ancestor_position, depth, created_at) values (?, ?, ?, ?, ?, ?, ?)', params: [path.id, path.sourceAssignmentId ?? null, path.sourceUserId, path.ancestorUserId, path.ancestorPosition, path.depth, Date.now()], method: 'run' });
  const beforeCounts = await counts();
  const summary = { mode: apply ? 'apply' : 'dry-run', strictAuthoritative, workbookRows: workbookRows.length, realEmployeesMatched: realPeople.length, vacancies: vacancies.map((row) => row.name), alreadyCorrect: changes.filter((row) => row.action === 'already correct').length, relationshipsAdded: changes.filter((row) => row.action === 'add').length, relationshipsCorrected: changes.filter((row) => row.action === 'replace/deduplicate').length, staleTopLevelRemoved: changes.filter((row) => row.action === 'remove stale').length, relationshipsRemovedOutsideAuthority: removedOutsideAuthority.length, removedOutsideAuthority, activeRelationshipsAfter: activeRelationships.length, derivedPaths: paths.length, beforeCounts, changes };
  if (!apply) return summary;
  await dataGatewayClient.executeDrizzleProxyBatch(statements);
  return { ...summary, afterCounts: await counts() };
}

async function main() {
  const workbookArg = process.argv.find((arg) => arg.startsWith('--workbook='));
  const sqlArg = process.argv.find((arg) => arg.startsWith('--sql='));
  if (!workbookArg && !sqlArg) throw new Error('Use --workbook=<path> or --sql=<path>.');
  const sourceName = sqlArg && workbookArg ? 'Final Areas sheet - Line 2.xlsx + rep_track_hierarchy_d1.sql' : sqlArg ? 'rep_track_hierarchy_d1.sql' : 'Final Areas sheet - Line 2.xlsx';
  const sqlRows = sqlArg ? parseHierarchySql(sqlArg.slice('--sql='.length)) : null;
  const workbookRows = workbookArg ? parseLine2Workbook(workbookArg.slice('--workbook='.length)) : null;
  const rows = sqlRows && workbookRows ? crossCheckAuthoritativeSources(workbookRows, sqlRows) : sqlRows ?? workbookRows!;
  console.log(JSON.stringify(await reconcile(rows, sourceName, process.argv.includes('--apply-production-line2'), process.argv.includes('--strict-authoritative')), null, 2));
}

if (process.argv[1]?.includes('migrate_production_line2')) main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
