/**
 * Logger utility for Nibelheim
 *
 * - In development: logs everything to console
 * - In production: only logs errors
 *
 * Sentry integration included for production error tracking.
 */

import * as Sentry from "@sentry/nextjs";

const isDev = process.env.NODE_ENV !== "production";
const isSentryEnabled = !!(
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
);

export const logger = {
  /**
   * Log debug information (dev only)
   */
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log error - always logs, reports to Sentry in production
   */
  error: (...args: unknown[]) => {
    console.error(...args);

    // Report to Sentry if enabled
    if (isSentryEnabled) {
      const error = args.find((arg) => arg instanceof Error);
      const message = args
        .filter((arg) => typeof arg === "string")
        .join(" ");

      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: { message, args: JSON.stringify(args.slice(0, 3)) },
        });
      } else if (message) {
        Sentry.captureMessage(message, {
          level: "error",
          extra: { args: JSON.stringify(args.slice(0, 3)) },
        });
      }
    }
  },

  /**
   * Log warning (dev only, or Sentry in prod)
   */
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    } else if (isSentryEnabled) {
      const message = args
        .filter((arg) => typeof arg === "string")
        .join(" ");
      if (message) {
        Sentry.captureMessage(message, { level: "warning" });
      }
    }
  },

  /**
   * Log info (dev only)
   */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
};

/**
 * Report error with context
 * Use this for error handling in components and API routes
 *
 * @example
 * ```ts
 * try {
 *   await fetchData()
 * } catch (error) {
 *   reportError("[tech-watch]", "Failed to load digest", error)
 * }
 * ```
 */
export function reportError(
  tag: string,
  message: string,
  error?: unknown,
  extra?: Record<string, unknown>
) {
  // Always log to console
  if (error) {
    console.error(tag, message, error);
  } else {
    console.error(tag, message);
  }

  // Report to Sentry if enabled
  if (isSentryEnabled) {
    Sentry.withScope((scope) => {
      // Set tag for filtering in Sentry dashboard
      scope.setTag("component", tag.replace(/[[\]]/g, ""));

      // Add extra context
      if (extra) {
        Object.entries(extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      // Capture the error or message
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(`${tag} ${message}`, "error");
      }
    });
  }
}

/**
 * Set user context for Sentry
 * Call this after user authentication
 *
 * @example
 * ```ts
 * setUserContext({ id: user.id, email: user.email })
 * ```
 */
export function setUserContext(user: { id: string; email?: string }) {
  if (isSentryEnabled) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  if (isSentryEnabled) {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 * Breadcrumbs help track the sequence of events leading to an error
 *
 * @example
 * ```ts
 * addBreadcrumb("navigation", "Navigated to tech-watch module")
 * ```
 */
export function addBreadcrumb(
  category: string,
  message: string,
  level: "debug" | "info" | "warning" | "error" = "info",
  data?: Record<string, unknown>
) {
  if (isSentryEnabled) {
    Sentry.addBreadcrumb({
      category,
      message,
      level,
      data,
    });
  }
}

/**
 * Start a performance span for measuring operations
 *
 * @example
 * ```ts
 * const span = startSpan("database-query", "fetch-prompts")
 * // ... do work
 * span?.end()
 * ```
 */
export function startSpan(operation: string, description: string) {
  if (isSentryEnabled) {
    return Sentry.startInactiveSpan({
      op: operation,
      name: description,
    });
  }
  return null;
}

/**
 * Measure an async operation's performance
 *
 * @example
 * ```ts
 * const result = await measureAsync("api-call", "fetch-digest", async () => {
 *   return await fetchDigest()
 * })
 * ```
 */
export async function measureAsync<T>(
  operation: string,
  description: string,
  fn: () => Promise<T>
): Promise<T> {
  if (isSentryEnabled) {
    return Sentry.startSpan(
      {
        op: operation,
        name: description,
      },
      fn
    );
  }
  return fn();
}
