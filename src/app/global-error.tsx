"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Global Error Boundary
 *
 * This catches errors that occur in the root layout.
 * It's the last line of defense for unhandled errors.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console
    console.error("[global-error]", error);

    // Report to Sentry with high priority
    Sentry.captureException(error, {
      level: "fatal",
      tags: {
        component: "global-error-boundary",
        errorDigest: error.digest,
      },
      extra: {
        digest: error.digest,
        errorName: error.name,
        errorMessage: error.message,
      },
    });
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a0a",
            color: "#fafafa",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "28rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            <div
              style={{
                width: "4rem",
                height: "4rem",
                margin: "0 auto",
                borderRadius: "9999px",
                backgroundColor: "rgba(220, 38, 38, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
                Erreur critique
              </h2>
              <p style={{ color: "#a1a1aa", margin: 0 }}>
                Une erreur inattendue s&apos;est produite. Notre équipe a été
                notifiée.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#fafafa",
                  color: "#0a0a0a",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Réessayer
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "transparent",
                  color: "#fafafa",
                  border: "1px solid #27272a",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Retour à l&apos;accueil
              </button>
            </div>

            {error.digest && (
              <p style={{ fontSize: "0.75rem", color: "#71717a", margin: 0 }}>
                Code erreur: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
