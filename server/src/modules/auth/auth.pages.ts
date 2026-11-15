import { Router } from "express";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { cookieOptions, sessionCookie } from "../../middlewares/auth.js";
import { authLimit, emailLimit } from "./auth.limits.js";
import {
  deleteAccountSchema,
  emailRequestSchema,
  passwordSchema,
  tokenSchema,
  verifyEmailCodeSchema,
} from "./auth.schemas.js";
import { consumeAuthToken, deleteAccountWithCredentials } from "./auth.service.js";
import { deleteAccountByCode, requestEmailCode } from "./otp.service.js";

export const authPagesRouter = Router();

function renderAuthPage(title: string, body: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} · Snippet Store</title></head><body><main><h1>${title}</h1>${body}</main></body></html>`;
}
authPagesRouter.get("/delete-account", (_req, res) => {
  res
    .type("html")
    .send(
      renderAuthPage(
        "Delete your Snippet Store account",
        '<p>This permanently deletes your account, snippets, categories, and active sessions. Database backups follow the hosting backup retention period.</p><h2>Confirm by email</h2><form method="post" action="/api/auth/delete-account/code"><p><label>Email <input name="email" type="email" autocomplete="email" maxlength="255" required></label></p><button type="submit">Send deletion code</button></form><details><summary>Delete using a password instead</summary><form method="post" action="/api/auth/delete-account"><p><label>Email <input name="email" type="email" autocomplete="email" maxlength="255" required></label></p><p><label>Password <input name="password" type="password" autocomplete="current-password" maxlength="200" required></label></p><p><label><input type="checkbox" name="confirm" value="delete" required> I understand this permanently deletes my account and data.</label></p><button type="submit">Permanently delete account</button></form></details>',
      ),
    );
});

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!,
  );

authPagesRouter.post(
  "/delete-account/code",
  authLimit,
  emailLimit,
  asyncHandler(async (req, res) => {
    const { email } = emailRequestSchema.parse(req.body);
    const challenge = await requestEmailCode(email, "delete");
    res
      .type("html")
      .send(
        renderAuthPage(
          "Check your email",
          `<p>A six-digit confirmation code was sent to ${escapeHtml(email)}. It expires in 10 minutes.</p><form method="post" action="/api/auth/delete-account/confirm"><input type="hidden" name="email" value="${escapeHtml(email)}"><input type="hidden" name="challengeId" value="${challenge.challengeId}"><p><label>Verification code <input name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" required></label></p><p><label><input type="checkbox" name="confirm" value="delete" required> Permanently delete my account and all its data.</label></p><button type="submit">Permanently delete account</button></form><p><a href="/api/auth/delete-account">Request another code or use a different email</a></p>`,
        ),
      );
  }),
);

authPagesRouter.post(
  "/delete-account/confirm",
  authLimit,
  asyncHandler(async (req, res) => {
    const input = verifyEmailCodeSchema
      .extend({ confirm: deleteAccountSchema.shape.confirm })
      .parse(req.body);
    await deleteAccountByCode(input);
    res.clearCookie(sessionCookie, cookieOptions);
    res
      .type("html")
      .send(
        renderAuthPage("Account deleted", "<p>Your account and its data have been deleted.</p>"),
      );
  }),
);
authPagesRouter.post(
  "/delete-account",
  authLimit,
  asyncHandler(async (req, res) => {
    const input = deleteAccountSchema.parse(req.body);
    await deleteAccountWithCredentials(input);
    res.clearCookie(sessionCookie, cookieOptions);
    res
      .type("html")
      .send(
        renderAuthPage("Account deleted", "<p>Your account and its data have been deleted.</p>"),
      );
  }),
);
// Render's HTTPS URL hosts these pages; a custom domain or installed app is not required.
for (const purpose of ["verify", "reset"] as const) {
  authPagesRouter.get(`/${purpose}`, authLimit, (req, res) => {
    const parsed = tokenSchema.safeParse(req.query.token);
    if (!parsed.success) {
      res
        .status(400)
        .type("html")
        .send(renderAuthPage("Invalid link", "<p>Request a new email from the app.</p>"));
      return;
    }
    const title = purpose === "verify" ? "Verify your email" : "Reset your password";
    const passwordField =
      purpose === "reset"
        ? '<p><label>New password (8–128 characters) <input name="password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label></p>'
        : "";
    res
      .type("html")
      .send(
        renderAuthPage(
          title,
          `<form method="post" action="/api/auth/${purpose}"><input type="hidden" name="token" value="${parsed.data}">${passwordField}<button type="submit">${title}</button></form><p>If you did not request this, close this page.</p>`,
        ),
      );
  });
  authPagesRouter.post(
    `/${purpose}`,
    authLimit,
    asyncHandler(async (req, res) => {
      const token = tokenSchema.parse(req.body.token);
      const password = purpose === "reset" ? passwordSchema.parse(req.body.password) : undefined;
      await consumeAuthToken(token, purpose, password);
      res
        .type("html")
        .send(
          renderAuthPage(
            purpose === "verify" ? "Email verified" : "Password updated",
            "<p>Return to Snippet Store and sign in.</p>",
          ),
        );
    }),
  );
}
