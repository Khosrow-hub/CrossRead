import { config } from "dotenv";
config({ path: ".env.test" });

process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://crossread:crossread_dev@127.0.0.1:5434/crossread_test";