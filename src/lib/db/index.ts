import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';
import { dataGatewayClient } from '@/lib/dataGatewayClient';

/**
 * Primary Drizzle ORM database instance for REP TRACK.
 * Powered by the Cloudflare D1 Data Gateway via Cloudflare Worker.
 *
 * Cloudflare D1 is the FIRST and ONLY persistent database for REP TRACK.
 */
export const db = drizzle(
  async (sql, params, method) => {
    return (await dataGatewayClient.executeDrizzleProxy(sql, params, method)) as { rows: any[] };
  },
  async (queries) => {
    return (await dataGatewayClient.executeDrizzleProxyBatch(queries)) as { rows: any[] }[];
  },
  { schema }
);

export const client = {
  async execute(sql: string, params: unknown[] = []) {
    return dataGatewayClient.query(sql, params);
  },
};

export * from './schema';
