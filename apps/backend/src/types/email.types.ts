/**
 * Zod schemas and inferred TypeScript types for Email endpoints.
 */

import { z } from "zod";
import { EmailStatus } from "@prisma/client";

// ─── Schedule Email ───────────────────────────────────────────────────────────

export const scheduleEmailSchema = z.object({
  userId: z.string().optional(),
  senderId: z.string().cuid({ message: "senderId must be a valid CUID" }),
  recipient: z.string().email({ message: "recipient must be a valid email" }),
  subject: z
    .string()
    .min(1, "subject is required")
    .max(998, "subject must be ≤ 998 characters (RFC 5321)"),
  body: z.string().min(1, "body is required"),
  scheduledAt: z
    .string()
    .datetime({ message: "scheduledAt must be an ISO 8601 datetime string" })
    .refine(
      (val) => new Date(val).getTime() > Date.now() - 1000,
      "scheduledAt must not be in the past"
    ),
});

export type ScheduleEmailDto = z.infer<typeof scheduleEmailSchema>;

// ─── List Scheduled Emails query ─────────────────────────────────────────────

export const scheduledEmailsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  senderId: z.string().cuid().optional(),
  recipient: z.string().email().optional(),
});

export type ScheduledEmailsQuery = z.infer<typeof scheduledEmailsQuerySchema>;

// ─── List Sent Emails query ───────────────────────────────────────────────────

export const sentEmailsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  senderId: z.string().cuid().optional(),
  recipient: z.string().email().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type SentEmailsQuery = z.infer<typeof sentEmailsQuerySchema>;

// ─── Email response shape ─────────────────────────────────────────────────────

export interface EmailResponse {
  id: string;
  userId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt: string | null;
  status: EmailStatus;
  jobId: string | null;
  attempts: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
