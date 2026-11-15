import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import { and, eq, inArray } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { testSmtp } from "./helpers/smtp.js";

test("email OTP authentication and deletion", { timeout: 60000 }, async (t) => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  assert.ok(databaseUrl, "Set TEST_DATABASE_URL to an isolated local test database.");
  assert.match(new URL(databaseUrl).pathname, /_test$/);
  const smtp = await testSmtp();
  Object.assign(process.env, {
    NODE_ENV: "test",
    DATABASE_URL: databaseUrl,
    EMAIL_PROVIDER: "smtp",
    EMAIL_FROM: "test@example.com",
    REQUIRE_EMAIL_VERIFICATION: "true",
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: String(smtp.port),
    SMTP_USER: "",
    SMTP_PASSWORD: "",
    PUBLIC_API_URL: "http://127.0.0.1:3000",
    CORS_ORIGIN: "https://app.example.com",
    TRUST_PROXY_HOPS: "0",
  });
  const { db, pool } = await import("../src/db/index.js");
  const { users, sessions, emailChallenges, categories, snippets, authTokens } = await import(
    "../src/db/schema.js"
  );
  const { hashToken, hashPassword } = await import("../src/modules/auth/password.js");
  const { requestEmailCode, verifyLoginCode, deleteAccountByCode } = await import(
    "../src/modules/auth/otp.service.js"
  );
  const { createApp } = await import("../src/app.js");
  await migrate(db, { migrationsFolder: "drizzle" });
  const emails: string[] = [];
  const makeEmail = (name: string) => {
    const value = `otp-${name}-${Date.now()}-${emails.length}@example.com`;
    emails.push(value);
    return value;
  };
  const server = createApp().listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (emails.length) {
      await db.delete(users).where(inArray(users.email, emails));
      await db.delete(emailChallenges).where(inArray(emailChallenges.email, emails));
    }
    await pool.end();
    await smtp.close();
  });
  async function request(
    path: string,
    method = "POST",
    body?: object,
    token?: string,
    browser = false,
  ) {
    const response = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Client-Platform": browser ? "web" : "native",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    return {
      status: response.status,
      headers: response.headers,
      body: text.startsWith("{") ? JSON.parse(text) : text,
    };
  }
  const lastCode = () => {
    const message = smtp.messages.at(-1)?.replace(/=\n/g, "").replace(/=3D/g, "=");
    const code = message?.match(/Your code: (\d{6})/)?.[1];
    assert.ok(code, "Expected an OTP email through SMTP");
    return code;
  };
  const rowFor = async (email: string, purpose = "login") =>
    (
      await db
        .select()
        .from(emailChallenges)
        .where(and(eq(emailChallenges.email, email), eq(emailChallenges.purpose, purpose)))
    )[0];
  const unlockResend = (email: string, purpose = "login") =>
    db
      .update(emailChallenges)
      .set({ sentAt: new Date(Date.now() - 61000) })
      .where(and(eq(emailChallenges.email, email), eq(emailChallenges.purpose, purpose)));
  const invalid = (operation: Promise<unknown>) =>
    assert.rejects(
      operation,
      (error: unknown) => error instanceof Error && /invalid or expired/.test(error.message),
    );

  await t.test("sends a code without creating an account or exposing the code", async () => {
    assert.equal(
      (await request("/api/auth/otp/request", "POST", { email: "invalid" })).status,
      400,
    );
    const email = makeEmail("new");
    const response = await request("/api/auth/otp/request", "POST", {
      email: `  ${email.toUpperCase()} `,
    });
    assert.equal(response.status, 202);
    assert.match(response.body.data.challengeId, /^[a-f0-9]{64}$/);
    assert.equal(response.body.data.code, undefined);
    assert.equal((await db.select().from(users).where(eq(users.email, email))).length, 0);
    const row = await rowFor(email);
    assert.ok(row);
    assert.equal(row.challengeHash, hashToken(response.body.data.challengeId));
    assert.notEqual(row.codeHash, hashToken(lastCode()));
    assert.equal(response.headers.get("cache-control"), "no-store");
  });

  await t.test(
    "verifies mailbox ownership, seeds categories, and issues a native session",
    async () => {
      const email = makeEmail("native");
      const challenge = await requestEmailCode(email);
      const code = lastCode();
      assert.equal(
        (
          await request("/api/auth/otp/verify", "POST", {
            email,
            challengeId: challenge.challengeId,
            code: "12345",
          })
        ).status,
        400,
      );
      const response = await request("/api/auth/otp/verify", "POST", {
        email,
        challengeId: challenge.challengeId,
        code,
      });
      assert.equal(response.status, 200);
      assert.match(response.body.data.token, /^[a-f0-9]{64}$/);
      const [user] = await db.select().from(users).where(eq(users.email, email));
      assert.ok(user?.emailVerifiedAt);
      assert.equal(user.passwordHash, null);
      assert.equal(
        (await db.select().from(categories).where(eq(categories.userId, user.id))).length,
        4,
      );
      const [session] = await db.select().from(sessions).where(eq(sessions.userId, user.id));
      assert.ok(session);
      assert.equal(session.tokenHash, hashToken(response.body.data.token));
      assert.equal(
        (await request("/api/auth/me", "GET", undefined, response.body.data.token)).status,
        200,
      );
      await invalid(verifyLoginCode({ email, challengeId: challenge.challengeId, code }));
      assert.equal((await rowFor(email))?.codeHash, null);
    },
  );

  await t.test(
    "browser verification uses HttpOnly cookies and hides bearer credentials",
    async () => {
      const email = makeEmail("browser");
      const challenge = await requestEmailCode(email);
      const response = await request(
        "/api/auth/otp/verify",
        "POST",
        { email, challengeId: challenge.challengeId, code: lastCode() },
        undefined,
        true,
      );
      assert.equal(response.status, 200);
      assert.equal(response.body.data.token, undefined);
      assert.match(response.headers.get("set-cookie") || "", /HttpOnly/);
      assert.match(response.headers.get("set-cookie") || "", /SameSite=Lax/);
    },
  );

  await t.test("existing verified passwords continue to work", async () => {
    const email = makeEmail("password");
    const password = "Existing password 123";
    await db
      .insert(users)
      .values({ email, passwordHash: await hashPassword(password), emailVerifiedAt: new Date() });
    const challenge = await requestEmailCode(email);
    await verifyLoginCode({ email, challengeId: challenge.challengeId, code: lastCode() });
    assert.equal((await request("/api/auth/login", "POST", { email, password })).status, 200);
    assert.equal((await db.select().from(users).where(eq(users.email, email))).length, 1);
  });

  await t.test("discards unverified pre-registration passwords and credentials", async () => {
    const email = makeEmail("preregistration");
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash: await hashPassword("Attacker password 123") })
      .returning();
    assert.ok(user);
    await db
      .insert(sessions)
      .values({
        userId: user.id,
        tokenHash: hashToken("a".repeat(64)),
        expiresAt: new Date(Date.now() + 60000),
      });
    await db
      .insert(authTokens)
      .values({
        userId: user.id,
        tokenHash: hashToken("b".repeat(64)),
        purpose: "reset",
        expiresAt: new Date(Date.now() + 60000),
      });
    const challenge = await requestEmailCode(email);
    await verifyLoginCode({ email, challengeId: challenge.challengeId, code: lastCode() });
    const [updated] = await db.select().from(users).where(eq(users.email, email));
    assert.equal(updated?.passwordHash, null);
    assert.ok(updated?.emailVerifiedAt);
    assert.equal(
      (await db.select().from(authTokens).where(eq(authTokens.userId, user.id))).length,
      0,
    );
    assert.equal(
      (
        await db
          .select()
          .from(sessions)
          .where(eq(sessions.tokenHash, hashToken("a".repeat(64))))
      ).length,
      0,
    );
    assert.equal(
      (await request("/api/auth/login", "POST", { email, password: "Attacker password 123" }))
        .status,
      401,
    );
  });

  await t.test("rejects expiry, wrong addresses, and wrong challenge secrets", async () => {
    const email = makeEmail("expiry");
    const challenge = await requestEmailCode(email);
    const code = lastCode();
    await invalid(
      verifyLoginCode({
        email: makeEmail("wrongaddress"),
        challengeId: challenge.challengeId,
        code,
      }),
    );
    await invalid(verifyLoginCode({ email, challengeId: "f".repeat(64), code }));
    await db
      .update(emailChallenges)
      .set({ expiresAt: new Date(Date.now() - 1) })
      .where(eq(emailChallenges.email, email));
    await invalid(verifyLoginCode({ email, challengeId: challenge.challengeId, code }));
    assert.equal((await db.select().from(users).where(eq(users.email, email))).length, 0);
  });

  await t.test("persists five incorrect attempts and invalidates the challenge", async () => {
    const email = makeEmail("attempts");
    const challenge = await requestEmailCode(email);
    const code = lastCode();
    const wrong = code === "000000" ? "000001" : "000000";
    for (let attempt = 1; attempt <= 5; attempt++) {
      await invalid(verifyLoginCode({ email, challengeId: challenge.challengeId, code: wrong }));
      assert.equal((await rowFor(email))?.attempts, attempt);
    }
    assert.equal((await rowFor(email))?.codeHash, null);
    await invalid(verifyLoginCode({ email, challengeId: challenge.challengeId, code }));
  });

  await t.test("enforces resend cooldown, replaces old codes, and caps hourly sends", async () => {
    const email = makeEmail("resends");
    const first = await requestEmailCode(email);
    const oldCode = lastCode();
    await assert.rejects(requestEmailCode(email), /wait 60 seconds/);
    await unlockResend(email);
    const second = await requestEmailCode(email);
    const newCode = lastCode();
    await invalid(verifyLoginCode({ email, challengeId: first.challengeId, code: oldCode }));
    await verifyLoginCode({ email, challengeId: second.challengeId, code: newCode });
    for (let i = 0; i < 3; i++) {
      await unlockResend(email);
      await requestEmailCode(email);
    }
    await unlockResend(email);
    await assert.rejects(requestEmailCode(email), /Too many codes/);
    assert.equal((await rowFor(email))?.requestCount, 5);
  });

  await t.test("only one concurrent verification can consume a code", async () => {
    const email = makeEmail("concurrent");
    const challenge = await requestEmailCode(email);
    const code = lastCode();
    const results = await Promise.allSettled([
      verifyLoginCode({ email, challengeId: challenge.challengeId, code }),
      verifyLoginCode({ email, challengeId: challenge.challengeId, code }),
    ]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
    const [user] = await db.select().from(users).where(eq(users.email, email));
    assert.ok(user);
    assert.equal((await db.select().from(sessions).where(eq(sessions.userId, user.id))).length, 1);
  });

  await t.test(
    "delivery failures roll back replacements without losing a usable code",
    async () => {
      const email = makeEmail("delivery");
      const first = await requestEmailCode(email);
      const code = lastCode();
      await unlockResend(email);
      const before = await rowFor(email);
      smtp.control.reject = true;
      try {
        await assert.rejects(requestEmailCode(email), /couldn’t send/);
      } finally {
        smtp.control.reject = false;
      }
      assert.equal((await rowFor(email))?.challengeHash, before?.challengeHash);
      assert.equal((await rowFor(email))?.requestCount, before?.requestCount);
      await verifyLoginCode({ email, challengeId: first.challengeId, code });
    },
  );

  await t.test("deletion requires a separate code and removes all account data", async () => {
    const email = makeEmail("delete");
    const login = await requestEmailCode(email);
    const loginCode = lastCode();
    const session = await verifyLoginCode({
      email,
      challengeId: login.challengeId,
      code: loginCode,
    });
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, session.user.id));
    assert.ok(category);
    await db
      .insert(snippets)
      .values({
        userId: session.user.id,
        categoryId: category.id,
        title: "Private",
        content: "private",
      });
    assert.equal(
      (
        await request(
          "/api/auth/account",
          "DELETE",
          { challengeId: login.challengeId, code: loginCode },
          session.token,
        )
      ).status,
      400,
    );
    const response = await request("/api/auth/account/deletion-code", "POST", {}, session.token);
    assert.equal(response.status, 202);
    const code = lastCode();
    await invalid(verifyLoginCode({ email, challengeId: response.body.data.challengeId, code }));
    const deleted = await request(
      "/api/auth/account",
      "DELETE",
      { challengeId: response.body.data.challengeId, code },
      session.token,
    );
    assert.equal(deleted.status, 204);
    assert.equal((await db.select().from(users).where(eq(users.email, email))).length, 0);
    assert.equal(
      (await db.select().from(categories).where(eq(categories.userId, session.user.id))).length,
      0,
    );
    assert.equal(
      (await db.select().from(snippets).where(eq(snippets.userId, session.user.id))).length,
      0,
    );
    assert.equal(
      (await db.select().from(sessions).where(eq(sessions.userId, session.user.id))).length,
      0,
    );
    assert.equal(
      (await db.select().from(emailChallenges).where(eq(emailChallenges.email, email))).length,
      0,
    );
    assert.equal((await request("/api/auth/me", "GET", undefined, session.token)).status, 401);
    await invalid(
      deleteAccountByCode({ email, challengeId: response.body.data.challengeId, code }),
    );
  });

  await t.test(
    "supports passwordless browser account deletion with explicit confirmation",
    async () => {
      const email = makeEmail("browser-delete");
      const login = await requestEmailCode(email);
      await verifyLoginCode({ email, challengeId: login.challengeId, code: lastCode() });
      const response = await request("/api/auth/delete-account/code", "POST", { email });
      assert.equal(response.status, 200);
      const challengeId = (response.body as string).match(
        /name="challengeId" value="([a-f0-9]{64})"/,
      )?.[1];
      assert.ok(challengeId);
      const code = lastCode();
      assert.equal(
        (await request("/api/auth/delete-account/confirm", "POST", { email, challengeId, code }))
          .status,
        400,
      );
      assert.equal(
        (
          await request("/api/auth/delete-account/confirm", "POST", {
            email,
            challengeId,
            code,
            confirm: "delete",
          })
        ).status,
        200,
      );
      assert.equal((await db.select().from(users).where(eq(users.email, email))).length, 0);
    },
  );
});
