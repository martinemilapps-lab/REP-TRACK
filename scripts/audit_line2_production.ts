import * as dotenv from 'dotenv';
import { client } from '../src/lib/db';

dotenv.config({ path: '.env.local', quiet: true });

const names = [
  'Ahmed El Kot', 'Maher Khamis', 'Michael Antonyo', 'Osama Bert', 'Maged Raouf',
  'Helana Alex 1', 'Mina Michel', 'Sara Adel', 'Bassem Hanna',
];

async function main() {
  const placeholders = names.map(() => '?').join(',');
  const users = await client.execute(
    `select id, username, name, position_code, role, system_role, rep_id, is_active
       from users where lower(trim(name)) in (${placeholders}) order by name`,
    names.map((name) => name.toLowerCase()),
  );
  const ids = users.map((row) => String(row.id));
  const idPlaceholders = ids.map(() => '?').join(',');
  const safeQuery = async (sql: string, params: unknown[] = []) => {
    try { return await client.execute(sql, params); } catch (error) {
      return [{ auditError: error instanceof Error ? error.message : String(error) }];
    }
  };
  const relationships = ids.length ? await safeQuery(
    `select r.id, su.name subordinate, mu.name manager, r.source_position, r.manager_position,
            r.subordinate_assignment_id, r.is_active
       from organization_relationships r
       join users su on su.id = r.subordinate_user_id
       join users mu on mu.id = r.manager_user_id
      where r.subordinate_user_id in (${idPlaceholders}) or r.manager_user_id in (${idPlaceholders})
      order by subordinate, manager`,
    [...ids, ...ids],
  ) : [];
  const paths = ids.length ? await safeQuery(
    `select su.name source, au.name ancestor, hp.depth, hp.source_assignment_id
       from hierarchy_paths hp
       join users su on su.id = hp.source_user_id
       join users au on au.id = hp.ancestor_user_id
      where hp.source_user_id in (${idPlaceholders})
      order by source, hp.depth, ancestor`,
    ids,
  ) : [];
  const tables = await client.execute("select name from sqlite_master where type='table' order by name");
  const columns: Record<string, string[]> = {};
  for (const table of ['branch_visits', 'pharmacy_visits', 'doctor_visits', 'events', 'trainings', 'special_tasks']) {
    columns[table] = (await safeQuery(`pragma table_info(${table})`)).map((row) => String(row.name ?? row.auditError));
  }
  console.log(JSON.stringify({ users, relationships, paths, tables: tables.map((r) => r.name), columns }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
