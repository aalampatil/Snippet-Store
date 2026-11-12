import type { Request, RequestHandler } from "express";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";
import { env } from "../config/env.js";
import { hashToken } from "../modules/auth/password.js";
import { AppError } from "./error-handler.js";

export type AuthUser = { id: number };
export const sessionCookie = env.production ? "__Host-snippet_session" : "snippet_session";
export const cookieOptions = { httpOnly: true, secure: env.production, sameSite: "lax" as const, path: "/" };
export function requestToken(req: Request): string | undefined {
  const header = req.header("authorization");
  if (header) return /^Bearer ([a-f0-9]{64})$/i.exec(header)?.[1];
  const cookie: unknown = req.cookies?.[sessionCookie];
  return typeof cookie === "string" && /^[a-f0-9]{64}$/.test(cookie) ? cookie : undefined;
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    const token = requestToken(req);
    if (!token) throw new AppError("Please sign in to continue.", 401);
    const [session] = await db.select({ userId: sessions.userId, verified: users.emailVerifiedAt })
      .from(sessions).innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date()))).limit(1);
    if (!session || (env.requireEmailVerification && !session.verified)) throw new AppError("Your session has expired. Please sign in again.", 401);
    req.user = { id: session.userId };
    next();
  } catch (error) { next(error); }
};
