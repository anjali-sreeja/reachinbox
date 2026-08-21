/**
 * Health controller
 *
 * GET /health
 * Returns service liveness including DB connectivity and process uptime.
 */

import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { env } from "../config/env";

export async function healthCheck(
  _req: Request,
  res: Response
): Promise<void> {
  let dbStatus: "connected" | "disconnected" = "disconnected";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch {
    dbStatus = "disconnected";
  }

  const status = dbStatus === "connected" ? "ok" : "degraded";

  res.status(dbStatus === "connected" ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptime: Math.round(process.uptime()),
    database: dbStatus,
    version: process.env["npm_package_version"] ?? "1.0.0",
  });
}
