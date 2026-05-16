import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { env } from "../../config/env.js";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { AppError } from "../../middlewares/error-handler.js";

export async function registerUser(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    throw new AppError("Email is already registered.", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const [created] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      updatedAt: new Date(),
    })
    .returning({ id: users.id, email: users.email });

  if (!created) {
    throw new Error("User could not be created.");
  }

  return issueToken({ id: created.id, email: created.email });
}

export async function loginUser(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();

  const [user] = await db
    .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new AppError("Invalid email or password.", 401);
  }

  return issueToken({ id: user.id, email: user.email });
}

export async function getUserById(id: number) {
  const [user] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, id)).limit(1);
  return user;
}

function issueToken(user: { id: number; email: string }) {
  const token = jwt.sign({}, env.jwtSecret, { subject: String(user.id), expiresIn: "30d" });
  return { token, user };
}

