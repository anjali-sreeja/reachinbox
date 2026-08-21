/**
 * Redis connection configuration
 *
 * Configures Redis using ioredis for BullMQ queue and worker operations.
 * Important: BullMQ requires `maxRetriesPerRequest: null` and `enableReadyCheck: false`.
 */

import Redis, { type RedisOptions } from "ioredis";
import { env } from "./env";

export const redisConfig: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 500, 3000);
    return delay;
  },
};

/**
 * Shared Redis client instance for general cache / rate limiting
 */
export const redisClient = new Redis(redisConfig);

redisClient.on("connect", () => {
  console.log("✅  Redis connected successfully.");
});

redisClient.on("error", (err) => {
  console.error("❌  Redis connection error:", err.message);
});
