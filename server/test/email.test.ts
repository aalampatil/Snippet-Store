import assert from "node:assert/strict";
import { test } from "node:test";

test("Resend sends authentication emails through its documented API", async (t) => {
  Object.assign(process.env, {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost/example_test",
    EMAIL_PROVIDER: "resend",
    EMAIL_FROM: "Snippet Store <test@example.com>",
    RESEND_API_KEY: "re_test_only",
  });
  const { sendCodeEmail, sendAuthEmail } = await import("../src/modules/auth/email.js");
  const messages: Record<string, unknown>[] = [];
  let status = 200;
  t.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(options.method, "POST");
    assert.equal((options.headers as Record<string, string>).Authorization, "Bearer re_test_only");
    assert.ok(options.signal);
    messages.push(JSON.parse(String(options.body)));
    return new Response(JSON.stringify({ id: "test-only-id" }), { status });
  });
  await sendCodeEmail("recipient@example.com", "012345", "login");
  assert.deepEqual(messages[0]?.to, ["recipient@example.com"]);
  assert.equal(messages[0]?.from, "Snippet Store <test@example.com>");
  assert.match(String(messages[0]?.text), /Your code: 012345/);
  assert.match(String(messages[0]?.html), /012345/);
  assert.doesNotMatch(String(messages[0]?.subject), /012345/);
  await sendCodeEmail("recipient@example.com", "654321", "delete");
  assert.match(String(messages[1]?.text), /permanently delete/);
  await sendAuthEmail("recipient@example.com", "a".repeat(64), "reset");
  assert.match(String(messages[2]?.text), /\/api\/auth\/reset\?token=/);
  status = 403;
  await assert.rejects(
    sendCodeEmail("recipient@example.com", "123456", "login"),
    (error) => error instanceof Error && error.message.includes("couldn’t send"),
  );
});
