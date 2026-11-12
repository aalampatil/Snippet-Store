import "dotenv/config";
import { z } from "zod";

const config = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, "DATABASE_URL must be a PostgreSQL URL."),
  CORS_ORIGIN: z.string().default(""),
  PUBLIC_API_URL: z.url().optional(),
  RENDER_EXTERNAL_URL: z.url().optional(),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  SESSION_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  REQUIRE_EMAIL_VERIFICATION: z.enum(["true", "false"]).optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
}).parse(process.env);

const production = config.NODE_ENV === "production";
const publicApiUrl = config.PUBLIC_API_URL ?? config.RENDER_EXTERNAL_URL ?? `http://localhost:${config.PORT}`;
const requireEmailVerification = config.REQUIRE_EMAIL_VERIFICATION !== "false";
const corsOrigins = config.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
if (corsOrigins.some((origin) => origin === "*" || new URL(origin).origin !== origin)) {
  throw new Error("CORS_ORIGIN must contain exact origins separated by commas; leave empty for native-only apps.");
}
if (production) {
  if (!publicApiUrl.startsWith("https://")) throw new Error("Production requires an HTTPS PUBLIC_API_URL (or RENDER_EXTERNAL_URL).");
  if (!requireEmailVerification) throw new Error("Email verification cannot be disabled in production.");
  if (!config.SMTP_HOST || !config.SMTP_FROM || !config.SMTP_USER || !config.SMTP_PASSWORD) {
    throw new Error("Production requires SMTP_HOST, SMTP_FROM, SMTP_USER, and SMTP_PASSWORD.");
  }
  if (corsOrigins.some((origin) => !origin.startsWith("https://"))) throw new Error("Production CORS origins must use HTTPS.");
}

export const env = {
  port: config.PORT, nodeEnv: config.NODE_ENV, production, databaseUrl: config.DATABASE_URL,
  corsOrigins, publicApiUrl, trustProxyHops: config.TRUST_PROXY_HOPS,
  sessionDays: config.SESSION_DAYS, requireEmailVerification,
  smtp: { host: config.SMTP_HOST, port: config.SMTP_PORT, user: config.SMTP_USER,
    password: config.SMTP_PASSWORD, from: config.SMTP_FROM },
};
