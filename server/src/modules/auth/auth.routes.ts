import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { cookieOptions, requestToken, requireAuth, sessionCookie } from "../../middlewares/auth.js";
import { authLimit, emailLimit } from "./auth.limits.js";
import { authPagesRouter } from "./auth.pages.js";
import {
  accountDeletionSchema,
  emailRequestSchema,
  loginSchema,
  registerSchema,
  verifyEmailCodeSchema,
} from "./auth.schemas.js";
import {
  deleteAccount,
  getUserById,
  loginUser,
  registerUser,
  requestAuthEmail,
  revokeSession,
} from "./auth.service.js";
import { deleteAccountByCode, requestEmailCode, verifyLoginCode } from "./otp.service.js";

export const authRouter = Router();
authRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

function sessionResponse(
  req: Request,
  res: Response,
  result: Awaited<ReturnType<typeof loginUser>>,
  status = 200,
) {
  // Browser sessions use HttpOnly cookies; native clients explicitly request bearer credentials.
  if (req.header("x-client-platform") === "native") res.status(status).json({ data: result });
  else {
    res.cookie(sessionCookie, result.token, { ...cookieOptions, expires: result.expiresAt });
    res.status(status).json({ data: { user: result.user, expiresAt: result.expiresAt } });
  }
}

authRouter.post(
  "/otp/request",
  authLimit,
  emailLimit,
  asyncHandler(async (req, res) => {
    const { email } = emailRequestSchema.parse(req.body);
    res.status(202).json({ data: await requestEmailCode(email) });
  }),
);
authRouter.post(
  "/otp/verify",
  authLimit,
  asyncHandler(async (req, res) => {
    sessionResponse(req, res, await verifyLoginCode(verifyEmailCodeSchema.parse(req.body)));
  }),
);

authRouter.post(
  "/account/deletion-code",
  requireAuth,
  authLimit,
  emailLimit,
  asyncHandler(async (req, res) => {
    const user = await getUserById(req.user!.id);
    if (!user) {
      res.status(401).json({ message: "Please sign in again." });
      return;
    }
    res.status(202).json({ data: await requestEmailCode(user.email, "delete") });
  }),
);

authRouter.post(
  "/register",
  authLimit,
  emailLimit,
  asyncHandler(async (req, res) => {
    const result = await registerUser(registerSchema.parse(req.body));
    if ("requiresVerification" in result) res.status(202).json({ data: result });
    else sessionResponse(req, res, result, 201);
  }),
);
authRouter.post(
  "/login",
  authLimit,
  asyncHandler(async (req, res) => {
    sessionResponse(req, res, await loginUser(loginSchema.parse(req.body)));
  }),
);
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ data: await getUserById(req.user!.id) });
  }),
);
authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = requestToken(req);
    if (token) await revokeSession(token);
    res.clearCookie(sessionCookie, cookieOptions);
    res.status(204).send();
  }),
);
authRouter.post(
  "/forgot-password",
  authLimit,
  emailLimit,
  asyncHandler(async (req, res) => {
    const { email } = emailRequestSchema.parse(req.body);
    res.json({ data: await requestAuthEmail(email, "reset") });
  }),
);
authRouter.post(
  "/resend-verification",
  authLimit,
  emailLimit,
  asyncHandler(async (req, res) => {
    const { email } = emailRequestSchema.parse(req.body);
    res.json({ data: await requestAuthEmail(email, "verify") });
  }),
);
authRouter.delete(
  "/account",
  requireAuth,
  authLimit,
  asyncHandler(async (req, res) => {
    const input = accountDeletionSchema.parse(req.body);
    if ("password" in input) await deleteAccount(req.user!.id, input.password);
    else {
      const user = await getUserById(req.user!.id);
      if (!user) {
        res.status(401).json({ message: "Please sign in again." });
        return;
      }
      await deleteAccountByCode({ ...input, email: user.email });
    }
    res.clearCookie(sessionCookie, cookieOptions);
    res.status(204).send();
  }),
);

authRouter.use(authPagesRouter);
