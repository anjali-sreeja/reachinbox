/**
 * Distributed Hourly Rate Limiter Service
 *
 * Implements a Redis-backed fixed-window rate limiter per sender.
 *
 * DESIGN & ALGORITHM:
 * - Uses an atomic Redis Lua script to inspect and increment the hourly usage counter.
 * - Key format: `ratelimit:hourly:{senderId}:{epochHourWindow}`
 *   Where `epochHourWindow = Math.floor(now / 3600000)`.
 * - When `currentUsage < MAX_EMAILS_PER_HOUR`:
 *     - Atomic INCR is performed and TTL is set to 2 hours.
 *     - Returns `{ allowed: true, waitMs: 0, currentUsage }`.
 * - When `currentUsage >= MAX_EMAILS_PER_HOUR`:
 *     - Counter is not incremented.
 *     - Calculates milliseconds remaining until the start of the next hour window:
 *       `waitMs = ((epochHourWindow + 1) * 3600000) - now`.
 *     - Returns `{ allowed: false, waitMs, currentUsage }`.
 *
 * DISTRIBUTED PROPERTIES:
 * - Atomicity: Redis Lua script executes synchronously, eliminating race conditions
 *   between multiple concurrent workers and clustered Node.js instances.
 * - Non-destructive: Jobs hitting the limit are delayed to the next window instead of failing.
 */

import { redisClient } from "../config/redis";
import { env } from "../config/env";

const HOURLY_RATE_LIMIT_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local maxLimit = tonumber(ARGV[2])
local windowSizeMs = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])

local current = redis.call('GET', key)
local count = current and tonumber(current) or 0

if count < maxLimit then
    local newCount = redis.call('INCR', key)
    if newCount == 1 then
        redis.call('EXPIRE', key, ttl)
    end
    return {1, 0, newCount}
else
    local currentWindow = math.floor(now / windowSizeMs)
    local nextWindowStart = (currentWindow + 1) * windowSizeMs
    local waitMs = nextWindowStart - now
    if waitMs < 1000 then
        waitMs = 1000
    end
    return {0, waitMs, count}
end
`;

export interface RateLimitResult {
  allowed: boolean;
  waitMs: number;
  currentUsage: number;
  maxLimit: number;
}

/**
 * Checks and atomically consumes 1 unit of the sender's hourly email quota.
 *
 * @param senderId Unique identifier of the sender
 * @param customLimit Optional custom hourly cap (defaults to MAX_EMAILS_PER_HOUR)
 * @returns RateLimitResult indicating whether delivery is allowed or required waitMs
 */
export async function checkAndConsumeHourlyQuota(
  senderId: string,
  customLimit?: number
): Promise<RateLimitResult> {
  const maxLimit = customLimit ?? env.MAX_EMAILS_PER_HOUR ?? env.EMAIL_HOURLY_LIMIT ?? 200;
  const now = Date.now();
  const windowSizeMs = 3600 * 1000; // 1 hour in ms
  const epochHour = Math.floor(now / windowSizeMs);
  const key = `ratelimit:hourly:${senderId}:${epochHour}`;
  const ttlSeconds = 7200; // 2 hours

  try {
    const rawResult = (await redisClient.eval(
      HOURLY_RATE_LIMIT_LUA,
      1,
      key,
      now.toString(),
      maxLimit.toString(),
      windowSizeMs.toString(),
      ttlSeconds.toString()
    )) as [number, number, number];

    const allowed = rawResult[0] === 1;
    const waitMs = Math.max(0, Number(rawResult[1]) || 0);
    const currentUsage = Number(rawResult[2]) || 0;

    return {
      allowed,
      waitMs,
      currentUsage,
      maxLimit,
    };
  } catch (err) {
    console.error("⚠️ [RateLimiter] Redis rate-limit evaluation failed:", err);
    // Fail-open for transient Redis query issues or fail safe
    return {
      allowed: true,
      waitMs: 0,
      currentUsage: 0,
      maxLimit,
    };
  }
}

/**
 * Retrieves the current hour's send count for a given sender
 */
export async function getHourlyUsage(senderId: string): Promise<number> {
  const now = Date.now();
  const epochHour = Math.floor(now / (3600 * 1000));
  const key = `ratelimit:hourly:${senderId}:${epochHour}`;

  try {
    const val = await redisClient.get(key);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}
