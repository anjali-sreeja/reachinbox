/**
 * Environment configuration
 *
 * Validated at startup with Zod. The app will refuse to start if any
 * required variable is missing or has the wrong shape — no silent failures.
 */

import { z } from "zod";
import dotenv from "dotenv";

// Load .env before parsing
dotenv.config();

const envSchema = z.object({
  // ── Server ─────────────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  // ── Database ───────────────────────────────────────────────
  DATABASE_URL: z
    .string()
    .url()
    .startsWith("postgresql://", "DATABASE_URL must be a PostgreSQL connection string"),

  // ── Redis ──────────────────────────────────────────────────
  REDIS_HOST: z.string().min(1).default("localhost"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional().transform((v) => v || undefined),

  // ── JWT ────────────────────────────────────────────────────
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // ── Google OAuth ───────────────────────────────────────────
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),

  // ── CORS ───────────────────────────────────────────────────
  CORS_ORIGINS: z.string().default("http://localhost:5173"),

  // ── BullMQ / Worker ────────────────────────────────────────
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  MIN_EMAIL_DELAY_MS: z.coerce.number().int().nonnegative().default(2000),
  EMAIL_MIN_DELAY_MS: z.coerce.number().int().nonnegative().optional(),
  MAX_EMAILS_PER_HOUR: z.coerce.number().int().positive().default(200),
  EMAIL_HOURLY_LIMIT: z.coerce.number().int().positive().optional(),
  EMAIL_QUEUE_NAME: z.string().default("email-queue"),

  // ── SMTP (optional overrides; Ethereal auto-provisioned if blank) ──
  SMTP_HOST: z.string().optional().transform((v) => v || undefined),
  SMTP_PORT: z
    .preprocess(
      (v) => (v === "" || v === undefined ? undefined : Number(v)),
      z.number().int().positive().optional()
    )
    .optional(),
  SMTP_USER: z.string().optional().transform((v) => v || undefined),
  SMTP_PASS: z.string().optional().transform((v) => v || undefined),
  SMTP_PASSWORD: z.string().optional().transform((v) => v || undefined),
  SMTP_FROM: z.string().optional().transform((v) => v || undefined),
});

/**
 * Parsed and typed environment variables.
 * Import `env` everywhere instead of reading `process.env` directly.
 */
export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    console.error(
      "❌  Environment validation failed. Missing or invalid variables:\n" +
        formatted +
        "\n\nFix these in your .env file and restart."
    );
    process.exit(1);
  }

  return result.data;
}

export const env = parseEnv();

/** Derived helpers */
export const isDev = env.NODE_ENV === "development";
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

/** Comma-separated CORS_ORIGINS → string[] */
export const corsOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim());
