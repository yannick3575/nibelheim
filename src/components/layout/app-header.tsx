'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { moduleRegistry } from '@/modules/registry';

export function AppHeader() {
    const pathname = usePathname();

    // Find current module based on pathname
    const currentModule = moduleRegistry.modules.find(m => pathname.startsWith(m.route));

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href="/">Nibelheim</BreadcrumbLink>
                    </BreadcrumbItem>
                    {currentModule && (
                        <>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{currentModule.name}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </>
                    )}
                    {pathname === '/' && (
                        <>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Dashboard</BreadcrumbPage>
                            </BreadcrumbItem>
                        </>
                    )}
                </BreadcrumbList>
            </Breadcrumb>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search trigger */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
                className="hidden sm:flex items-center gap-2 text-muted-foreground border-border/50 hover:border-primary/50"
            >
                <Search className="h-3.5 w-3.5" />
                <span className="text-xs">Rechercher...</span>
                <kbd className="ml-2 rounded border px-1.5 py-0.5 text-[10px] font-medium">
                    ⌘K
                </kbd>
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
                className="sm:hidden h-8 w-8"
            >
                <Search className="h-4 w-4" />
            </Button>
        </header>
    );
}
