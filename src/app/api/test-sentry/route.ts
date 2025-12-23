import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * Test endpoint for Sentry error tracking
 * DELETE THIS FILE after verifying Sentry works
 */
export async function GET() {
  // Capture a test message
  Sentry.captureMessage("Test message from Nibelheim", "info");

  // Throw a test error
  throw new Error("Test error from Nibelheim - Sentry integration check");
}

export async function POST() {
  // Manual error capture without throwing
  const testError = new Error("Manual test error capture");
  Sentry.captureException(testError, {
    tags: {
      test: "manual-capture",
      component: "test-sentry-route",
    },
    extra: {
      timestamp: new Date().toISOString(),
      purpose: "Verify Sentry integration",
    },
  });

  return NextResponse.json({
    success: true,
    message: "Error sent to Sentry. Check your dashboard.",
  });
}
