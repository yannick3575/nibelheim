import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar, AppHeader } from '@/components/layout';
import { AuroraBackground } from '@/components/ui/aurora-background';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuroraBackground className="min-h-screen">
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="bg-transparent">
                    <AppHeader />
                    <main className="flex-1 overflow-auto p-4 md:p-6">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </AuroraBackground>
    );
}
