/**
 * Shared TypeScript types / interfaces for the backend.
 *
 * Re-export from here so consumers always import from a single location:
 *   import type { AuthenticatedRequest } from "@/types";
 */

import type { Request } from "express";
import type { User } from "@prisma/client";

// ─── Express Request augmentation ────────────────────────────────────────────

/** Request that has passed the JWT auth middleware */
export interface AuthenticatedRequest extends Request {
  user: Pick<User, "id" | "email" | "name" | "googleId">;
}

// ─── Common pagination query ──────────────────────────────────────────────────

export interface PaginationQuery {
  page: number;
  limit: number;
}

// ─── Generic service result ───────────────────────────────────────────────────

export interface ServiceResult<T> {
  data: T;
  total?: number;
}

// ─── JWT payload ─────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;   // userId
  email: string;
  iat?: number;
  exp?: number;
}
