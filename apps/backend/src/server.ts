/**
 * Server entry point.
 *
 * Responsibilities:
 *   1. Parse & validate environment variables (fails fast on misconfiguration)
 *   2. Verify the PostgreSQL connection via Prisma
 *   3. Start the BullMQ Email Worker
 *   4. Start the HTTP listener
 *   5. Register SIGTERM / SIGINT handlers for graceful shutdown
 */

import "dotenv/config";
import { env } from "./config/env"; // validates env at import time
import { createApp } from "./app";
import { prisma } from "./config/prisma";
import { redisClient } from "./config/redis";
import { emailQueue } from "./queues/email.queue";
import { createEmailWorker } from "./workers/email.worker";
import type { Server } from "http";
import type { Worker } from "bullmq";

let server: Server;
let worker: Worker | null = null;

async function bootstrap(): Promise<void> {
  // ── 1. Verify database connectivity ──────────────────────────
  console.log("🔍  Connecting to PostgreSQL…");
  try {
    await prisma.$connect();
    console.log("✅  PostgreSQL connected.");
  } catch (err) {
    console.error("❌  Failed to connect to PostgreSQL:", err);
    process.exit(1);
  }

  // ── 2. Initialize BullMQ Worker ────────────────────────────
  try {
    worker = createEmailWorker();
  } catch (err) {
    console.error("❌  Failed to initialize BullMQ Worker:", err);
  }

  // ── 3. Build Express app ───────────────────────────────────
  const app = createApp();

  // ── 4. Start HTTP server ───────────────────────────────────
  server = app.listen(env.PORT, () => {
    console.log(
      `🚀  ReachInbox API running on http://localhost:${env.PORT}  [${env.NODE_ENV}]`
    );
    console.log(`   Health: http://localhost:${env.PORT}/health`);
  });
}

// ── Graceful shutdown ──────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received. Shutting down gracefully…`);

  // Stop accepting new connections
  server?.close(async () => {
    console.log("🔌  HTTP server closed.");

    // Close BullMQ worker
    if (worker) {
      await worker.close();
      console.log("🔌  BullMQ worker stopped.");
    }

    // Close BullMQ queue
    await emailQueue.close();
    console.log("🔌  BullMQ queue closed.");

    // Disconnect Redis client
    await redisClient.quit();
    console.log("🔌  Redis client disconnected.");

    // Disconnect Prisma
    await prisma.$disconnect();
    console.log("🔌  Prisma disconnected.");

    process.exit(0);
  });

  // Force-exit after 10 s if graceful shutdown stalls
  setTimeout(() => {
    console.error("⚠️  Forced shutdown after 10 s timeout.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// Catch unhandled rejections/exceptions so the process doesn't silently die
process.on("unhandledRejection", (reason) => {
  console.error("💥  Unhandled promise rejection:", reason);
  void shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  console.error("💥  Uncaught exception:", err);
  void shutdown("uncaughtException");
});

// ── Start ──────────────────────────────────────────────────────────────────

bootstrap().catch((err: unknown) => {
  console.error("❌  Bootstrap failed:", err);
  process.exit(1);
});
