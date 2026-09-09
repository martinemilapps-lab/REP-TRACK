import * as dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { client } from '../src/lib/db';
import * as XLSX from 'xlsx';

dotenv.config({ path: '.env.local', quiet: true });

const APPLY_FLAG = '--apply-production-line2';

const normalize = (value: unknown) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
const normalizePosition = (value: unknown) => String(value ?? '').trim().toUpperCase().replace(/\s*\d+\s*$/, '').replace(/\s+/g, '');

async function syncLine2Workbook(workbookPath: string) {
  const workbook = XLSX.readFile(workbookPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const headers = raw[1].map((value) => String(value ?? '').trim());
  const records = raw.slice(2).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])))
    .filter((row) => normalize(row['Employee Name']));
  const userRows = await client.execute('select id, name, position_code from users');
  const byName = new Map<string, Array<Record<string, unknown>>>();
  for (const user of userRows) {
    const key = normalize(user.name);
    byName.set(key, [...(byName.get(key) ?? []), user]);
  }
  const realRecords = records.filter((row) => !normalize(row['Employee Name']).startsWith('vacant'));
  for (const row of realRecords) {
    const matches = byName.get(normalize(row['Employee Name'])) ?? [];
    if (matches.length !== 1) throw new Error(`Workbook identity is missing or ambiguous: ${String(row['Employee Name']).trim()}`);
    const expectedPosition = normalizePosition(row.Title);
    if (expectedPosition && normalizePosition(matches[0].position_code) !== expectedPosition) {
      throw new Error(`Workbook position mismatch for ${String(row['Employee Name']).trim()}`);
    }
  }
  const affectedIds = [...new Set(realRecords.map((row) => String(byName.get(normalize(row['Employee Name']))![0].id)))];
  if (affectedIds.length) {
    await client.execute(`delete from hierarchy_paths where source_user_id in (${affectedIds.map(() => '?').join(',')})`, affectedIds);
  }
  const seenRelationships = new Set<string>();
  const seenPaths = new Set<string>();
  let relationshipCount = 0;
  let pathCount = 0;
  for (const row of realRecords) {
    const employee = String(row['Employee Name']).trim();
    const chainNames = [employee, ...['DM', 'AM', 'OM', 'BUM', 'MM', 'S and MD']
      .map((column) => String(row[column] ?? '').trim())
      .filter((name) => name && normalize(name) !== 'none')];
    const chain = chainNames.map((name) => {
      const matches = byName.get(normalize(name)) ?? [];
      if (matches.length !== 1) throw new Error(`Workbook manager is missing or ambiguous: ${name}`);
      return matches[0];
    }).filter((user, index, list) => index === 0 || user.id !== list[index - 1].id);
    for (let index = 0; index < chain.length - 1; index++) {
      const subordinate = chain[index];
      const manager = chain[index + 1];
      const key = `${subordinate.id}:${manager.id}`;
      if (seenRelationships.has(key)) continue;
      seenRelationships.add(key);
      const relationshipType = index === 0 && String(manager.position_code) !== 'DM' ? 'SKIP_LEVEL' : 'DIRECT';
      await client.execute(
        `insert or ignore into organization_relationships (id, subordinate_user_id, manager_user_id, relationship_type, source_position, manager_position, subordinate_assignment_id, is_active, source_metadata) values (?, ?, ?, ?, ?, ?, null, 1, ?)`,
        [`line2-${subordinate.id}-${manager.id}`, subordinate.id, manager.id, relationshipType, subordinate.position_code, manager.position_code, JSON.stringify({ source: 'Final Areas sheet - Line 2.xlsx' })],
      );
      relationshipCount++;
    }
    const source = chain[0];
    const assignments = await client.execute("select id from sales_assignments where user_id=? and is_active=1 and assignment_type in ('PRIMARY_REP','PERSONAL_MR')", [source.id]);
    for (let depth = 1; depth < chain.length; depth++) {
      const ancestor = chain[depth];
      const userKey = `${source.id}:${ancestor.id}`;
      if (!seenPaths.has(userKey)) {
        seenPaths.add(userKey);
        await client.execute('insert into hierarchy_paths (id, source_assignment_id, source_user_id, ancestor_user_id, ancestor_position, depth) values (?, null, ?, ?, ?, ?)', [`line2-u-${source.id}-${ancestor.id}`, source.id, ancestor.id, ancestor.position_code, depth]);
        pathCount++;
      }
      for (const assignment of assignments) {
        const assignmentKey = `${assignment.id}:${ancestor.id}`;
        if (seenPaths.has(assignmentKey)) continue;
        seenPaths.add(assignmentKey);
        await client.execute('insert into hierarchy_paths (id, source_assignment_id, source_user_id, ancestor_user_id, ancestor_position, depth) values (?, ?, ?, ?, ?, ?)', [`line2-sa-${assignment.id}-${ancestor.id}`, assignment.id, source.id, ancestor.id, ancestor.position_code, depth]);
        pathCount++;
      }
    }
  }
  return { employees: realRecords.length, relationships: relationshipCount, paths: pathCount };
}

function statements(source: string) {
  return source
    .replace(/^\s*--.*$/gm, '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
}

async function tableColumns(table: string) {
  return new Set((await client.execute(`pragma table_info(${table})`)).map((row) => String(row.name)));
}

async function addMissingColumns(table: string, definitions: Record<string, string>) {
  const present = await tableColumns(table);
  for (const [column, definition] of Object.entries(definitions)) {
    if (!present.has(column)) await client.execute(`alter table ${table} add column ${column} ${definition}`);
  }
}

async function main() {
  if (!process.argv.includes(APPLY_FLAG)) throw new Error(`Explicit ${APPLY_FLAG} authorization is required.`);
  const expected = ['Ahmed El Kot', 'Maher Khamis', 'Michael Antonyo', 'Osama Bert', 'Maged Raouf'];
  const matches = await client.execute(
    `select name, count(*) count from users where lower(trim(name)) in (${expected.map(() => '?').join(',')}) group by lower(trim(name))`,
    expected.map((name) => name.toLowerCase()),
  );
  if (matches.length !== expected.length || matches.some((row) => Number(row.count) !== 1)) {
    throw new Error('Production account preflight failed: expected hierarchy identities are missing or ambiguous.');
  }

  const foundation = readFileSync(resolve('scripts/migrations/step15b_organization_foundation.sql'), 'utf8');
  for (const sql of statements(foundation)) await client.execute(sql);

  const data = readFileSync(resolve('scripts/migrations/step15b_organization_data.sql'), 'utf8');
  for (const sql of statements(data)) {
    if (!/^INSERT OR REPLACE INTO `(positions|areas|sales_assignments|organization_relationships|hierarchy_paths|manager_rep_scopes|manager_area_scopes)`/i.test(sql)) continue;
    await client.execute(sql.replace(/^INSERT OR REPLACE/i, 'INSERT OR IGNORE'));
  }

  const workbookArg = process.argv.find((arg) => arg.startsWith('--workbook='));
  if (!workbookArg) throw new Error('An authoritative --workbook=<path> is required.');
  const workbookSync = await syncLine2Workbook(workbookArg.slice('--workbook='.length));

  await addMissingColumns('hospitals', { rep_id: 'text', doctor_names: 'text', default_cycle: 'integer default 7', target_products: 'text' });
  await addMissingColumns('pharmacies', { rep_id: 'text', default_cycle: 'integer default 7', target_products: 'text' });
  await addMissingColumns('doctors', { rep_id: 'text', address: 'text', best_time: 'text', default_cycle: 'integer default 7', target_products: 'text' });
  await addMissingColumns('distribution_branches', { rep_id: 'text', address: 'text', default_cycle: 'integer default 7' });
  await addMissingColumns('hospital_visits', { objective: 'text', doctor_names: 'text' });
  await addMissingColumns('pharmacy_visits', { stock_per_month: 'text', sales_per_month: 'text' });
  await addMissingColumns('doctor_visits', { prescription_rate: 'text', nearby_pharmacy: 'text' });
  await addMissingColumns('branch_visits', { products: 'text', monthly_stock: 'text', monthly_sales: 'text' });
  await addMissingColumns('product_availabilities', { objective: 'text', annual_target: 'integer default 0', avg_monthly_target: 'integer default 0', potentiality: 'integer default 0' });

  const factTables = [
    `create table if not exists events (id text primary key not null, rep_id text not null references representatives(id) on delete restrict, title text not null, event_type text not null, event_date text not null, location text, attendees_count integer default 0, target_specialty text, products text, budget text, feedback text, notes text, submitted_at integer not null default (unixepoch() * 1000))`,
    `create table if not exists trainings (id text primary key not null, rep_id text not null references representatives(id) on delete restrict, title text not null, training_type text not null, training_date text not null, trainer text, attendees text, duration_hours integer default 1, outcomes text, notes text, submitted_at integer not null default (unixepoch() * 1000))`,
    `create table if not exists special_tasks (id text primary key not null, rep_id text not null references representatives(id) on delete restrict, title text not null, task_category text not null, task_date text not null, assigned_by text, priority text not null default 'Normal', status text not null default 'Completed', description text, notes text, submitted_at integer not null default (unixepoch() * 1000))`,
    `create index if not exists idx_events_rep on events(rep_id)`,
    `create index if not exists idx_events_date on events(event_date)`,
    `create index if not exists idx_trainings_rep on trainings(rep_id)`,
    `create index if not exists idx_trainings_date on trainings(training_date)`,
    `create index if not exists idx_special_tasks_rep on special_tasks(rep_id)`,
    `create index if not exists idx_special_tasks_date on special_tasks(task_date)`,
    `create index if not exists idx_hospitals_rep on hospitals(rep_id)`,
    `create index if not exists idx_pharmacies_rep on pharmacies(rep_id)`,
    `create index if not exists idx_doctors_rep on doctors(rep_id)`,
    `create index if not exists idx_dist_branches_rep on distribution_branches(rep_id)`,
  ];
  for (const sql of factTables) await client.execute(sql);

  const chain = await client.execute(
    `select su.name source, au.name ancestor, hp.depth from hierarchy_paths hp join users su on su.id=hp.source_user_id join users au on au.id=hp.ancestor_user_id where su.name=? order by hp.depth`,
    ['Ahmed El Kot'],
  );
  const tables = await client.execute("select name from sqlite_master where type='table' and name in ('organization_relationships','hierarchy_paths','events','trainings','special_tasks') order by name");
  console.log(JSON.stringify({ status: 'PASS', workbookSync, tables: tables.map((row) => row.name), ahmedChain: chain }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
