import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer, type Socket } from "node:net";
import { once } from "node:events";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { eq } from "drizzle-orm";

test("production authentication and account isolation", { timeout: 60000 }, async (t) => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  assert.ok(
    databaseUrl,
    "Set TEST_DATABASE_URL to an isolated PostgreSQL database whose name ends in _test.",
  );
  const target = new URL(databaseUrl);
  assert.match(target.pathname, /_test$/, "Never run these tests against an application database.");
  const messages: string[] = [];
  const sockets = new Set<Socket>();
  const smtp = createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.write("220 localhost ESMTP test\r\n");
    let pending = "";
    let data = false;
    let message = "";
    socket.on("data", (chunk) => {
      pending += chunk.toString();
      while (pending.includes("\r\n")) {
        const end = pending.indexOf("\r\n");
        const line = pending.slice(0, end);
        pending = pending.slice(end + 2);
        if (data) {
          if (line === ".") {
            data = false;
            messages.push(message);
            message = "";
            socket.write("250 accepted\r\n");
          } else message += line + "\n";
        } else if (line.startsWith("EHLO")) socket.write("250 localhost\r\n");
        else if (line === "DATA") {
          data = true;
          socket.write("354 send message\r\n");
        } else if (line === "QUIT") socket.end("221 bye\r\n");
        else socket.write("250 ok\r\n");
      }
    });
  }).listen(0, "127.0.0.1");
  await once(smtp, "listening");
  const smtpPort = (smtp.address() as { port: number }).port;
  Object.assign(process.env, {
    NODE_ENV: "test",
    DATABASE_URL: databaseUrl,
    REQUIRE_EMAIL_VERIFICATION: "true",
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: String(smtpPort),
    SMTP_FROM: "test@example.com",
    CORS_ORIGIN: "https://app.example.com",
    PUBLIC_API_URL: "http://127.0.0.1:3000",
    TRUST_PROXY_HOPS: "0",
  });
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASSWORD;
  const { db, pool } = await import("../src/db/index.js");
  const { users, sessions, authTokens, snippets, categories } = await import("../src/db/schema.js");
  const { hashToken, hashPassword, verifyPassword } =
    await import("../src/modules/auth/password.js");
  const { createApp } = await import("../src/app.js");
  const createdIds: number[] = [];
  t.after(async () => {
    for (const id of createdIds) await db.delete(users).where(eq(users.id, id));
    await pool.end();
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve) => smtp.close(() => resolve()));
  });
  await migrate(db, { migrationsFolder: "drizzle" });
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  );
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  async function request(
    path: string,
    method = "GET",
    body?: unknown,
    token?: string,
    extra: Record<string, string> = {},
  ) {
    const response = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Client-Platform": "native",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    return {
      status: response.status,
      headers: response.headers,
      body: text.startsWith("{") ? JSON.parse(text) : text,
    };
  }
  function emailToken(purpose: string) {
    const message = [...messages]
      .reverse()
      .map((message) => message.replace(/=\n/g, "").replace(/=3D/g, "="))
      .find((message) => message.includes(`/api/auth/${purpose}?token=`));
    assert.ok(message, `Expected a ${purpose} email through SMTP`);
    // Nodemailer may wrap lines using quoted-printable encoding.
    const match = message
      .replace(/=\n/g, "")
      .replace(/=3D/g, "=")
      .match(/token=([a-f0-9]{64})/);
    assert.ok(match);
    return match[1]!;
  }
  const suffix = Date.now();
  const email = `one-${suffix}@example.com`;
  const secondEmail = `two-${suffix}@example.com`;
  const password = "a very strong password 123";
  let token = "";
  let secondToken = "";
  let userId = 0;
  let categoryId = 0;
  let snippetId = 0;

  await t.test("rejects anonymous access to every private resource", async () => {
    for (const [path, method] of [
      ["/api/categories", "GET"],
      ["/api/categories", "POST"],
      ["/api/categories/1", "DELETE"],
      ["/api/snippets", "GET"],
      ["/api/auth/me", "GET"],
    ]) {
      assert.equal((await request(path!, method!)).status, 401);
    }
    assert.equal((await request("/ready")).status, 200);
  });
  await t.test("validates passwords and sends verification through SMTP", async () => {
    assert.equal(
      (await request("/api/auth/register", "POST", { email, password: "short" })).status,
      400,
    );
    const result = await request("/api/auth/register", "POST", {
      email: `  ${email.toUpperCase()}  `,
      password,
    });
    assert.equal(result.status, 202);
    assert.equal(result.body.data.requiresVerification, true);
    assert.equal(result.body.data.token, undefined);
    const [user] = await db.select().from(users).where(eq(users.email, email));
    assert.ok(user);
    userId = user.id;
    createdIds.push(userId);
    assert.equal(user.emailVerifiedAt, null);
    assert.equal(await verifyPassword(password, user.passwordHash), true);
    assert.equal((await request("/api/auth/login", "POST", { email, password })).status, 403);
    const verify = emailToken("verify");
    assert.equal((await request(`/api/auth/verify?token=${verify}`)).status, 200);
    assert.equal(
      (await request("/api/auth/login", "POST", { email, password })).status,
      403,
      "GET email scanner must not consume verification",
    );
    assert.equal((await request("/api/auth/verify", "POST", { token: verify })).status, 200);
    assert.equal((await request("/api/auth/verify", "POST", { token: verify })).status, 400);
  });
  await t.test("logs in, hashes session credentials, and protects browser writes", async () => {
    assert.equal(
      (await request("/api/auth/login", "POST", { email, password: "wrong" })).status,
      401,
    );
    assert.equal(
      (
        await request("/api/auth/login", "POST", {
          email: `missing-${suffix}@example.com`,
          password,
        })
      ).status,
      401,
    );
    const result = await request("/api/auth/login", "POST", { email, password });
    assert.equal(result.status, 200);
    token = result.body.data.token;
    assert.match(token, /^[a-f0-9]{64}$/);
    const [session] = await db.select().from(sessions).where(eq(sessions.userId, userId));
    assert.ok(session);
    assert.equal(session.tokenHash, hashToken(token));
    assert.notEqual(session.tokenHash, token);
    const me = await request("/api/auth/me", "GET", undefined, token);
    assert.equal(me.body.data.email, email);
    assert.equal(me.headers.get("cache-control"), "no-store");
    assert.equal(me.headers.get("x-powered-by"), null);
    assert.ok(me.headers.get("content-security-policy"));
    assert.equal(me.headers.get("referrer-policy"), "strict-origin");
    assert.equal(
      (
        await request("/api/categories", "POST", { name: "Attack" }, token, {
          Origin: "https://evil.example.com",
        })
      ).status,
      403,
    );
    const browser = await request("/api/auth/login", "POST", { email, password }, undefined, {
      "X-Client-Platform": "web",
    });
    assert.equal(browser.body.data.token, undefined);
    const cookie = browser.headers.get("set-cookie");
    assert.ok(cookie);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.equal(
      (
        await request("/api/auth/me", "GET", undefined, undefined, {
          Cookie: cookie.split(";")[0]!,
        })
      ).status,
      200,
    );
  });
  await t.test("isolates users, categories, and snippet mutations", async () => {
    assert.equal(
      (await request("/api/auth/register", "POST", { email: secondEmail, password })).status,
      202,
    );
    const [second] = await db.select().from(users).where(eq(users.email, secondEmail));
    assert.ok(second);
    createdIds.push(second.id);
    const verified = await fetch(base + "/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: emailToken("verify") }),
    });
    assert.equal(verified.status, 200);
    await verified.text();
    secondToken = (await request("/api/auth/login", "POST", { email: secondEmail, password })).body
      .data.token;
    const firstCategories = (await request("/api/categories", "GET", undefined, token)).body.data;
    assert.equal(firstCategories.length, 4);
    categoryId = firstCategories[0].id;
    const secondCategories = (await request("/api/categories", "GET", undefined, secondToken)).body
      .data;
    assert.ok(
      secondCategories.every(
        (category: { id: number }) =>
          !firstCategories.some((first: { id: number }) => first.id === category.id),
      ),
    );
    assert.equal(
      (await request(`/api/categories/${categoryId}`, "DELETE", undefined, secondToken)).status,
      404,
    );
    const payload = { title: "Private", content: "private code", categoryId };
    assert.equal((await request("/api/snippets", "POST", payload, secondToken)).status, 400);
    const snippet = await request("/api/snippets", "POST", payload, token);
    assert.equal(snippet.status, 201);
    snippetId = snippet.body.data.id;
    assert.equal(
      (await request("/api/snippets", "GET", undefined, secondToken)).body.data.length,
      0,
    );
    for (const method of ["GET", "PUT", "DELETE"]) {
      assert.equal(
        (
          await request(
            `/api/snippets/${snippetId}`,
            method,
            method === "PUT" ? { ...payload, categoryId: secondCategories[0].id } : undefined,
            secondToken,
          )
        ).status,
        404,
      );
    }
    assert.equal(
      (await request("/api/categories", "POST", { name: "Personal" }, token)).status,
      201,
    );
    assert.equal(
      (await request("/api/categories", "POST", { name: "Personal" }, secondToken)).status,
      201,
    );
    assert.equal(
      (await request("/api/categories", "POST", { name: "Personal" }, token)).status,
      409,
    );
  });
  await t.test("reset links expire, are single use, and revoke every old session", async () => {
    assert.equal((await request("/api/auth/forgot-password", "POST", { email })).status, 200);
    const reset = emailToken("reset");
    const [stored] = await db
      .select()
      .from(authTokens)
      .where(eq(authTokens.tokenHash, hashToken(reset)));
    assert.ok(stored);
    assert.notEqual(stored.tokenHash, reset);
    const nextPassword = "a different long password 456";
    assert.equal(
      (await request("/api/auth/reset", "POST", { token: reset, password: nextPassword })).status,
      200,
    );
    assert.equal(
      (await request("/api/auth/reset", "POST", { token: reset, password: nextPassword })).status,
      400,
    );
    assert.equal((await request("/api/auth/me", "GET", undefined, token)).status, 401);
    assert.equal((await request("/api/auth/login", "POST", { email, password })).status, 401);
    token = (await request("/api/auth/login", "POST", { email, password: nextPassword })).body.data
      .token;
    assert.ok(token);
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(sessions.tokenHash, hashToken(token)));
    assert.equal((await request("/api/auth/me", "GET", undefined, token)).status, 401);
    token = (await request("/api/auth/login", "POST", { email, password: nextPassword })).body.data
      .token;
    await db.insert(authTokens).values({
      tokenHash: hashToken("a".repeat(64)),
      purpose: "reset",
      userId,
      expiresAt: new Date(Date.now() - 1000),
    });
    assert.equal(
      (await request("/api/auth/reset", "POST", { token: "a".repeat(64), password: nextPassword }))
        .status,
      400,
    );
  });
  await t.test("logout revokes copied tokens and account deletion cascades data", async () => {
    assert.equal((await request("/api/auth/logout", "POST", {}, secondToken)).status, 204);
    assert.equal((await request("/api/auth/me", "GET", undefined, secondToken)).status, 401);
    assert.equal(
      (await request("/api/auth/account", "DELETE", { password: "wrong" }, token)).status,
      401,
    );
    assert.equal(
      (
        await request(
          "/api/auth/account",
          "DELETE",
          { password: "a different long password 456" },
          token,
        )
      ).status,
      204,
    );
    assert.equal((await db.select().from(snippets).where(eq(snippets.userId, userId))).length, 0);
    assert.equal(
      (await db.select().from(categories).where(eq(categories.userId, userId))).length,
      0,
    );
    assert.equal((await db.select().from(sessions).where(eq(sessions.userId, userId))).length, 0);
    assert.equal(
      (await db.select().from(authTokens).where(eq(authTokens.userId, userId))).length,
      0,
    );
  });
  await t.test("provides a browser account-deletion flow with password confirmation", async () => {
    assert.equal((await request("/api/auth/delete-account")).status, 200);
    assert.equal(
      (await request("/api/auth/delete-account", "POST", { email: secondEmail, password })).status,
      400,
    );
    const deleted = await fetch(base + "/api/auth/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ email: secondEmail, password, confirm: "delete" }),
    });
    assert.equal(deleted.status, 200);
    assert.match(await deleted.text(), /Account deleted/);
    assert.equal((await db.select().from(users).where(eq(users.email, secondEmail))).length, 0);
  });
  await t.test("rate limits repeated authentication attempts", async () => {
    let status = 0;
    for (let i = 0; i < 35; i++) status = (await request("/api/auth/login", "POST", {})).status;
    assert.equal(status, 429);
  });
  await t.test("password hashing supports long Unicode passwords without truncation", async () => {
    const long = "🔐".repeat(30);
    const hash = await hashPassword(long);
    assert.equal(await verifyPassword(long, hash), true);
    assert.equal(await verifyPassword(long + "x", hash), false);
  });
});
