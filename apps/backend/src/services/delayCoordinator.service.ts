/**
 * Distributed Send Delay Coordinator
 *
 * Enforces a strict minimum time gap between email sends (MIN_EMAIL_DELAY_MS)
 * across multiple concurrent BullMQ workers and distributed Node.js processes.
 *
 * DESIGN & ARCHITECTURE:
 * - Uses an atomic Redis Lua script to schedule consecutive transmission timeslots.
 * - Prevents race conditions and stampedes when multiple concurrent workers pick up
 *   jobs simultaneously without relying on in-memory counters or cron jobs.
 * - Multi-process / Multi-container safe: Redis serializes reservation requests atomically.
 */

import { redisClient } from "../config/redis";
import { env } from "../config/env";

const RESERVE_SLOT_LUA = `
local now = tonumber(ARGV[1])
local minDelay = tonumber(ARGV[2])
local ttl = tonumber(ARGV[3])
local key = KEYS[1]

local lastReserved = redis.call('GET', key)
local targetTime = now

if lastReserved then
    local lastReservedNum = tonumber(lastReserved)
    if (lastReservedNum + minDelay) > now then
        targetTime = lastReservedNum + minDelay
    end
end

redis.call('SET', key, tostring(targetTime), 'EX', ttl)
return targetTime - now
`;

/**
 * Reserves the next available transmission timeslot for a sender in Redis.
 *
 * @param senderId The sender's unique ID (or 'global' for cluster-wide delay)
 * @param minDelayMs Minimum spacing required between consecutive sends (ms)
 * @returns Number of milliseconds to wait before transmitting
 */
export async function reserveSendSlot(
  senderId: string,
  minDelayMs: number = env.MIN_EMAIL_DELAY_MS ?? env.EMAIL_MIN_DELAY_MS ?? 2000
): Promise<number> {
  if (minDelayMs <= 0) return 0;

  const now = Date.now();
  const key = `ratelimit:send_slot:${senderId}`;
  const ttlSeconds = 3600; // 1 hour key expiry

  try {
    const waitMsResult = (await redisClient.eval(
      RESERVE_SLOT_LUA,
      1,
      key,
      now.toString(),
      minDelayMs.toString(),
      ttlSeconds.toString()
    )) as number;

    return Math.max(0, Number(waitMsResult) || 0);
  } catch (err) {
    console.error("⚠️ [DelayCoordinator] Redis reservation failed, fallback to 0 delay:", err);
    return 0;
  }
}

/**
 * Helper to pause execution for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
