import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
  ) {
    super(message);
  }
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Route not found." });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Invalid request.",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ message: "Invalid JSON body." });
    return;
  }
  if (error && typeof error === "object" && "type" in error && error.type === "entity.too.large") {
    res.status(413).json({ message: "Request body is too large." });
    return;
  }
  // Log a classification, never SQL parameters, passwords, session tokens, or email links.
  console.error("Unhandled request error:", error instanceof Error ? error.name : "UnknownError");

  res.status(500).json({ message: "Internal server error." });
};
