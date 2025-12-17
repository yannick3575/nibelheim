"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ModuleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[module-error]", error);
  }, [error]);

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
