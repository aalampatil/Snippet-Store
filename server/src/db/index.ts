import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

export const pool = new Pool({ connectionString: env.databaseUrl, max: 10, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000 });
pool.on("error", (error) => console.error("Unexpected database pool error:", error.message));
export const db = drizzle(pool, { schema });
