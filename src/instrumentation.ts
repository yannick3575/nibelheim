/**
 * Next.js Instrumentation
 *
 * This file is used to register instrumentation hooks.
 * Sentry uses this to initialize on server startup.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Server-side Sentry initialization
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime Sentry initialization
    await import("../sentry.edge.config");
  }
}

export const onRequestError = async (
  error: Error,
  request: Request,
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string | undefined;
    routeType: "render" | "route" | "action" | "middleware";
    renderSource: "react-server-components" | "react-server-components-payload" | "server-rendering" | undefined;
    revalidateReason: "on-demand" | "stale" | undefined;
    serverComponentType: "unknown" | "page" | "layout" | "loading" | "template" | "not-found" | "error" | "global-error" | undefined;
  }
) => {
  // Dynamic import to avoid issues during build
  const Sentry = await import("@sentry/nextjs");

  Sentry.captureException(error, {
    tags: {
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    },
    extra: {
      url: request.url,
      method: request.method,
      renderSource: context.renderSource,
      revalidateReason: context.revalidateReason,
      serverComponentType: context.serverComponentType,
    },
  });
};
