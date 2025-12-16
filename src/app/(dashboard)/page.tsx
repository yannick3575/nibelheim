import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { moduleRegistry } from '@/modules/registry';
import { ArrowRight, Sparkles, Zap, Brain } from 'lucide-react';

export default function DashboardPage() {
    const enabledModules = moduleRegistry.getEnabledModules();

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">
                    Bienvenue sur <span className="text-primary">Nibelheim</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                    Votre laboratoire personnel d&apos;expérimentation IA, ML et automatisations.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Modules actifs</CardTitle>
                        <Sparkles className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{enabledModules.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {enabledModules.length === 1 ? 'module activé' : 'modules activés'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Agents IA</CardTitle>
                        <Brain className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">
                            agents configurés
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Automatisations</CardTitle>
                        <Zap className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">
                            tâches actives
                        </p>
                    </CardContent>
                </Card>
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
                            <Card key={module.id} className="group hover:border-primary/50 transition-colors">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{module.name}</CardTitle>
                                            {module.category && (
                                                <span className="text-xs text-muted-foreground capitalize">
                                                    {module.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <CardDescription>{module.description}</CardDescription>
                                    <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Link href={module.route}>
                                            Ouvrir
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {/* Add Module Card */}
                    <Card className="border-dashed flex flex-col items-center justify-center min-h-[200px]">
                        <CardContent className="text-center space-y-2 pt-6">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <Sparkles className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <CardTitle className="text-base">Nouveau module</CardTitle>
                            <CardDescription>
                                Créez un nouveau module d&apos;expérimentation
                            </CardDescription>
                            <Button variant="ghost" size="sm" disabled>
                                Bientôt disponible
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
