/**
 * Email controller
 *
 * Delegates business logic to EmailService:
 * - Schedule emails via BullMQ delayed jobs and persist to PostgreSQL
 * - Retrieve scheduled and sent emails with filtering and pagination
 */

import type { Request, Response } from "express";
import type {
  ScheduleEmailDto,
  ScheduledEmailsQuery,
  SentEmailsQuery,
} from "../types/email.types";
import { EmailService } from "../services/email.service";
import { sendCreated, sendPaginated, buildPagination } from "../utils/apiResponse";

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/emails/schedule
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schedule an email for delivery.
 * Persists record to DB and enqueues delayed job in BullMQ.
 */
export async function scheduleEmail(
  req: Request,
  res: Response
): Promise<void> {
  const dto = req.body as ScheduleEmailDto;
  const authUserId = (req as Request & { user?: { id: string } }).user?.id;

  const email = await EmailService.scheduleEmail(dto, authUserId);

  sendCreated(res, email, "Email scheduled successfully");
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/emails/scheduled
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List all emails with status SCHEDULED or PROCESSING.
 * Supports pagination and optional filters (senderId, recipient).
 */
export async function getScheduledEmails(
  req: Request,
  res: Response
): Promise<void> {
  const query = req.query as unknown as ScheduledEmailsQuery;
  const authUserId = (req as Request & { user?: { id: string } }).user?.id;

  const { emails, total } = await EmailService.listScheduledEmails(query, authUserId);
  const pagination = buildPagination(query.page || 1, query.limit || 20, total);

  sendPaginated(res, emails, pagination, "Scheduled emails retrieved successfully");
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/emails/sent
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List all emails with status SENT.
 * Supports pagination and optional date range filters.
 */
export async function getSentEmails(
  req: Request,
  res: Response
): Promise<void> {
  const query = req.query as unknown as SentEmailsQuery;
  const authUserId = (req as Request & { user?: { id: string } }).user?.id;

  const { emails, total } = await EmailService.listSentEmails(query, authUserId);
  const pagination = buildPagination(query.page || 1, query.limit || 20, total);

  sendPaginated(res, emails, pagination, "Sent emails retrieved successfully");
}
