/**
 * Prisma Client singleton
 *
 * In development, hot-reloads would create multiple PrismaClient instances.
 * We attach the client to the global object to reuse it across module
 * re-evaluations (ts-node-dev / nodemon restarts).
 *
 * In production, the module cache guarantees a single instance.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env["NODE_ENV"] === "development"
        ? ["query", "info", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
