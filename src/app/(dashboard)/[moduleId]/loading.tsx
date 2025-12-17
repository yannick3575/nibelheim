import { Skeleton } from "@/components/ui/skeleton";

export default function ModuleLoading() {
  return (
    <div className="space-y-6">
      {/* Module header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Module content skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
