/**
 * Standardised API response helpers.
 *
 * Every endpoint should send responses through these helpers so that
 * the frontend always receives a consistent shape:
 *
 *   { success, message, data, pagination? }
 */

import type { Response } from "express";

// ─── Response shape types ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedApiResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** 200 OK */
export function sendOk<T>(res: Response, data: T, message = "Success"): void {
  res.status(200).json({ success: true, message, data } satisfies ApiResponse<T>);
}

/** 201 Created */
export function sendCreated<T>(
  res: Response,
  data: T,
  message = "Created"
): void {
  res
    .status(201)
    .json({ success: true, message, data } satisfies ApiResponse<T>);
}

/** 204 No Content */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}

/** Paginated 200 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message = "Success"
): void {
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: meta,
  } satisfies PaginatedApiResponse<T>);
}

/** Build PaginationMeta from raw values */
export function buildPagination(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
