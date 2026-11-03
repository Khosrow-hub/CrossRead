import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// ---------------------------------------------------------------------------
// Validate environment before creating the pool.
// If DATABASE_URL is missing, fail loudly at startup, not on first query.
// ---------------------------------------------------------------------------

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Check your .env.local file. The connection string should point to port 5433, not 5432, because CrossRead's Postgres runs on the host port 5433."
  );
}

// ---------------------------------------------------------------------------
// Connection pool.
// A pool reuses connections across requests. It is the correct choice for a
// web app. A single connection would serialize every query.
// ---------------------------------------------------------------------------

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

// In development, Next.js hot reloads modules. Without caching the pool on
// globalThis, every file save would create a new pool and quickly exhaust
// Postgres connection slots. Production is fine because the process starts
// once, so we only cache in development.
if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

// ---------------------------------------------------------------------------
// Drizzle client.
// The schema is passed so that db.query.* has full type information.
// ---------------------------------------------------------------------------

export const db = drizzle(pool, { schema });