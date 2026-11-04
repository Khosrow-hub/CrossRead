import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Check your .env.local file.");
}

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: undefined,
    max: 5,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 10_000,
  });
}

const isProd = process.env.NODE_ENV === "production";

const globalForDb = globalThis as unknown as { pool?: Pool };

export const pool: Pool = isProd
  ? (globalForDb.pool ??= createPool())
  : createPool();

pool.on("error", (err) => {
  if (isProd) {
    console.error("[db] idle client error", err.message);
  }
});

export const db = drizzle(pool, { schema });