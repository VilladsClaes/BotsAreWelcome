import { createClient } from '@libsql/client';
import { SCHEMA } from './schema.js';

let client;
const ready = new WeakMap();

// One client per function instance. Vercel reuses instances between requests.
export function getDb() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new Error('TURSO_DATABASE_URL is not set');
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  return client;
}

// Creates the tables once per client. A failed attempt is retried on the next call.
export function ensureSchema(db) {
  if (!ready.has(db)) {
    const attempt = db
      .batch(
        SCHEMA.map((sql) => ({ sql, args: [] })),
        'write',
      )
      .catch((error) => {
        ready.delete(db);
        throw error;
      });
    ready.set(db, attempt);
  }
  return ready.get(db);
}
