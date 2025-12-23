/**
 * Sentry Client-Side Configuration
 *
 * This file configures Sentry for the browser/client-side.
 * It captures unhandled exceptions, promise rejections, and performance data.
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment and release tracking
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",

  // Performance Monitoring
  // Capture 10% of transactions in production, 100% in development
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay for debugging user issues
  // Capture 1% of sessions, 100% on error
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Integrations
  integrations: [
    // Automatic breadcrumbs for user actions
    Sentry.breadcrumbsIntegration({
      console: true,
      dom: true,
      fetch: true,
      history: true,
      xhr: true,
    }),

    // Session replay for error debugging
    Sentry.replayIntegration({
      // Mask all text for privacy
      maskAllText: false,
      // Block media for performance
      blockAllMedia: true,
    }),

    // Browser tracing for performance
    Sentry.browserTracingIntegration({
      // Track navigation and page loads
      enableInp: true,
    }),
  ],

  // Filter and enhance events before sending
  beforeSend(event, hint) {
    // Filter out certain errors
    const error = hint.originalException;

    // Don't report network errors from ad blockers
    if (
      error instanceof Error &&
      error.message.includes("Failed to fetch dynamically imported module")
    ) {
      return null;
    }

    // Don't report ResizeObserver errors (common false positive)
    if (
      error instanceof Error &&
      error.message.includes("ResizeObserver loop")
    ) {
      return null;
    }

    // Sanitize sensitive data from request
    if (event.request?.cookies) {
      delete event.request.cookies;
    }

    // Remove Authorization headers
    if (event.request?.headers) {
      delete event.request.headers["Authorization"];
      delete event.request.headers["authorization"];
      delete event.request.headers["X-Api-Key"];
      delete event.request.headers["x-api-key"];
    }

    return event;
  },

  // Filter breadcrumbs to reduce noise
  beforeBreadcrumb(breadcrumb) {
    // Filter out noisy console breadcrumbs
    if (breadcrumb.category === "console" && breadcrumb.level === "debug") {
      return null;
    }

    // Filter out fetch requests to external analytics
    if (
      breadcrumb.category === "fetch" &&
      breadcrumb.data?.url?.includes("analytics")
    ) {
      return null;
    }

    return breadcrumb;
  },

  // Allowed URLs to trace
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/.*\.vercel\.app/,
    /^https:\/\/nibelheim\./,
  ],

  // Ignore specific errors
  ignoreErrors: [
    // Browser extension errors
    "top.GLOBALS",
    // Random plugins/extensions
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    "http://tt.teletracking",
    "jigsaw is not defined",
    // Facebook borance
    /fb_xd_fragment/,
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    // Network errors that are user-side
    "Network Error",
    "NetworkError",
    "ChunkLoadError",
  ],

  // Deny specific URLs
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    // Social widgets
    /widgets\.intercom\.com/i,
  ],
});
