import "dotenv/config";

export const env = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret:
    process.env.JWT_SECRET ??
    (process.env.NODE_ENV === "production"
      ? (() => {
          throw new Error("JWT_SECRET is required in production.");
        })()
      : "dev-secret-change-me"),
};
