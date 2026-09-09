import assert from 'node:assert/strict';
import {
  assertAdminMigrationApproval,
  parseAdminMigrationCommand,
  runAdminMigrationMode,
} from '../src/lib/db/adminPhase1Migration';

const target = 'https://gateway.example.test';
const writePattern = /\b(CREATE|INSERT|UPDATE|DELETE|ALTER|DROP|REPLACE)\b/i;

async function main() {
  assert.throws(() => parseAdminMigrationCommand([], target), /exactly one mode/);
  assert.throws(() => parseAdminMigrationCommand(['--preflight-admin-phase1', '--apply-admin-phase1'], target), /exactly one mode/);
  assert.throws(() => parseAdminMigrationCommand(['--unknown'], target), /Unknown migration mode/);
  assert.throws(() => parseAdminMigrationCommand(['--preflight-admin-phase1'], undefined), /REP_TRACK_DATA_API_URL/);
  assert.throws(() => parseAdminMigrationCommand(['--apply-admin-phase1'], ''), /REP_TRACK_DATA_API_URL/);
  assert.throws(() => assertAdminMigrationApproval(target, false), /explicit --apply-admin-phase1/i);
  assert.doesNotThrow(() => assertAdminMigrationApproval(target, true));

  const preflightStatements: string[] = [];
  const readOnlyExecutor = {
    execute: async (sql: string) => {
      preflightStatements.push(sql);
      assert.equal(writePattern.test(sql), false, `preflight attempted a write: ${sql}`);
      return [{ name: 'sessions' }, { name: 'users' }];
    },
  };
  const preflight = await runAdminMigrationMode('preflight', readOnlyExecutor);
  assert.deepEqual(preflight.preflight.detectedTables, ['sessions', 'users']);
  assert.equal(preflightStatements.length, 1);
  assert.match(preflightStatements[0], /^SELECT /);

  const failedStatements: string[] = [];
  await assert.rejects(
    runAdminMigrationMode('apply', {
      execute: async (sql: string) => {
        failedStatements.push(sql);
        return [{ name: 'users' }];
      },
    }),
    /required tables missing/,
  );
  assert.equal(failedStatements.length, 1, 'failed preflight must prevent apply');
  assert.equal(failedStatements.some((sql) => writePattern.test(sql)), false);

  const applyStatements: string[] = [];
  await runAdminMigrationMode('apply', {
    execute: async (sql: string) => {
      applyStatements.push(sql);
      if (sql.startsWith('SELECT name FROM sqlite_master')) return [{ name: 'sessions' }, { name: 'users' }];
      return [];
    },
  });
  assert.equal(applyStatements[0].startsWith('SELECT '), true, 'apply mode must preflight first');
  assert.equal(applyStatements.some((sql) => writePattern.test(sql)), true, 'approved apply mode must retain migration behavior');
  assert.equal(applyStatements.at(-1)?.startsWith('SELECT type, name'), true, 'apply mode must verify last');

  console.log('Admin migration read-only preflight safety tests passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
