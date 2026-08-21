/**
 * BullMQ Email Worker
 *
 * Consumes delayed jobs from "email-queue", enforces distributed hourly rate limits,
 * coordinates minimum delay between email transmissions across concurrent workers,
 * dispatches through Ethereal SMTP, checks PostgreSQL status to guarantee idempotency,
 * and persists execution results.
 */

import { Worker, type Job } from "bullmq";
import { EmailStatus } from "@prisma/client";
import { redisConfig } from "../config/redis";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { sendEmail } from "../services/smtp.service";
import { reserveSendSlot, sleep } from "../services/delayCoordinator.service";
import { checkAndConsumeHourlyQuota } from "../services/rateLimiter.service";
import { scheduleEmailJob, type EmailJobData } from "../queues/email.queue";

/**
 * Core processor for email jobs
 */
export async function processEmailJob(
  job: Job<EmailJobData>,
  token?: string
): Promise<void> {
  const { emailId } = job.data;
  console.log(`📨 [Worker] Processing email job ${job.id} for email ID: ${emailId}`);

  // 1. Retrieve the email from PostgreSQL with sender details
  const email = await prisma.email.findUnique({
    where: { id: emailId },
    include: {
      sender: true,
    },
  });

  if (!email) {
    console.warn(`⚠️ [Worker] Email record not found for ID: ${emailId}. Skipping job.`);
    return;
  }

  // 2. Idempotency Check: Do not send an email that is already marked SENT
  if (email.status === EmailStatus.SENT) {
    console.log(`ℹ️ [Worker] Email ${emailId} is already marked as SENT. Skipping duplicate send.`);
    return;
  }

  // 3. Distributed Hourly Rate Limiting Check
  const rateLimit = await checkAndConsumeHourlyQuota(email.senderId);

  if (!rateLimit.allowed) {
    const nextScheduledTime = new Date(Date.now() + rateLimit.waitMs);
    console.log(
      `⏸️ [RateLimiter] Hourly limit (${rateLimit.maxLimit}/hr) reached for sender ${email.sender.email}. ` +
        `Rescheduling email ${emailId} to next window at ${nextScheduledTime.toISOString()} (in ${Math.round(rateLimit.waitMs / 1000)}s).`
    );

    // Update scheduledAt in PostgreSQL and maintain SCHEDULED status
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: EmailStatus.SCHEDULED,
        scheduledAt: nextScheduledTime,
      },
    });

    // Move running BullMQ job back to delayed state without failing
    if (token) {
      try {
        await job.moveToDelayed(Date.now() + rateLimit.waitMs, token);
        return;
      } catch (delayErr) {
        console.warn("⚠️ [Worker] moveToDelayed with token failed, falling back to queue re-add:", delayErr);
      }
    }

    // Fallback if token is unavailable: schedule delayed job
    await scheduleEmailJob(emailId, rateLimit.waitMs);
    return;
  }

  // 4. Change status to PROCESSING safely and increment delivery attempts
  await prisma.email.update({
    where: { id: emailId },
    data: {
      status: EmailStatus.PROCESSING,
      attempts: { increment: 1 },
      jobId: job.id ?? emailId,
    },
  });

  try {
    // 5. Distributed Minimum Delay Coordination (spaces out consecutive sends)
    const minDelayMs = env.MIN_EMAIL_DELAY_MS ?? env.EMAIL_MIN_DELAY_MS ?? 2000;
    const waitMs = await reserveSendSlot(email.senderId, minDelayMs);

    if (waitMs > 0) {
      console.log(
        `⏳ [Worker] Enforcing minimum send delay (${minDelayMs}ms). Job ${job.id} waiting ${waitMs}ms before dispatch...`
      );
      await sleep(waitMs);
    }

    // 6. Send email through Ethereal SMTP
    console.log(
      `🚀 [Worker] Dispatching email to "${email.recipient}" with subject "${email.subject}" (sender: ${email.sender.email})`
    );

    const result = await sendEmail({
      from: email.sender.email,
      to: email.recipient,
      subject: email.subject,
      body: email.body,
      smtpCredentials: {
        user: email.sender.smtpUser,
        pass: email.sender.smtpPassword,
      },
    });

    // 7. On success: status = SENT, sentAt = current timestamp, clear errorMessage
    const updatedEmail = await prisma.email.update({
      where: { id: emailId },
      data: {
        status: EmailStatus.SENT,
        sentAt: new Date(),
        errorMessage: null,
      },
    });

    console.log(
      `✅ [Worker] Email ${updatedEmail.id} successfully sent to ${updatedEmail.recipient}. MessageId: ${result.messageId}`
    );

    if (result.previewUrl) {
      console.log(`🔎 [Worker] Preview: ${result.previewUrl}`);
    }
  } catch (err: unknown) {
    // 8. On failure: status = FAILED, store errorMessage
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`❌ [Worker] Failed to send email ${emailId}:`, errorMsg);

    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: EmailStatus.FAILED,
        errorMessage: errorMsg,
      },
    });

    throw err; // Trigger BullMQ retry backoff if attempts remain
  }
}

/**
 * Creates and initializes the BullMQ Email Worker
 */
export function createEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(env.EMAIL_QUEUE_NAME, processEmailJob, {
    connection: redisConfig,
    concurrency: env.WORKER_CONCURRENCY,
  });

  worker.on("ready", () => {
    console.log(
      `👷  Email Worker initialized with concurrency ${env.WORKER_CONCURRENCY} on queue "${env.EMAIL_QUEUE_NAME}"`
    );
  });

  worker.on("completed", (job) => {
    console.log(`🏁 [Worker] Job ${job.id} completed successfully.`);
  });

  worker.on("failed", (job, err) => {
    console.error(`💥 [Worker] Job ${job?.id} failed with error:`, err.message);
  });

  worker.on("error", (err) => {
    console.error(`❌ [Worker] Worker error:`, err.message);
  });

  return worker;
}
