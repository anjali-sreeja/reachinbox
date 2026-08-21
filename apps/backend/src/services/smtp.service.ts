/**
 * SMTP Service
 *
 * Provides reusable email sending via Nodemailer with Ethereal SMTP support.
 * Reads configuration from environment variables or auto-provisions Ethereal test accounts.
 */

import nodemailer from "nodemailer";
import type { SendMailOptions, SentMessageInfo, Transporter } from "nodemailer";
import { env } from "../config/env";

export interface SmtpCredentials {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
}

export interface SendEmailInput {
  from: string;
  to: string;
  subject: string;
  body: string;
  smtpCredentials?: SmtpCredentials;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string | null;
}

// Cached default transporter instance for shared use
let defaultTransporterPromise: Promise<Transporter<SentMessageInfo>> | null = null;

/**
 * Creates a Nodemailer transporter using provided credentials,
 * configured environment variables, or an auto-generated Ethereal test account.
 */
export async function getTransporter(credentials?: SmtpCredentials): Promise<Transporter<SentMessageInfo>> {
  const host = credentials?.host || env.SMTP_HOST;
  const port = credentials?.port || env.SMTP_PORT || 587;
  const user = credentials?.user || env.SMTP_USER;
  const pass = credentials?.pass || env.SMTP_PASSWORD || env.SMTP_PASS;

  // 1. If explicit credentials are provided / configured
  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  // 2. Otherwise, use or create cached Ethereal test account
  if (!defaultTransporterPromise) {
    defaultTransporterPromise = (async () => {
      console.log("📬  Creating Ethereal SMTP test account...");
      const testAccount = await nodemailer.createTestAccount();
      console.log(`✅  Ethereal test account created: ${testAccount.user}`);

      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    })().catch((err: unknown) => {
      defaultTransporterPromise = null;
      throw err;
    });
  }

  return defaultTransporterPromise;
}

/**
 * Reusable function to send an email through Ethereal / configured SMTP.
 *
 * @param input SendEmailInput with from, to, subject, body, and optional credentials
 * @returns SendEmailResult with messageId and Ethereal preview URL
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const transporter = await getTransporter(input.smtpCredentials);

  const mailOptions: SendMailOptions = {
    from: input.from,
    to: input.to,
    subject: input.subject,
    text: input.body,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      ${input.body.replace(/\n/g, "<br/>")}
    </div>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    const rawPreviewUrl = nodemailer.getTestMessageUrl(info);
    const previewUrl = typeof rawPreviewUrl === "string" ? rawPreviewUrl : null;

    if (previewUrl) {
      console.log(`🔗 [Ethereal Preview] Email to <${input.to}> viewable at: ${previewUrl}`);
    }

    return {
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`❌ [SMTP Error] Failed sending to ${input.to}:`, detail);
    throw new Error(`SMTP delivery failed: ${detail}`, { cause: error });
  }
}
