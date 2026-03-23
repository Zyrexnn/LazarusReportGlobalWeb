import { defineMiddleware } from "astro:middleware";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Upstash Redis client ONLY if environment variables are provided
const hasUpstash = !!(import.meta.env.UPSTASH_REDIS_REST_URL && import.meta.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasUpstash ? new Redis({
  url: import.meta.env.UPSTASH_REDIS_REST_URL,
  token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
}) : null;

// Create a new ratelimiter ONLY if redis is available
const ratelimit = redis ? new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
}) : null;

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;

  // Only apply to API routes
  if (url.pathname.startsWith("/api/")) {
    // 1. Security Check: Origin & Referer
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    // In production, you might want to be stricter
    // For now, we allow if origin matches host or is empty (direct browser access for testing)
    if (origin && !origin.includes(host || "")) {
      return new Response(JSON.stringify({ error: "Unauthorized origin" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Rate Limiting
    // Use x-forwarded-for for IP address
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    
    // Skip rate limit if Upstash is not configured (to prevent breaking the site)
    if (ratelimit) {
      const { success, limit, reset, remaining } = await ratelimit.limit(ip);

      if (!success) {
        return new Response(JSON.stringify({ 
          error: "Too many requests. Please try again later.",
          limit,
          remaining,
          reset
        }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        });
      }

      // Add rate limit headers to the actual response via the next() call
      const response = await next();
      response.headers.set("X-RateLimit-Limit", limit.toString());
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      response.headers.set("X-RateLimit-Reset", reset.toString());
      return response;
    }
  }

  return next();
});
