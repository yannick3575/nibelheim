import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Organization and project from Sentry dashboard
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for uploading source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps only in production builds
  silent: !process.env.CI,

  // Source maps configuration
  widenClientFileUpload: true,

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements
  disableLogger: true,

  // Enable automatic instrumentation of Vercel functions
  automaticVercelMonitors: true,

  // Tunnel route to avoid ad blockers
  tunnelRoute: "/monitoring",
};

// Only wrap with Sentry if DSN is configured
const configWithSentry =
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
    ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
    : nextConfig;

export default configWithSentry;
