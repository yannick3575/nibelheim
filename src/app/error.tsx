"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    console.error("[app-error]", error);

    // Report to Sentry with context
    Sentry.captureException(error, {
      tags: {
        component: "app-error-boundary",
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Une erreur est survenue</h2>
          <p className="text-muted-foreground">
            Nous sommes désolés, une erreur inattendue s&apos;est produite.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={() => reset()}>Réessayer</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Retour à l&apos;accueil
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Code erreur: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
