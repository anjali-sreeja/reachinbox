/**
 * Email Service
 *
 * Handles database operations and scheduling for emails.
 */

import { EmailStatus, type Email, type Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { scheduleEmailJob } from "../queues/email.queue";
import { AppError } from "../utils/AppError";
import type {
  ScheduleEmailDto,
  ScheduledEmailsQuery,
  SentEmailsQuery,
} from "../types/email.types";

export class EmailService {
  /**
   * Schedules an email by persisting it to PostgreSQL and enqueuing a BullMQ delayed job.
   */
  static async scheduleEmail(
    dto: ScheduleEmailDto,
    authUserId?: string
  ): Promise<Email> {
    // 1. Verify that the sender exists
    const sender = await prisma.sender.findUnique({
      where: { id: dto.senderId },
    });

    if (!sender) {
      throw AppError.notFound("Sender");
    }

    // 2. Resolve userId
    const targetUserId = authUserId || dto.userId || sender.userId;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw AppError.notFound("User");
    }

    const scheduledDate = new Date(dto.scheduledAt);
    const delayMs = Math.max(0, scheduledDate.getTime() - Date.now());

    // 3. Create the Email record in PostgreSQL with status SCHEDULED
    const email = await prisma.email.create({
      data: {
        userId: targetUserId,
        senderId: dto.senderId,
        recipient: dto.recipient,
        subject: dto.subject,
        body: dto.body,
        scheduledAt: scheduledDate,
        status: EmailStatus.SCHEDULED,
      },
    });

    // 4. Enqueue delayed job into BullMQ using deterministic email.id as jobId
    try {
      const job = await scheduleEmailJob(email.id, delayMs);

      // Update record with jobId
      const updatedEmail = await prisma.email.update({
        where: { id: email.id },
        data: {
          jobId: job.id ?? email.id,
        },
      });

      return updatedEmail;
    } catch (err: unknown) {
      // If queuing fails, mark email as FAILED to prevent dangling records
      const errorMsg = err instanceof Error ? err.message : String(err);
      await prisma.email.update({
        where: { id: email.id },
        data: {
          status: EmailStatus.FAILED,
          errorMessage: `Failed to enqueue job: ${errorMsg}`,
        },
      });
      throw AppError.internal(`Failed to schedule email job: ${errorMsg}`);
    }
  }

  /**
   * Retrieves paginated list of scheduled/processing emails.
   */
  static async listScheduledEmails(
    query: ScheduledEmailsQuery,
    userId?: string
  ): Promise<{ emails: Email[]; total: number }> {
    const { page = 1, limit = 20, senderId, recipient } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EmailWhereInput = {
      status: {
        in: [EmailStatus.SCHEDULED, EmailStatus.PROCESSING],
      },
      ...(userId && { userId }),
      ...(senderId && { senderId }),
      ...(recipient && { recipient: { contains: recipient, mode: "insensitive" } }),
    };

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: "asc" },
        include: {
          sender: {
            select: { id: true, email: true },
          },
        },
      }),
      prisma.email.count({ where }),
    ]);

    return { emails, total };
  }

  /**
   * Retrieves paginated list of successfully sent emails.
   */
  static async listSentEmails(
    query: SentEmailsQuery,
    userId?: string
  ): Promise<{ emails: Email[]; total: number }> {
    const { page = 1, limit = 20, senderId, recipient, from, to } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EmailWhereInput = {
      status: EmailStatus.SENT,
      ...(userId && { userId }),
      ...(senderId && { senderId }),
      ...(recipient && { recipient: { contains: recipient, mode: "insensitive" } }),
      ...(from || to
        ? {
            sentAt: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    };

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sentAt: "desc" },
        include: {
          sender: {
            select: { id: true, email: true },
          },
        },
      }),
      prisma.email.count({ where }),
    ]);

    return { emails, total };
  }
}
