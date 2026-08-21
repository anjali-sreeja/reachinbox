/**
 * Zod validation middleware factory.
 *
 * Creates an Express middleware that validates the specified part of the
 * request against a Zod schema. On failure it calls next(AppError) with
 * a 422 status and structured field errors.
 *
 * @example
 *   router.post("/schedule", validate(scheduleEmailSchema, "body"), handler);
 *   router.get("/list",      validate(listQuerySchema, "query"),    handler);
 */

import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodSchema, ZodError } from "zod";
import { AppError } from "../utils/AppError";

type ValidationTarget = "body" | "query" | "params";

interface FieldError {
  field: string;
  message: string;
}

function formatZodError(err: ZodError): FieldError[] {
  return err.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export function validate<T>(
  schema: ZodSchema<T>,
  target: ValidationTarget = "body"
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = formatZodError(result.error);
      const message = `Validation failed: ${errors.map((e) => `${e.field} — ${e.message}`).join("; ")}`;

      // Attach field errors to the error for the global handler to forward
      const appError = AppError.unprocessable(message, "VALIDATION_ERROR");
      (appError as AppError & { fieldErrors: FieldError[] }).fieldErrors = errors;

      next(appError);
      return;
    }

    // Overwrite the target with the coerced/defaulted Zod output
    (req as Request & Record<string, unknown>)[target] = result.data;
    next();
  };
}
