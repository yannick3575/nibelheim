/**
 * Sentry Server-Side Configuration
 *
 * This file configures Sentry for the Node.js server-side runtime.
 * It captures server errors, API route errors, and database issues.
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment and release tracking
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",

  // Performance Monitoring
  // Capture 10% of transactions in production, 100% in development
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Integrations
  integrations: [
    // HTTP request tracing
    Sentry.httpIntegration(),

    // Database query tracing (if using supported databases)
    Sentry.nativeNodeFetchIntegration(),
  ],

  // Filter and enhance events before sending
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Don't report expected errors
    if (error instanceof Error) {
      // Skip 404 errors
      if (error.message.includes("not found") || error.message.includes("404")) {
        // Still log but with lower severity
        event.level = "warning";
      }

      // Skip authentication errors (user-caused)
      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("401")
      ) {
        return null;
      }
    }

    // Sanitize sensitive data
    if (event.request?.headers) {
      // Remove sensitive headers
      const sensitiveHeaders = [
        "authorization",
        "cookie",
        "x-api-key",
        "x-auth-token",
      ];
      for (const header of sensitiveHeaders) {
        delete event.request.headers[header];
      }
    }

    // Remove sensitive data from request body
    if (event.request?.data && typeof event.request.data === "object") {
      const sensitiveFields = ["password", "token", "secret", "api_key", "apiKey"];
      const data = event.request.data as Record<string, unknown>;
      for (const field of sensitiveFields) {
        if (field in data) {
          data[field] = "[REDACTED]";
        }
      }
    }

    return event;
  },

  // Add additional context
  initialScope: {
    tags: {
      component: "server",
      runtime: "nodejs",
    },
  },

  // Spotlight for development debugging
  spotlight: process.env.NODE_ENV === "development",
});
