import assert from "node:assert/strict";
import { test } from "node:test";
import { loginSchema, passwordSchema, registerSchema } from "../src/modules/auth/auth.schemas.js";

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
  assert.equal(loginSchema.safeParse({ email: "test@example.com", password: "legacy" }).success, true);
});
