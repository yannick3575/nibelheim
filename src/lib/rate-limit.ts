/**
 * Rate Limiting Utility using Upstash Redis
 *
 * Provides configurable rate limiting for API routes with different
 * limits based on endpoint sensitivity and authentication status.
 *
 * Environment variables required:
 * - UPSTASH_REDIS_REST_URL: Upstash Redis REST API URL
 * - UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST API token
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMIT_CONFIGS = {
  /** Default rate limit for authenticated API routes */
  default: { requests: 100, window: '1m' as const },

  /** Stricter limit for automation/bot endpoints (external API access) */
  automation: { requests: 30, window: '1m' as const },

  /** Very strict limit for sensitive operations (tokens, auth) */
  sensitive: { requests: 10, window: '1m' as const },

  /** Limit for AI-intensive operations (Gemini calls) */
  ai: { requests: 20, window: '1m' as const },

  /** Looser limit for read-only operations */
  readonly: { requests: 200, window: '1m' as const },
} as const;

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS;

// ============================================================================
// REDIS CLIENT SINGLETON
// ============================================================================

let redisClient: Redis | null = null;

/**
 * Get or create Redis client singleton
 * Returns null if environment variables are not configured
 */
function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    logger.warn(
      '[rate-limit] Upstash Redis not configured. Rate limiting disabled. ' +
        'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable.'
    );
    return null;
  }

  try {
    redisClient = new Redis({ url, token });
    logger.log('[rate-limit] Redis client initialized');
    return redisClient;
  } catch (error) {
    logger.error('[rate-limit] Failed to initialize Redis client:', error);
    return null;
  }
}

// ============================================================================
// RATE LIMITERS CACHE
// ============================================================================

const rateLimiters = new Map<RateLimitType, Ratelimit>();

/**
 * Get or create rate limiter for a specific type
 */
function getRateLimiter(type: RateLimitType): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;

  if (rateLimiters.has(type)) {
    return rateLimiters.get(type)!;
  }

  const config = RATE_LIMIT_CONFIGS[type];

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
    prefix: `nibelheim:ratelimit:${type}`,
  });

  rateLimiters.set(type, limiter);
  return limiter;
}

// ============================================================================
// RATE LIMIT CHECK FUNCTION
// ============================================================================

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a given identifier
 *
 * @param identifier - Unique identifier (usually user ID or IP address)
 * @param type - Type of rate limit to apply
 * @returns Rate limit result with success status and metadata
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'default'
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(type);

  // If rate limiting is disabled, allow all requests
  if (!limiter) {
    const config = RATE_LIMIT_CONFIGS[type];
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests,
      reset: Date.now() + 60000,
    };
  }

  try {
    const result = await limiter.limit(identifier);

    if (!result.success) {
      logger.warn(
        `[rate-limit] Rate limit exceeded for ${identifier} (type: ${type})`
      );
    }

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // On Redis errors, fail open (allow the request)
    logger.error('[rate-limit] Redis error, allowing request:', error);
    const config = RATE_LIMIT_CONFIGS[type];
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests,
      reset: Date.now() + 60000,
    };
  }
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Create a rate limit exceeded response with appropriate headers
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
      },
    }
  );
}

/**
 * Add rate limit headers to an existing response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());
  return response;
}

// ============================================================================
// MIDDLEWARE HELPER
// ============================================================================

/**
 * Rate limit middleware for API routes
 *
 * Usage in route handler:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await withRateLimit(request, 'automation');
 *   if (rateLimitResult) return rateLimitResult; // Rate limited
 *
 *   // ... rest of handler
 * }
 * ```
 *
 * @param request - Next.js request object
 * @param type - Type of rate limit to apply
 * @param identifier - Optional custom identifier (defaults to IP or user-agent)
 * @returns NextResponse if rate limited, null if allowed
 */
export async function withRateLimit(
  request: Request,
  type: RateLimitType = 'default',
  identifier?: string
): Promise<NextResponse | null> {
  // Determine identifier: prefer provided, then IP, then user-agent hash
  const id =
    identifier ||
    getClientIdentifier(request);

  const result = await checkRateLimit(id, type);

  if (!result.success) {
    return rateLimitExceededResponse(result);
  }

  return null;
}

/**
 * Get client identifier from request
 * Uses IP address if available, falls back to user-agent hash
 */
function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (in order of reliability)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain (client IP)
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to user-agent (not ideal but better than nothing)
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `ua:${simpleHash(userAgent)}`;
}

/**
 * Simple string hash for fallback identification
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// USER-BASED RATE LIMITING
// ============================================================================

/**
 * Rate limit by user ID (for authenticated routes)
 * Provides better accuracy than IP-based limiting
 */
export async function withUserRateLimit(
  userId: string,
  type: RateLimitType = 'default'
): Promise<NextResponse | null> {
  const result = await checkRateLimit(`user:${userId}`, type);

  if (!result.success) {
    return rateLimitExceededResponse(result);
  }

  return null;
}
