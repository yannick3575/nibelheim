'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rss, Plus, Search, FileText } from 'lucide-react';

export default function TechWatchModule() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tech Watch</h1>
                    <p className="text-muted-foreground">
                        Veille technologique avec agent IA et résumés automatiques
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Search className="mr-2 h-4 w-4" />
                        Rechercher
                    </Button>
                    <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter une source
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Articles collectés</CardTitle>
                        <Rss className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">
                            Aucun article pour le moment
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sources actives</CardTitle>
                        <Rss className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">
                            Configurez vos premières sources
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Résumés générés</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">
                            Digests quotidiens
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Empty State */}
            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle>Commencez votre veille</CardTitle>
                    <CardDescription>
                        Ajoutez des sources RSS ou des APIs pour commencer à collecter des articles.
                        L&apos;agent IA les analysera et créera des résumés quotidiens.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter votre première source
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
