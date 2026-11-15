import assert from "node:assert/strict";
import { test } from "node:test";
import {
  emailCodeSchema,
  loginSchema,
  passwordSchema,
  registerSchema,
  verifyEmailCodeSchema,
} from "../src/modules/auth/auth.schemas.js";

test("registration accepts eight characters and rejects seven", () => {
  const email = "test@example.com";
  assert.equal(registerSchema.safeParse({ email, password: "Pass123!" }).success, true);
  const short = registerSchema.safeParse({ email, password: "Pass12!" });
  assert.equal(short.success, false);
  if (!short.success) assert.equal(short.error.issues[0]?.message, "Use at least 8 characters.");
});

test("new passwords accept eight through 128 characters", () => {
  assert.equal(passwordSchema.safeParse("Reset12!").success, true);
  assert.equal(passwordSchema.safeParse("Reset1!").success, false);
  assert.equal(passwordSchema.safeParse("a".repeat(128)).success, true);
  assert.equal(passwordSchema.safeParse("a".repeat(129)).success, false);
});

test("login accepts existing passwords shorter than eight characters", () => {
  assert.equal(
    loginSchema.safeParse({ email: "test@example.com", password: "legacy" }).success,
    true,
  );
});

test("email codes require six digits and an unguessable challenge", () => {
  const input = { email: "  Test@EXAMPLE.com ", challengeId: "a".repeat(64), code: "012345" };
  assert.equal(verifyEmailCodeSchema.parse(input).email, "test@example.com");
  for (const code of ["12345", "1234567", "12abcd", 123456, " 123456 "])
    assert.equal(emailCodeSchema.safeParse({ ...input, code }).success, false);
  assert.equal(emailCodeSchema.safeParse({ ...input, challengeId: "guessable" }).success, false);
});
