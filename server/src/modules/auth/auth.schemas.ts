import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "Use no more than 128 characters.");
export const emailSchema = z.string().trim().toLowerCase().email().max(255);
export const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const accountPasswordSchema = z.object({ password: z.string().min(1).max(200) });
export const loginSchema = accountPasswordSchema.extend({ email: emailSchema });
export const registerSchema = z.object({ email: emailSchema, password: passwordSchema });
export const emailRequestSchema = z.object({ email: emailSchema });
export const emailCodeSchema = z.object({
  challengeId: tokenSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit code from your email."),
});
export const verifyEmailCodeSchema = emailCodeSchema.extend({ email: emailSchema });
export const accountDeletionSchema = z.union([accountPasswordSchema, emailCodeSchema]);
export const deleteAccountSchema = loginSchema.extend({ confirm: z.literal("delete") });
