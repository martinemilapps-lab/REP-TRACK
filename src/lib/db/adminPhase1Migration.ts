import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type AdminMigrationMode = 'preflight' | 'apply';
type MigrationExecutor = { execute(sql: string, params?: unknown[]): Promise<unknown> };

function requireMigrationTarget(target: string | undefined): URL {
  if (!target?.trim()) throw new Error('REP_TRACK_DATA_API_URL is required.');
  const url = new URL(target.trim());
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Invalid D1 gateway target.');
  }
  return url;
}

export function parseAdminMigrationCommand(args: string[], target: string | undefined): { mode: AdminMigrationMode; target: URL } {
  if (args.length !== 1) {
    throw new Error('Specify exactly one mode: --preflight-admin-phase1 or --apply-admin-phase1.');
  }
  const flag = args[0];
  if (flag !== '--preflight-admin-phase1' && flag !== '--apply-admin-phase1') {
    throw new Error('Unknown migration mode. Use --preflight-admin-phase1 or --apply-admin-phase1.');
  }
  return { mode: flag === '--preflight-admin-phase1' ? 'preflight' : 'apply', target: requireMigrationTarget(target) };
}

export function assertAdminMigrationApproval(target: string | undefined, approved: boolean): URL {
  if (!approved) throw new Error('Explicit --apply-admin-phase1 approval is required.');
  return requireMigrationTarget(target);
}

export async function preflightAdminMigration(executor: MigrationExecutor): Promise<{ detectedTables: string[] }> {
  const result = await executor.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'sessions') ORDER BY name");
  if (!Array.isArray(result)) throw new Error('Admin migration preflight failed: unexpected gateway response.');
  const detectedTables = [...new Set(result.map((row) => typeof row === 'object' && row ? String((row as { name?: unknown }).name ?? '') : '').filter(Boolean))].sort();
  const names = new Set(detectedTables);
  if (!names.has('users') || !names.has('sessions')) {
    throw new Error(`Admin migration preflight failed: required tables missing. Detected: ${detectedTables.join(', ') || 'none'}.`);
  }
  return { detectedTables };
}

export async function applyAdminPhase1Migration(executor: MigrationExecutor) {
  const source = readFileSync(resolve('scripts/migrations/admin_phase1_audit.sql'), 'utf8');
  const triggers: string[] = [];
  const protectedSource = source.replace(/CREATE TRIGGER[\s\S]*?END;/g, (statement) => {
    const marker = `__ADMIN_TRIGGER_${triggers.length}__`;
    triggers.push(statement.replace(/;\s*$/, ''));
    return `${marker};`;
  });
  const statements = protectedSource.replace(/^--.*$/gm, '').split(';').map((statement) => statement.trim()).filter(Boolean).map((statement) => {
    const match = statement.match(/^__ADMIN_TRIGGER_(\d+)__$/);
    return match ? triggers[Number(match[1])] : statement;
  });
  for (const statement of statements) await executor.execute(statement);
}

export async function verifyAdminPhase1Migration(executor: MigrationExecutor) {
  return executor.execute("SELECT type, name FROM sqlite_master WHERE type IN ('table', 'index', 'trigger') AND (name = 'admin_audit_events' OR name LIKE 'idx_admin_audit_%' OR name LIKE 'trg_admin_audit_%') ORDER BY type, name");
}

export async function runAdminMigrationMode(mode: AdminMigrationMode, executor: MigrationExecutor) {
  const preflight = await preflightAdminMigration(executor);
  if (mode === 'preflight') return { mode, preflight } as const;
  await applyAdminPhase1Migration(executor);
  const verification = await verifyAdminPhase1Migration(executor);
  return { mode, preflight, verification } as const;
}
