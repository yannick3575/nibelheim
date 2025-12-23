"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function ModuleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const params = useParams();
  const moduleId = params?.moduleId as string;

  useEffect(() => {
    console.error("[module-error]", error);

    // Report to Sentry with module context
    Sentry.captureException(error, {
      tags: {
        component: "module-error-boundary",
        moduleId: moduleId,
        errorDigest: error.digest,
      },
      extra: {
        digest: error.digest,
        errorName: error.name,
        errorMessage: error.message,
        moduleId: moduleId,
      },
    });
  }, [error, moduleId]);

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Erreur du module</h2>
          <p className="text-sm text-muted-foreground">
            Ce module a rencontré un problème. Veuillez réessayer ou retourner au
            dashboard.
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <Button onClick={() => reset()} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
