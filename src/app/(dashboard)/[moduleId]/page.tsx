import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { moduleRegistry } from '@/modules/registry';
import { Skeleton } from '@/components/ui/skeleton';

interface ModulePageProps {
    params: Promise<{
        moduleId: string;
    }>;
}

function ModuleLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-64" />
        </div>
    );
}

export default async function ModulePage({ params }: ModulePageProps) {
    const { moduleId } = await params;
    const currentModule = moduleRegistry.getModule(moduleId);

    if (!currentModule || !currentModule.enabled) {
        notFound();
    }

    const ModuleComponent = currentModule.component;

    return (
        <Suspense fallback={<ModuleLoading />}>
            <ModuleComponent />
        </Suspense>
    );
}

// Generate static params for enabled modules
export async function generateStaticParams() {
    const enabledModules = moduleRegistry.getEnabledModules();
    return enabledModules.map((mod) => ({
        moduleId: mod.id,
    }));
}
