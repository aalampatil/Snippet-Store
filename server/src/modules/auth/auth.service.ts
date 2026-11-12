import { and, eq, gt } from "drizzle-orm";
import { env } from "../../config/env.js";
import { db } from "../../db/index.js";
import { authTokens, sessions, users } from "../../db/schema.js";
import { AppError } from "../../middlewares/error-handler.js";
import { hashPassword, hashToken, newToken, verifyPassword } from "./password.js";
import { sendAuthEmail } from "./email.js";
import { seedDefaultCategories } from "../categories/category.service.js";

// Perform an expensive password check even when an email does not exist.
const dummyHash = hashPassword(newToken());
const emailMessage = "If this email is eligible, an email will arrive shortly. Check your spam folder too.";

export async function registerUser(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);
  const created = await db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({
      email, passwordHash, emailVerifiedAt: env.requireEmailVerification ? null : new Date(),
    }).onConflictDoNothing({ target: users.email }).returning({ id: users.id, email: users.email });
    if (user) await seedDefaultCategories(user.id, tx);
    return user;
  });
  if (!created) {
    if (env.requireEmailVerification) return { requiresVerification: true as const, message: emailMessage };
    throw new AppError("Email is already registered.", 409);
  }
  if (env.requireEmailVerification) {
    await sendTokenEmail(created.id, email, "verify");
    return { requiresVerification: true as const, message: emailMessage };
  }
  return issueSession(created);
}

export async function loginUser(input: { email: string; password: string }) {
  const [user] = await db.select().from(users).where(eq(users.email, input.email.trim().toLowerCase())).limit(1);
  const ok = await verifyPassword(input.password, user?.passwordHash ?? await dummyHash);
  if (!user || !ok) throw new AppError("Invalid email or password.", 401);
  if (env.requireEmailVerification && !user.emailVerifiedAt) {
    throw new AppError("Verify your email before signing in. You can request another verification email.", 403);
  }
  if (user.passwordHash.startsWith("$2")) {
    await db.update(users).set({ passwordHash: await hashPassword(input.password), updatedAt: new Date() }).where(eq(users.id, user.id));
  }
  return issueSession({ id: user.id, email: user.email });
}

async function issueSession(user: { id: number; email: string }) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + env.sessionDays * 86400000);
  await db.insert(sessions).values({ tokenHash: hashToken(token), userId: user.id, expiresAt });
  return { token, user, expiresAt };
}

export async function getUserById(id: number) {
  const [user] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, id)).limit(1);
  return user;
}

export async function revokeSession(token: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}

export async function requestAuthEmail(email: string, purpose: "verify" | "reset") {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (user && (purpose === "reset" || !user.emailVerifiedAt)) await sendTokenEmail(user.id, user.email, purpose);
  return { message: emailMessage };
}

async function sendTokenEmail(userId: number, email: string, purpose: "verify" | "reset") {
  const token = newToken();
  // Multiple outstanding links remain usable until the first one is consumed.
  await db.insert(authTokens).values({
    tokenHash: hashToken(token), userId, purpose,
    expiresAt: new Date(Date.now() + (purpose === "verify" ? 86400000 : 1800000)),
  });
  await sendAuthEmail(email, token, purpose);
}

export async function consumeAuthToken(token: string, purpose: "verify" | "reset", password?: string) {
  const passwordHash = password ? await hashPassword(password) : undefined;
  await db.transaction(async (tx) => {
    // Serialize token consumption for this account, including links with different hashes.
    const [candidate] = await tx.select({ userId: authTokens.userId }).from(authTokens)
      .where(and(eq(authTokens.tokenHash, hashToken(token)), eq(authTokens.purpose, purpose), gt(authTokens.expiresAt, new Date()))).limit(1);
    if (!candidate) throw new AppError("This link is invalid or expired. Request a new email.", 400);
    await tx.select({ id: users.id }).from(users).where(eq(users.id, candidate.userId)).for("update");
    const [valid] = await tx.delete(authTokens).where(and(
      eq(authTokens.tokenHash, hashToken(token)), eq(authTokens.purpose, purpose), gt(authTokens.expiresAt, new Date()),
    )).returning();
    if (!valid) throw new AppError("This link has already been used.", 400);
    if (purpose === "verify") {
      await tx.update(users).set({ emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, valid.userId));
    } else {
      if (!passwordHash) throw new AppError("A new password is required.", 400);
      await tx.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, valid.userId));
      await tx.delete(sessions).where(eq(sessions.userId, valid.userId));
    }
    await tx.delete(authTokens).where(and(eq(authTokens.userId, valid.userId), eq(authTokens.purpose, purpose)));
  });
}

export async function deleteAccount(userId: number, password: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !await verifyPassword(password, user.passwordHash)) throw new AppError("Invalid password.", 401);
  await db.delete(users).where(eq(users.id, userId));
}

export async function deleteAccountWithCredentials(input: { email: string; password: string }) {
  const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  const ok = await verifyPassword(input.password, user?.passwordHash ?? await dummyHash);
  if (!user || !ok) throw new AppError("Invalid email or password.", 401);
  await db.delete(users).where(eq(users.id, user.id));
}
