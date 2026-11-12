import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

function check(overrides: Record<string, string | undefined>) {
  const variables: NodeJS.ProcessEnv = {
    ...process.env,
    DOTENV_CONFIG_PATH: join(tmpdir(), "snippetstore-no-env-file"),
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://example:example@localhost/snippetstore_test",
    RENDER_EXTERNAL_URL: "https://snippetstore-example.onrender.com",
    CORS_ORIGIN: "",
    SMTP_HOST: "smtp.example.com",
    SMTP_FROM: "test@example.com",
    SMTP_USER: "example",
    SMTP_PASSWORD: "example",
    SMTP_PORT: "587",
    REQUIRE_EMAIL_VERIFICATION: "true",
    PORT: "3000",
    TRUST_PROXY_HOPS: "1",
    SESSION_DAYS: "7",
    ...overrides,
  };
  delete variables.PUBLIC_API_URL;
  if (overrides.PUBLIC_API_URL) variables.PUBLIC_API_URL = overrides.PUBLIC_API_URL;
  for (const [key, value] of Object.entries(overrides))
    if (value === undefined) delete variables[key];
  return spawnSync(
    process.execPath,
    ["--import", "tsx", "--eval", "import('./src/config/env.ts')"],
    {
      env: variables,
      encoding: "utf8",
      timeout: 10000,
    },
  );
}

test("production accepts Render HTTPS configuration", () => {
  assert.equal(check({}).status, 0);
});
test("production refuses missing mail credentials", () => {
  const result = check({ SMTP_PASSWORD: undefined });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Production requires SMTP/);
});
test("production refuses verification bypass", () => {
  const result = check({ REQUIRE_EMAIL_VERIFICATION: "false" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cannot be disabled/);
});
test("production refuses HTTP and wildcard CORS", () => {
  assert.notEqual(check({ PUBLIC_API_URL: "http://api.example.com" }).status, 0);
  assert.notEqual(check({ CORS_ORIGIN: "*" }).status, 0);
  assert.notEqual(check({ CORS_ORIGIN: "http://app.example.com" }).status, 0);
});
test("configuration rejects invalid database URLs and ports", () => {
  assert.notEqual(check({ DATABASE_URL: "not-a-database" }).status, 0);
  assert.notEqual(check({ PORT: "invalid" }).status, 0);
});
