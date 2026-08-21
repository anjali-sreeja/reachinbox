/**
 * Wraps an async Express route handler so that any thrown error is
 * forwarded to Express's next(err) — no try/catch boilerplate in routes.
 *
 * @example
 *   router.get("/", asyncHandler(async (req, res) => { ... }));
 */

import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
