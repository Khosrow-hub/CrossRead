import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Check your .env.local file.");
}

function createPool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
    keepAlive: true,
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

export const db = drizzle(pool, { schema });