import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

const transport = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      requireTLS: env.production && env.smtp.port !== 465,
      ...(env.smtp.user && env.smtp.password
        ? { auth: { user: env.smtp.user, pass: env.smtp.password } }
        : {}),
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })
  : null;

export async function sendAuthEmail(email: string, token: string, purpose: "verify" | "reset") {
  const url = new URL(`/api/auth/${purpose}`, env.publicApiUrl);
  url.searchParams.set("token", token);
  if (!transport)
    throw new Error(
      "SMTP is not configured. Configure SMTP or disable verification for local development.",
    );
  await transport.sendMail({
    from: env.smtp.from,
    to: email,
    subject:
      purpose === "verify"
        ? "Verify your Snippet Store email"
        : "Reset your Snippet Store password",
    text: `${purpose === "verify" ? "Verify your email" : "Reset your password"} using this link:\n\n${url.toString()}\n\nThis link expires in ${purpose === "verify" ? "24 hours" : "30 minutes"}. If you did not request this, ignore this email.`,
  });
}
