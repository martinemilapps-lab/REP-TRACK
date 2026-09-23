import { createClient, Client } from '@libsql/client';
import { FALLBACK_SQL } from './fallbackData';

let localClient: Client | null = null;
let initPromise: Promise<Client> | null = null;

export async function getLocalFallbackClient(): Promise<Client> {
  if (localClient) return localClient;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const client = createClient({ url: ':memory:' });
    try {
      await client.execute('PRAGMA foreign_keys = OFF;');
      const statements = FALLBACK_SQL.split(/;\s*[\r\n]+/)
        .map((s) => s.replace(/^--.*$/gm, '').trim())
        .filter((s) => s.length > 0);

      const batchSize = 100;
      for (let i = 0; i < statements.length; i += batchSize) {
        const chunk = statements.slice(i, i + batchSize);
        try {
          await client.batch(
            chunk.map((sql) => ({ sql, args: [] })),
            'deferred'
          );
        } catch {
          for (const s of chunk) {
            try {
              await client.execute(s);
            } catch {
              // Ignore individual statement errors
            }
          }
        }
      }
    } catch (err) {
      console.warn('[LocalFallbackDb] Warning initializing fallback db:', err);
    }

    try {
      await client.execute('ALTER TABLE users ADD COLUMN business_line INTEGER;');
    } catch {}
    try {
      await client.execute('ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0;');
    } catch {}

    localClient = client;
    return localClient;
  })();

  return initPromise;
}

export async function executeLocalFallback(
  sql: string,
  params: unknown[],
  method: 'run' | 'all' | 'values' | 'get'
): Promise<{ rows: unknown }> {
  try {
    const client = await getLocalFallbackClient();
    const res = await client.execute({ sql, args: params as any[] });

    if (method === 'run') {
      return { rows: [] };
    }

    if (method === 'get') {
      if (!res.rows || res.rows.length === 0) {
        return { rows: undefined };
      }
      const firstRow = res.rows[0];
      const rowArr = res.columns.map((col) => (firstRow as any)[col]);
      return { rows: rowArr };
    }

    // method === 'all' | 'values'
    const rows = res.rows.map((row) => res.columns.map((col) => (row as any)[col]));
    return { rows };
  } catch (err) {
    console.error('[LocalFallbackDb] Query error:', err);
    if (method === 'get') return { rows: undefined };
    return { rows: [] };
  }
}

export async function queryLocalFallback<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  try {
    const client = await getLocalFallbackClient();
    const res = await client.execute({ sql, args: params as any[] });
    return (res.rows as unknown as T[]) || [];
  } catch (err) {
    console.error('[LocalFallbackDb] Query error:', err);
    return [];
  }
}
