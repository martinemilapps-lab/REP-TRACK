import * as dotenv from 'dotenv';
import { client } from '../src/lib/db';
import { parseHierarchySql } from './migrate_production_line2';

dotenv.config({ path: '.env.local', quiet: true });

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

async function main() {
  const sqlArg = process.argv.find((arg) => arg.startsWith('--sql='));
  if (!sqlArg) throw new Error('Use --sql=<path>.');
  const sourceRows = parseHierarchySql(sqlArg.slice('--sql='.length));
  const activeRows = sourceRows.filter((row) => !row.vacancy);
  const vacancies = sourceRows.filter((row) => row.vacancy);
  const users = await client.execute('select id, name, is_active from users');
  const activeUsersByName = new Map(
    users.filter((row) => Number(row.is_active) === 1).map((row) => [normalize(String(row.name)), String(row.id)]),
  );
  const sourceIds = new Set(activeRows.map((row) => activeUsersByName.get(normalize(row.name))));
  if (sourceIds.has(undefined) || sourceIds.size !== 30) throw new Error('Could not uniquely match all 30 active SQL identities.');

  const relationships = await client.execute(
    `select subordinate_user_id subordinateUserId, manager_user_id managerUserId
       from organization_relationships where is_active=1 and relationship_type='DIRECT'`,
  );
  const actualManagers = new Map<string, string[]>();
  for (const row of relationships) {
    const subordinate = String(row.subordinateUserId);
    const managers = actualManagers.get(subordinate) ?? [];
    managers.push(String(row.managerUserId));
    actualManagers.set(subordinate, managers);
  }
  for (const row of activeRows) {
    const userId = activeUsersByName.get(normalize(row.name))!;
    const expectedManagerId = row.managerName ? activeUsersByName.get(normalize(row.managerName)) : undefined;
    const managers = actualManagers.get(userId) ?? [];
    if (expectedManagerId ? managers.length !== 1 || managers[0] !== expectedManagerId : managers.length !== 0) {
      throw new Error(`Direct manager mismatch for ${row.name}.`);
    }
  }

  const expectedPaths = new Set<string>();
  const managerByName = new Map(activeRows.map((row) => [normalize(row.name), row.managerName ? normalize(row.managerName) : null]));
  for (const row of activeRows) {
    let managerName = managerByName.get(normalize(row.name)) ?? null;
    let depth = 1;
    while (managerName) {
      expectedPaths.add(`${activeUsersByName.get(normalize(row.name))}:${activeUsersByName.get(managerName)}:${depth}`);
      managerName = managerByName.get(managerName) ?? null;
      depth++;
    }
  }
  const paths = await client.execute('select source_user_id sourceUserId, ancestor_user_id ancestorUserId, depth from hierarchy_paths');
  const actualPaths = new Set(paths.map((row) => `${row.sourceUserId}:${row.ancestorUserId}:${row.depth}`));
  for (const path of expectedPaths) if (!actualPaths.has(path)) throw new Error(`Missing hierarchy path ${path}.`);
  if (actualPaths.size !== expectedPaths.size || [...actualPaths].some((path) => !expectedPaths.has(path))) {
    throw new Error(`Production contains paths outside the authoritative hierarchy: expected ${expectedPaths.size}, found ${actualPaths.size}.`);
  }

  const expectedRelationships = new Set(
    activeRows.filter((row) => row.managerName).map((row) => `${activeUsersByName.get(normalize(row.name))}:${activeUsersByName.get(normalize(row.managerName!))}`),
  );
  const actualRelationships = new Set(relationships.map((row) => `${row.subordinateUserId}:${row.managerUserId}`));
  if (actualRelationships.size !== expectedRelationships.size || [...actualRelationships].some((edge) => !expectedRelationships.has(edge))) {
    throw new Error(`Production contains relationships outside the authoritative hierarchy: expected ${expectedRelationships.size}, found ${actualRelationships.size}.`);
  }

  const vacancyAccounts = vacancies.filter((vacancy) => activeUsersByName.has(normalize(vacancy.name)));
  if (vacancyAccounts.length) throw new Error(`Vacancies unexpectedly have active accounts: ${vacancyAccounts.map((row) => row.name).join(', ')}`);

  const michaelId = activeUsersByName.get(normalize('Michael Antonyo'))!;
  const inScopeMichaelReports = relationships.filter(
    (row) => String(row.managerUserId) === michaelId && sourceIds.has(String(row.subordinateUserId)),
  );
  const inScopeMichaelDescendants = paths.filter(
    (row) => String(row.ancestorUserId) === michaelId && sourceIds.has(String(row.sourceUserId)),
  );
  if (inScopeMichaelReports.length || inScopeMichaelDescendants.length) throw new Error('Michael Antonyo still has an in-scope report or descendant.');

  console.log(JSON.stringify({
    activeIdentities: activeRows.length,
    vacancies: vacancies.length,
    expectedDirectRelationships: activeRows.filter((row) => row.managerName).length,
    expectedMaterializedPaths: expectedPaths.size,
    verifiedDirectRelationships: true,
    verifiedMaterializedPaths: true,
    vacancyAccounts: 0,
    michaelInScopeDirectReports: 0,
    michaelInScopeDescendants: 0,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
