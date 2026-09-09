import * as dotenv from 'dotenv';
import { client } from '../src/lib/db';

dotenv.config({ path: '.env.local', quiet: true });

const excludedTables = new Set([
  'users', 'sessions', 'login_attempts', 'admin_audit_events',
  'organization_relationships', 'hierarchy_paths', 'sales_assignments',
  'manager_rep_scopes', 'manager_area_scopes', 'positions',
]);

const quoteIdentifier = (value: string) => `"${value.replaceAll('"', '""')}"`;

async function main() {
  const accountRows = await client.execute(
    `select id, username, name, position_code, role, system_role, is_active
       from users
      where lower(trim(name)) in ('mario nader', 'maged raouf') or system_role = 'ADMIN'
      order by name`,
  );

  const tables = await client.execute(
    `select name from sqlite_master
      where type = 'table' and name not like 'sqlite_%'
      order by name`,
  );
  const candidates: Array<Record<string, unknown>> = [];

  for (const tableRow of tables) {
    const table = String(tableRow.name);
    if (excludedTables.has(table) || table.startsWith('_')) continue;
    const columns = await client.execute(`pragma table_info(${quoteIdentifier(table)})`);
    const searchable = columns
      .filter((column) => /CHAR|CLOB|TEXT/i.test(String(column.type ?? '')))
      .map((column) => String(column.name));
    if (!searchable.length) continue;

    const clauses = searchable.flatMap((column) => [
      `lower(trim(${quoteIdentifier(column)})) like 'test %'`,
      `lower(trim(${quoteIdentifier(column)})) like 'qa %'`,
      `lower(trim(${quoteIdentifier(column)})) like 'demo %'`,
    ]);
    const rows = await client.execute(
      `select * from ${quoteIdentifier(table)} where ${clauses.join(' or ')} limit 250`,
    );
    for (const row of rows) candidates.push({ table, row });
  }

  const candidateIds = [...new Set(candidates.map((candidate) => {
    const row = candidate.row as Record<string, unknown>;
    return typeof row.id === 'string' ? row.id : null;
  }).filter((id): id is string => Boolean(id)))];
  const dependencies: Array<Record<string, unknown>> = [];
  for (const tableRow of tables) {
    const table = String(tableRow.name);
    if (table.startsWith('_') || ['sessions', 'login_attempts', 'admin_audit_events'].includes(table)) continue;
    const columns = await client.execute(`pragma table_info(${quoteIdentifier(table)})`);
    const comparable = columns.map((column) => String(column.name)).filter((name) => name !== 'id');
    if (!comparable.length || !candidateIds.length) continue;
    const clauses = comparable.map((column) => `${quoteIdentifier(column)} = ?`);
    for (const candidateId of candidateIds) {
      const rows = await client.execute(
        `select * from ${quoteIdentifier(table)} where ${clauses.join(' or ')} limit 500`,
        comparable.map(() => candidateId),
      );
      for (const row of rows) dependencies.push({ table, candidateId, row });
    }
  }

  console.log(JSON.stringify({ accounts: accountRows, cleanupCandidates: candidates, dependencies }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
