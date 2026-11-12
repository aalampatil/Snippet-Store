import { lt } from "drizzle-orm";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { db, pool } from "./db/index.js";
import { authTokens, sessions } from "./db/schema.js";

async function start() {
  await pool.query("select 1");
  const server = createApp().listen(env.port, "0.0.0.0", () => console.log(`Server listening on port ${env.port}`));
  const cleanup = setInterval(() => {
    void Promise.all([
      db.delete(sessions).where(lt(sessions.expiresAt, new Date())),
      db.delete(authTokens).where(lt(authTokens.expiresAt, new Date())),
    ]).catch(() => console.error("Expired credential cleanup failed."));
  }, 60 * 60 * 1000);
  cleanup.unref();
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    clearInterval(cleanup);
    const deadline = setTimeout(() => process.exit(1), 25000);
    deadline.unref();
    server.close(() => { void pool.end().then(() => { clearTimeout(deadline); process.exit(0); }); });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
start().catch(() => { console.error("Server startup failed. Check database connectivity and configuration."); process.exit(1); });
