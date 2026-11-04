import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Check your .env.local file.");
}

const RETRYABLE = new Set(["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EPIPE"]);

function createPool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
    max: 5,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });

  pool.on("error", (err) => {
    console.error("[db] idle client error", err.message);
  });

  return pool;
}

export const pool =
  process.env.NODE_ENV === "production"
    ? (globalThis as unknown as { pool?: Pool }).pool ??= createPool()
    : createPool();

const base = drizzle(pool, { schema });

// Wrap the pool's query method so that a connection closed mid handshake
// is retried once. On Windows with Docker Desktop on WSL2, the first
// attempt through the port proxy can be dropped without reaching the
// container. A retry with a fresh connection goes through. This is the
// same strategy every production pg client uses on this platform.
const originalQuery = pool.query.bind(pool);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pool as any).query = async (text: any, params?: any, cb?: any) => {
  const execute = () =>
    typeof params === "function"
      ? originalQuery(text, params)
      : originalQuery(text, params, cb);
  try {
    return await execute();
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code && RETRYABLE.has(code)) {
      return await execute();
    }
    throw err;
  }
};

export const db = base;