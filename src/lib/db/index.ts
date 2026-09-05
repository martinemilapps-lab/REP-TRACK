import { createClient, Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const url = 'file:local.db';

// Singleton local client across invocations and dev hot-reloads
const globalForDb = global as unknown as {
  libsqlClient?: Client;
  drizzleDb?: ReturnType<typeof drizzle<typeof schema>>;
};

export const client =
  globalForDb.libsqlClient ??
  createClient({
    url,
  });

export const db =
  globalForDb.drizzleDb ??
  drizzle(client, {
    schema,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.libsqlClient = client;
  globalForDb.drizzleDb = db;
}

export * from './schema';
