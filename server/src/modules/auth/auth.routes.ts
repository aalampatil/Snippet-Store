import { Router, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { cookieOptions, requestToken, requireAuth, sessionCookie } from "../../middlewares/auth.js";
import { consumeAuthToken, deleteAccount, getUserById, loginUser, registerUser, requestAuthEmail, revokeSession } from "./auth.service.js";

export const authRouter = Router();
authRouter.use((_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
export const passwordSchema = z.string().min(15, "Use at least 15 characters.").max(128, "Use no more than 128 characters.");
const emailSchema = z.string().trim().toLowerCase().email().max(255);
const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(200) });
const registerSchema = z.object({ email: emailSchema, password: passwordSchema });
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please try again in 15 minutes." } });
const emailLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false,
  message: { message: "Too many email requests. Please try again in an hour." } });

function sessionResponse(req: Request, res: Response, result: Awaited<ReturnType<typeof loginUser>>, status = 200) {
  // Browser sessions use HttpOnly cookies; native clients explicitly request bearer credentials.
  if (req.header("x-client-platform") === "native") res.status(status).json({ data: result });
  else {
    res.cookie(sessionCookie, result.token, { ...cookieOptions, expires: result.expiresAt });
    res.status(status).json({ data: { user: result.user, expiresAt: result.expiresAt } });
  }
}

authRouter.post("/register", authLimit, emailLimit, asyncHandler(async (req, res) => {
  const result = await registerUser(registerSchema.parse(req.body));
  if ("requiresVerification" in result) res.status(202).json({ data: result });
  else sessionResponse(req, res, result, 201);
}));
authRouter.post("/login", authLimit, asyncHandler(async (req, res) => {
  sessionResponse(req, res, await loginUser(loginSchema.parse(req.body)));
}));
authRouter.get("/me", requireAuth, asyncHandler(async (req, res) => {
  res.json({ data: await getUserById(req.user!.id) });
}));
authRouter.post("/logout", asyncHandler(async (req, res) => {
  const token = requestToken(req);
  if (token) await revokeSession(token);
  res.clearCookie(sessionCookie, cookieOptions);
  res.status(204).send();
}));
authRouter.post("/forgot-password", authLimit, emailLimit, asyncHandler(async (req, res) => {
  const { email } = z.object({ email: emailSchema }).parse(req.body);
  res.json({ data: await requestAuthEmail(email, "reset") });
}));
authRouter.post("/resend-verification", authLimit, emailLimit, asyncHandler(async (req, res) => {
  const { email } = z.object({ email: emailSchema }).parse(req.body);
  res.json({ data: await requestAuthEmail(email, "verify") });
}));
authRouter.delete("/account", requireAuth, authLimit, asyncHandler(async (req, res) => {
  const { password } = z.object({ password: z.string().min(1).max(200) }).parse(req.body);
  await deleteAccount(req.user!.id, password);
  res.clearCookie(sessionCookie, cookieOptions);
  res.status(204).send();
}));

function page(title: string, body: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} · Snippet Store</title></head><body><main><h1>${title}</h1>${body}</main></body></html>`;
}
// Render's HTTPS URL hosts these pages; a custom domain or installed app is not required.
for (const purpose of ["verify", "reset"] as const) {
  authRouter.get(`/${purpose}`, authLimit, (req, res) => {
    const parsed = tokenSchema.safeParse(req.query.token);
    if (!parsed.success) { res.status(400).type("html").send(page("Invalid link", "<p>Request a new email from the app.</p>")); return; }
    const title = purpose === "verify" ? "Verify your email" : "Reset your password";
    const passwordField = purpose === "reset"
      ? '<p><label>New password (15–128 characters) <input name="password" type="password" minlength="15" maxlength="128" autocomplete="new-password" required></label></p>' : "";
    res.type("html").send(page(title, `<form method="post" action="/api/auth/${purpose}"><input type="hidden" name="token" value="${parsed.data}">${passwordField}<button type="submit">${title}</button></form><p>If you did not request this, close this page.</p>`));
  });
  authRouter.post(`/${purpose}`, authLimit, asyncHandler(async (req, res) => {
    const token = tokenSchema.parse(req.body.token);
    const password = purpose === "reset" ? passwordSchema.parse(req.body.password) : undefined;
    await consumeAuthToken(token, purpose, password);
    res.type("html").send(page(purpose === "verify" ? "Email verified" : "Password updated", "<p>Return to Snippet Store and sign in.</p>"));
  }));
}
