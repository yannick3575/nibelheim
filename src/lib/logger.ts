/**
 * Logger utility for Nibelheim
 *
 * - In development: logs everything to console
 * - In production: only logs errors
 *
 * Ready for Sentry integration when needed.
 */

const isDev = process.env.NODE_ENV !== "production";

/**
 * Extract context tag from first argument (e.g., "[tech-watch]")
 */
function extractTag(args: unknown[]): string | null {
  if (typeof args[0] === "string") {
    const match = args[0].match(/^\[([^\]]+)\]/);
    if (match) {
      return match[1];
    }
  }
  return null;
}

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
   * Log error - always logs, even in production
   * Ready for Sentry integration
   */
  error: (...args: unknown[]) => {
    console.error(...args);

    // TODO: Add Sentry integration here when needed
    // const tag = extractTag(args);
    // Sentry.captureException(...)
  },

  /**
   * Log warning (dev only)
   */
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
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
  if (error) {
    console.error(tag, message, error);
  } else {
    console.error(tag, message);
  }

  // TODO: Add Sentry integration here when needed
  // Sentry.withScope((scope) => {
  //   scope.setTag("component", tag.replace(/[[\]]/g, ""));
  //   if (extra) Object.entries(extra).forEach(([k, v]) => scope.setExtra(k, v));
  //   if (error instanceof Error) Sentry.captureException(error);
  //   else Sentry.captureMessage(`${tag} ${message}`, "error");
  // });
}
