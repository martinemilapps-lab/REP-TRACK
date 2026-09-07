import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function assertExplicitMigrationTarget(target: string | undefined, approved: boolean): void {
  if (!approved || !target?.trim()) throw new Error('Explicit D1 target and apply flag are required.');
  const url = new URL(target.trim());
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Invalid D1 gateway target.');
  }
}

/** No connection or execution on import. Errors deliberately propagate. */
export async function applyStep19Migration(executor: { execute(sql: string): Promise<unknown> }) {
  const sql = readFileSync(resolve('scripts/migrations/step19_manager_personal.sql'), 'utf8');
  const statements = sql.replace(/^--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean);
  for (const statement of statements) await executor.execute(statement);
}
