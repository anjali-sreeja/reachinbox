/**
 * Email BullMQ Queue definition & job scheduling
 *
 * Provides the queue instance and helper functions to enqueue delayed email jobs.
 * Uses deterministic jobIds (the PostgreSQL Email record ID) to enforce idempotency.
 */

import { Queue, type Job } from "bullmq";
import { redisConfig } from "../config/redis";
import { env } from "../config/env";

export interface EmailJobData {
  emailId: string;
}

/**
 * BullMQ Email Queue instance
 */
export const emailQueue = new Queue<EmailJobData>(env.EMAIL_QUEUE_NAME, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      count: 1000,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 5000,
    },
  },
});

emailQueue.on("error", (err) => {
  console.error(`❌  Email Queue error (${env.EMAIL_QUEUE_NAME}):`, err.message);
});

/**
 * Adds a delayed email sending job to BullMQ.
 *
 * @param emailId Database ID of the Email record (used as deterministic BullMQ jobId)
 * @param delayMs Delay in milliseconds until the job should become active
 * @returns BullMQ Job instance
 */
export async function scheduleEmailJob(
  emailId: string,
  delayMs: number
): Promise<Job<EmailJobData>> {
  const safeDelay = Math.max(0, Math.floor(delayMs));

  // By supplying `jobId: emailId`, BullMQ ensures that duplicate requests
  // cannot spawn duplicate jobs in the queue.
  const job = await emailQueue.add(
    "send-email",
    { emailId },
    {
      jobId: emailId,
      delay: safeDelay,
    }
  );

  return job;
}
