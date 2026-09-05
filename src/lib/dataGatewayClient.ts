/**
 * REP TRACK — Centralized Server-Only Cloudflare D1 Data Gateway Client
 *
 * Connects the Next.js application layer to Cloudflare D1 via the secured Cloudflare Worker API.
 * This file is STRICTLY server-only. It must NEVER be bundled or executed in the browser.
 */

if (typeof window !== 'undefined') {
  throw new Error('dataGatewayClient can only be imported in a server-side environment.');
}

const DEFAULT_API_URL = 'https://rep-track-d1-api-dev.martinemilapps.workers.dev';
const DEFAULT_API_SECRET = 'rep-track-dev-internal-secret-2026';

function getApiUrl(): string {
  const url = process.env.REP_TRACK_DATA_API_URL || DEFAULT_API_URL;
  return url.replace(/\/+$/, '');
}

function getApiSecret(): string {
  return process.env.REP_TRACK_DATA_API_SECRET || DEFAULT_API_SECRET;
}

interface WorkerApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  results?: T[];
  rows?: unknown[][];
  meta?: Record<string, unknown>;
  batchRows?: { rows: unknown[][] }[];
}

async function fetchWorkerApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiUrl();
  const secret = getApiSecret();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${secret}`);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = (data as { error?: string })?.error || `HTTP ${response.status} from Data API`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const dataGatewayClient = {
  /**
   * Directly executes a parameterized query for Drizzle's sqlite-proxy driver.
   */
  async executeDrizzleProxy(
    sql: string,
    params: unknown[],
    method: 'run' | 'all' | 'values' | 'get'
  ): Promise<{ rows: unknown }> {
    const data = await fetchWorkerApi<WorkerApiResponse>('/api/query', {
      method: 'POST',
      body: JSON.stringify({ sql, params, method }),
    });

    if (!data.success) {
      throw new Error(data.error || 'D1 query failed');
    }

    if (method === 'get') {
      return { rows: data.rows !== undefined ? data.rows : undefined };
    }

    return { rows: data.rows || [] };
  },

  /**
   * Executes a batch of queries for Drizzle's sqlite-proxy driver.
   */
  async executeDrizzleProxyBatch(
    queries: { sql: string; params: unknown[]; method: 'run' | 'all' | 'values' | 'get' }[]
  ): Promise<{ rows: unknown }[]> {
    const data = await fetchWorkerApi<WorkerApiResponse>('/api/batch', {
      method: 'POST',
      body: JSON.stringify({
        statements: queries.map((q) => ({
          sql: q.sql,
          params: q.params,
          method: q.method,
        })),
      }),
    });

    if (!data.success) {
      throw new Error(data.error || 'D1 batch failed');
    }

    if (data.batchRows && Array.isArray(data.batchRows)) {
      return data.batchRows.map((b) => ({ rows: b.rows || [] }));
    }

    return (data.results || []).map((r) => ({ rows: r || [] }));
  },

  /**
   * Helper: Execute an arbitrary parameterized query returning array of object records.
   */
  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const data = await fetchWorkerApi<WorkerApiResponse<T>>('/api/query', {
      method: 'POST',
      body: JSON.stringify({ sql, params }),
    });

    if (!data.success) {
      throw new Error(data.error || 'D1 query failed');
    }

    return data.results || [];
  },

  /**
   * Helper: Health check verifying connectivity and D1 binding status.
   */
  async health(): Promise<{ service: string; environment: string; d1_binding: string }> {
    const baseUrl = getApiUrl();
    const res = await fetch(`${baseUrl}/health`, { cache: 'no-store' });
    return res.json();
  },

  /**
   * Session operations routed through dedicated Worker endpoints or D1 queries
   */
  sessions: {
    async get(token: string) {
      try {
        const res = await fetchWorkerApi<{ success: boolean; session?: unknown }>(
          `/api/sessions/${encodeURIComponent(token)}`
        );
        return res.session || null;
      } catch {
        return null;
      }
    },
    async create(data: { id: string; userId: string; expiresAt: Date | string }) {
      return fetchWorkerApi<{ success: boolean }>('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          id: data.id,
          userId: data.userId,
          expiresAt: typeof data.expiresAt === 'string' ? data.expiresAt : data.expiresAt.toISOString(),
        }),
      });
    },
    async destroy(token: string) {
      try {
        await fetchWorkerApi<{ success: boolean }>(`/api/sessions/${encodeURIComponent(token)}`, {
          method: 'DELETE',
        });
      } catch {
        // Ignore deletion errors
      }
    },
  },

  /**
   * Representative operations
   */
  representatives: {
    async list() {
      const res = await fetchWorkerApi<{ success: boolean; representatives: unknown[] }>(
        '/api/representatives'
      );
      return res.representatives || [];
    },
    async get(id: string) {
      const res = await fetchWorkerApi<{ success: boolean; representative: unknown }>(
        `/api/representatives/${encodeURIComponent(id)}`
      );
      return res.representative || null;
    },
    async update(id: string, patch: Record<string, unknown>) {
      const res = await fetchWorkerApi<{ success: boolean; representative?: unknown }>(
        `/api/representatives/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(patch),
        }
      );
      return res;
    },
  },

  /**
   * Coverage metrics
   */
  coverage: {
    async get(repId: string) {
      const res = await fetchWorkerApi<{ success: boolean; coverage: unknown }>(
        `/api/coverage/${encodeURIComponent(repId)}`
      );
      return res.coverage || null;
    },
  },
};
