/**
 * Sentry Edge Runtime Configuration
 *
 * This file configures Sentry for Edge Runtime (middleware, edge API routes).
 * Edge runtime has limited APIs, so configuration is simpler.
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment and release tracking
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",

  // Performance Monitoring - lighter for edge
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Filter and enhance events before sending
  beforeSend(event) {
    // Sanitize sensitive data
    if (event.request?.headers) {
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

    return event;
  },

  // Add additional context
  initialScope: {
    tags: {
      component: "edge",
      runtime: "edge",
    },
  },
});
