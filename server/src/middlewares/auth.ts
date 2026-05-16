import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./error-handler.js";

export type AuthUser = {
  id: number;
};

type JwtPayload = {
  sub: string;
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");
  if (!header) {
    next(new AppError("Unauthorized.", 401));
    return;
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    next(new AppError("Unauthorized.", 401));
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const id = Number(payload.sub);
    if (!Number.isInteger(id) || id <= 0) {
      next(new AppError("Unauthorized.", 401));
      return;
    }

    req.user = { id };
    next();
  } catch {
    next(new AppError("Unauthorized.", 401));
  }
};

