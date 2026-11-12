import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { sql } from "drizzle-orm";
import { env } from "./config/env.js";
import { db } from "./db/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { categoryRouter } from "./modules/categories/category.routes.js";
import { snippetRouter } from "./modules/snippets/snippet.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", env.trustProxyHops);
  // Keep query tokens out of referrers while preserving Origin on same-site HTML form posts.
  app.use(helmet({ referrerPolicy: { policy: "strict-origin" } }));
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "X-Client-Platform"],
    }),
  );
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/ready", async (_req, res) => {
    try {
      await db.execute(sql`select 1`);
      res.json({ status: "ready" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });
  app.use(
    "/api",
    rateLimit({
      windowMs: 60 * 1000,
      limit: 120,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { message: "Too many requests. Please try again in a minute." },
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "16kb" }));
  app.use(cookieParser());
  app.use("/api", (req, res, next) => {
    // Reject cross-origin browser writes, including login CSRF and cookie-authenticated requests.
    const origin = req.header("origin");
    const safeMethod = ["GET", "HEAD", "OPTIONS"].includes(req.method);
    const allowed =
      origin && [new URL(env.publicApiUrl).origin, ...env.corsOrigins].includes(origin);
    if (
      (!safeMethod && origin && !allowed) ||
      (!safeMethod && req.header("sec-fetch-site") === "cross-site" && !allowed)
    ) {
      res.status(403).json({ message: "This origin is not allowed." });
      return;
    }
    next();
  });
  app.get("/", (_req, res) => {
    res.json({ name: "Snippet Store" });
  });
  app.use("/api/auth", authRouter);
  app.use("/api/categories", categoryRouter);
  app.use("/api/snippets", snippetRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
