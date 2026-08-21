/**
 * Global error-handling middleware.
 *
 * This must be registered as the LAST middleware in app.ts (Express
 * identifies error handlers by their 4-parameter signature).
 *
 * Handled error types:
 *   AppError                       → use its statusCode / message
 *   ZodError                       → 422 with field errors
 *   PrismaClientKnownRequestError  → mapped to appropriate HTTP codes
 *   PrismaClientValidationError    → 400
 *   Generic Error                  → 500 (message hidden in production)
 */

import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { AppError } from "../utils/AppError";
import { isDev } from "../config/env";

/** Map Prisma error codes to HTTP status + message */
function handlePrismaError(
  err: PrismaClientKnownRequestError
): { statusCode: number; message: string; code: string } {
  switch (err.code) {
    case "P2002": {
      const fields = (err.meta?.["target"] as string[] | undefined)?.join(", ") ?? "field";
      return { statusCode: 409, message: `A record with this ${fields} already exists.`, code: "CONFLICT" };
    }
    case "P2025":
      return { statusCode: 404, message: "Record not found.", code: "NOT_FOUND" };
    case "P2003":
      return { statusCode: 400, message: "Foreign key constraint failed — referenced record does not exist.", code: "FK_VIOLATION" };
    case "P2014":
      return { statusCode: 400, message: "The change violates a required relation.", code: "RELATION_VIOLATION" };
    default:
      return { statusCode: 500, message: "Database error.", code: `PRISMA_${err.code}` };
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── AppError (operational, expected) ───────────────────────
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      success: false,
      message: err.message,
      code: err.code,
    };

    // Include field errors if they were attached by the validate middleware
    const withFields = err as AppError & { fieldErrors?: unknown };
    if (withFields.fieldErrors) {
      body["fieldErrors"] = withFields.fieldErrors;
    }

    if (isDev) {
      body["stack"] = err.stack;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // ── Zod validation error (unhandled) ───────────────────────
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: "Validation failed.",
      code: "VALIDATION_ERROR",
      fieldErrors: err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }

  // ── Prisma known request error ──────────────────────────────
  if (err instanceof PrismaClientKnownRequestError) {
    const { statusCode, message, code } = handlePrismaError(err);
    res.status(statusCode).json({ success: false, message, code });
    return;
  }

  // ── Prisma validation error ─────────────────────────────────
  if (err instanceof PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: "Invalid database query.",
      code: "DB_VALIDATION_ERROR",
    });
    return;
  }

  // ── Unknown / programming error ─────────────────────────────
  const genericError = err instanceof Error ? err : new Error(String(err));

  console.error("💥  Unhandled error:", genericError);

  res.status(500).json({
    success: false,
    message: isDev ? genericError.message : "An unexpected error occurred.",
    code: "INTERNAL_ERROR",
    ...(isDev && { stack: genericError.stack }),
  });
}
