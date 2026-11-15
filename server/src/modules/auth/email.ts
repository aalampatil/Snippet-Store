import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import { AppError } from "../../middlewares/error-handler.js";

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

function emailLayout(title: string, body: string) {
  return `<!doctype html><html lang="en"><body style="margin:0;padding:32px 16px;background:#f5f7f8;color:#182229;font-family:Arial,sans-serif"><div style="max-width:480px;margin:auto;padding:32px;background:#fff;border:1px solid #e1e6eb;border-radius:16px"><p style="color:#176b4b;font-size:18px;font-weight:bold;margin:0 0 32px">&lt;/&gt; snippetstore.</p><h1 style="font-size:24px;line-height:32px">${title}</h1>${body}<p style="font-size:12px;color:#697784;line-height:20px;margin-top:32px">Keep this email private. Snippet Store will never ask you to share a sign-in code.</p></div></body></html>`;
}

export async function deliverEmail(message: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  try {
    if (!env.emailFrom) throw new Error("Missing email sender");
    if (env.emailProvider === "resend") {
      if (!env.resendApiKey) throw new Error("Missing Resend credentials");
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.emailFrom,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          html: message.html,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        // Never log provider bodies, which can contain recipient details.
        console.error("Resend email delivery failed:", response.status);
        throw new Error("Email provider rejected request");
      }
    } else {
      if (!transport) throw new Error("SMTP is not configured");
      await transport.sendMail({ from: env.emailFrom, ...message });
    }
  } catch {
    throw new AppError("We couldn’t send your email. Please try again shortly.", 503);
  }
}

export async function sendCodeEmail(email: string, code: string, purpose: "login" | "delete") {
  const title = purpose === "delete" ? "Confirm account deletion" : "Your sign-in code";
  const explanation =
    purpose === "delete"
      ? "Use this code to permanently delete your Snippet Store account and all its data."
      : "Enter this code in Snippet Store to sign in or create your account.";
  await deliverEmail({
    to: email,
    subject:
      purpose === "delete"
        ? "Confirm deletion of your Snippet Store account"
        : "Your Snippet Store sign-in code",
    text: `${explanation}\n\nYour code: ${code}\n\nThis code expires in 10 minutes and can be used once. If you didn’t request this, ignore this email.`,
    html: emailLayout(
      title,
      `<p style="color:#505f6b;line-height:24px">${explanation}</p><p style="font-family:monospace;font-size:36px;font-weight:bold;letter-spacing:8px;text-align:center;background:#e4f4eb;color:#176b4b;padding:24px 12px;border-radius:10px">${code}</p><p style="color:#505f6b;font-size:14px;line-height:24px">This code expires in <strong>10 minutes</strong> and can be used once. If you didn’t request it, you can ignore this email.</p>`,
    ),
  });
}

export async function sendAuthEmail(email: string, token: string, purpose: "verify" | "reset") {
  const url = new URL(`/api/auth/${purpose}`, env.publicApiUrl);
  url.searchParams.set("token", token);
  const title = purpose === "verify" ? "Verify your email" : "Reset your password";
  const expiry = purpose === "verify" ? "24 hours" : "30 minutes";
  await deliverEmail({
    to: email,
    subject:
      purpose === "verify"
        ? "Verify your Snippet Store email"
        : "Reset your Snippet Store password",
    text: `${title} using this link:\n\n${url.toString()}\n\nThis link expires in ${expiry}. If you did not request this, ignore this email.`,
    html: emailLayout(
      title,
      `<p style="color:#505f6b;line-height:24px">Follow the link below to ${title.toLowerCase()}.</p><p style="margin:28px 0"><a href="${url.toString()}" style="display:inline-block;background:#176b4b;color:white;padding:14px 20px;border-radius:8px;text-decoration:none">${title}</a></p><p style="color:#697784;font-size:13px;line-height:22px">This link expires in ${expiry}. If you didn’t request it, ignore this email.</p>`,
    ),
  });
}
