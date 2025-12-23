"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard-error]", error);

    // Report to Sentry with context
    Sentry.captureException(error, {
      tags: {
        component: "dashboard-error-boundary",
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
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Erreur de chargement</h2>
          <p className="text-sm text-muted-foreground">
            Impossible de charger cette page. Veuillez réessayer.
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <Button onClick={() => reset()} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/")}
          >
            <Home className="mr-2 h-4 w-4" />
            Accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
