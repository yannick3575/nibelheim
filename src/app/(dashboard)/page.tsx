import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { moduleRegistry } from '@/modules/registry';
import { ArrowRight, Sparkles, FlaskConical } from 'lucide-react';

export default function DashboardPage() {
    const enabledModules = moduleRegistry.getEnabledModules();

    return (
        <div className="space-y-8">
            {/* Hero Vision UI Section - More subtle */}
            <div className="relative overflow-hidden rounded-2xl glass-vision-strong">
                {/* Vision UI: Noise + Grid overlays */}
                <div className="noise absolute inset-0 pointer-events-none opacity-30" />
                <div className="grid-pattern absolute inset-0 pointer-events-none opacity-20" />

                {/* Subtle aurora orbs - reduced opacity */}
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className="absolute -top-1/2 -left-1/4 w-[600px] h-[600px] rounded-full opacity-15"
                        style={{
                            background: 'radial-gradient(circle, oklch(0.72 0.24 210 / 50%) 0%, transparent 70%)',
                            filter: 'blur(80px)',
                            animation: 'aurora-float 20s ease-in-out infinite',
                        }}
                    />
                    <div
                        className="absolute -bottom-1/3 -right-1/4 w-[500px] h-[500px] rounded-full opacity-12"
                        style={{
                            background: 'radial-gradient(circle, oklch(0.68 0.28 285 / 50%) 0%, transparent 70%)',
                            filter: 'blur(80px)',
                            animation: 'aurora-float 25s ease-in-out infinite reverse',
                        }}
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 px-8 py-12 md:py-16">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="space-y-4 max-w-2xl">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-aurora-violet shadow-lg shadow-primary/30">
                                    <FlaskConical className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                                <span className="text-sm text-muted-foreground font-medium">Lab Dashboard</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                                Bienvenue sur{' '}
                                <span className="aurora-text">Nibelheim</span>
                            </h1>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Votre laboratoire personnel d&apos;expérimentation IA, ML et automatisations.
                                Explorez, créez et innovez.
                            </p>
                        </div>

                        {/* Decorative element - Vision UI neon glow */}
                        <div className="hidden lg:flex items-center justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 neon-glow rounded-full animate-pulse" />
                                <div className="relative flex h-32 w-32 items-center justify-center rounded-full glass-vision neon-border">
                                    <Sparkles className="h-12 w-12 text-primary" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom gradient fade */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-aurora-cyan/50 to-transparent" />
            </div>

            {/* Active Modules */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold tracking-tight">Vos modules</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {enabledModules.map((module) => {
                        const Icon = module.icon;
                        return (
                            <Card key={module.id} className="group relative overflow-hidden">
                                {/* Animated gradient overlay on hover */}
                                <div className="absolute inset-0 animated-gradient-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                <CardHeader className="relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg glass-vision text-primary group-hover:neon-glow transition-all duration-300">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg group-hover:neon-text transition-all duration-300">{module.name}</CardTitle>
                                            {module.category && (
                                                <span className="text-xs text-muted-foreground capitalize">
                                                    {module.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 relative z-10">
                                    <CardDescription>{module.description}</CardDescription>
                                    <Button asChild variant="vision" className="w-full group-hover:animated-gradient group-hover:text-white transition-all duration-300">
                                        <Link href={module.route}>
                                            Ouvrir
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {/* Add Module Card */}
                    <Card className="border-dashed border-primary/10 flex flex-col items-center justify-center min-h-[200px] group hover:neon-border transition-all duration-300">
                        <CardContent className="text-center space-y-2 pt-6">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full glass-vision group-hover:neon-glow transition-all duration-300">
                                <Sparkles className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <CardTitle className="text-base">Nouveau module</CardTitle>
                            <CardDescription>
                                Créez un nouveau module d&apos;expérimentation
                            </CardDescription>
                            <Button variant="visionGhost" size="sm" disabled className="opacity-50">
                                Bientôt disponible
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
