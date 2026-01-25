import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitResult =
  | { ok: true }
  | {
      ok: false;
      status: 429;
      retryAfterSeconds?: number;
      message: string;
    };

function getUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redis = new Redis({ url, token });
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(100, "1 h"),
    analytics: true,
    prefix: "afritable_rl",
  });

  return limiter;
}

/**
 * Rate limit helper (100 requests/hour per key).
 * - Uses Upstash if configured
 * - Falls back to allowing all requests (so dev isn’t blocked)
 */
export async function rateLimitOrPass(key: string): Promise<RateLimitResult> {
  const limiter = getUpstash();
  if (!limiter) return { ok: true };

  const res = await limiter.limit(key);
  if (res.success) return { ok: true };

  const retryAfterSeconds = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
  return {
    ok: false,
    status: 429,
    retryAfterSeconds,
    message: "Too many requests. Please try again later.",
  };
}

