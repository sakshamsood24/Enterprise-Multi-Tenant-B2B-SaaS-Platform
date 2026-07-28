import { Redis } from "@upstash/redis";

type LimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
      })
    : null;

export async function tenantRateLimit(
  tenantId: string,
  operation: string,
  limit: number,
  windowSeconds: number
): Promise<LimitResult> {
  const resetAt = Math.floor(Date.now() / 1000) + windowSeconds;

  if (!redis) {
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `tenant:${tenantId}:rl:${operation}:${bucket}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(limit - count, 0),
    resetAt
  };
}
