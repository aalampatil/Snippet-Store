import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { authTokens, emailChallenges, sessions, users } from "../../db/schema.js";
import { AppError } from "../../middlewares/error-handler.js";
import { seedDefaultCategories } from "../categories/category.service.js";
import { issueSession } from "./auth.service.js";
import { sendCodeEmail } from "./email.js";
import { hashToken, newToken } from "./password.js";

type Purpose = "login" | "delete";
type CodeInput = { email: string; challengeId: string; code: string };
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
const lifetime = 10 * 60 * 1000;
const cooldown = 60 * 1000;
const windowLength = 60 * 60 * 1000;
const maxRequests = 5;
const maxAttempts = 5;
const invalidCode = "This code is invalid or expired. Try again or request a new code.";

// The random challenge secret lives only in the requesting client. The database
// holds its hash, so a six-digit code cannot be brute-forced from a database dump.
function codeDigest(input: CodeInput, purpose: Purpose) {
  return createHmac("sha256", input.challengeId)
    .update(`${purpose}:${input.email}:${input.code}`)
    .digest("hex");
}

export async function requestEmailCode(email: string, purpose: Purpose = "login") {
  const challengeId = newToken();
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expiresAt = await db.transaction(async (tx) => {
    // One row per address and purpose also makes limits effective across instances.
    await tx.insert(emailChallenges).values({ email, purpose }).onConflictDoNothing();
    const [current] = await tx
      .select()
      .from(emailChallenges)
      .where(and(eq(emailChallenges.email, email), eq(emailChallenges.purpose, purpose)))
      .for("update");
    if (!current) throw new AppError("Could not request a code. Please try again.", 503);
    const now = new Date();
    if (current.sentAt && now.getTime() - current.sentAt.getTime() < cooldown)
      throw new AppError("Please wait 60 seconds before requesting another code.", 429);
    const freshWindow = now.getTime() - current.windowStartedAt.getTime() >= windowLength;
    if (!freshWindow && current.requestCount >= maxRequests)
      throw new AppError(
        "Too many codes requested for this email. Please try again in an hour.",
        429,
      );
    const expiry = new Date(now.getTime() + lifetime);
    await tx
      .update(emailChallenges)
      .set({
        challengeHash: hashToken(challengeId),
        codeHash: codeDigest({ email, challengeId, code }, purpose),
        expiresAt: expiry,
        attempts: 0,
        sentAt: now,
        requestCount: freshWindow ? 1 : current.requestCount + 1,
        windowStartedAt: freshWindow ? now : current.windowStartedAt,
      })
      .where(and(eq(emailChallenges.email, email), eq(emailChallenges.purpose, purpose)));
    // A failed delivery rolls back the replacement, keeping a previous code usable.
    await sendCodeEmail(email, code, purpose);
    return expiry;
  });
  return {
    challengeId,
    expiresAt,
    resendAfterSeconds: 60,
    message: "Check your email for a six-digit code. It expires in 10 minutes.",
  };
}

async function consumeCode(tx: Transaction, input: CodeInput, purpose: Purpose) {
  const where = and(eq(emailChallenges.email, input.email), eq(emailChallenges.purpose, purpose));
  const [challenge] = await tx.select().from(emailChallenges).where(where).for("update");
  if (
    !challenge?.challengeHash ||
    challenge.challengeHash !== hashToken(input.challengeId) ||
    !challenge.codeHash ||
    !challenge.expiresAt ||
    challenge.expiresAt.getTime() <= Date.now() ||
    challenge.attempts >= maxAttempts
  )
    return false;
  const actual = Buffer.from(codeDigest(input, purpose), "hex");
  const expected = Buffer.from(challenge.codeHash, "hex");
  if (!timingSafeEqual(actual, expected)) {
    const attempts = challenge.attempts + 1;
    await tx
      .update(emailChallenges)
      .set({
        attempts,
        ...(attempts >= maxAttempts ? { codeHash: null, challengeHash: null } : {}),
      })
      .where(where);
    return false;
  }
  await tx
    .update(emailChallenges)
    .set({ codeHash: null, challengeHash: null, expiresAt: null })
    .where(where);
  return true;
}

export async function verifyLoginCode(input: CodeInput) {
  const result = await db.transaction(async (tx) => {
    // Return failures instead of throwing so incorrect-attempt counters commit.
    if (!(await consumeCode(tx, input, "login"))) return null;
    const [created] = await tx
      .insert(users)
      .values({ email: input.email, emailVerifiedAt: new Date() })
      .onConflictDoNothing({ target: users.email })
      .returning();
    let user = created;
    if (created) await seedDefaultCategories(created.id, tx);
    else {
      [user] = await tx.select().from(users).where(eq(users.email, input.email)).for("update");
      if (user && !user.emailVerifiedAt) {
        // A password chosen before mailbox ownership was proven must not survive
        // a passwordless signup (pre-registration account takeover).
        await tx
          .update(users)
          .set({ emailVerifiedAt: new Date(), passwordHash: null, updatedAt: new Date() })
          .where(eq(users.id, user.id));
        await tx.delete(sessions).where(eq(sessions.userId, user.id));
        await tx.delete(authTokens).where(eq(authTokens.userId, user.id));
      }
    }
    if (!user) throw new AppError("Could not sign in. Please request a new code.", 503);
    return issueSession({ id: user.id, email: user.email }, tx);
  });
  if (!result) throw new AppError(invalidCode, 400);
  return result;
}

export async function deleteAccountByCode(input: CodeInput) {
  const consumed = await db.transaction(async (tx) => {
    if (!(await consumeCode(tx, input, "delete"))) return false;
    await tx.delete(users).where(eq(users.email, input.email));
    await tx.delete(emailChallenges).where(eq(emailChallenges.email, input.email));
    return true;
  });
  if (!consumed) throw new AppError(invalidCode, 400);
}
