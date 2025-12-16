'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rss, Plus, RefreshCw, Calendar, Loader2 } from 'lucide-react';
import { MarkdownRenderer } from '@/components/markdown-renderer';

interface Digest {
    date: string;
    content: string;
}

export default function TechWatchModule() {
    const [digest, setDigest] = useState<Digest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDigest = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/tech-watch/latest');
            if (response.status === 404) {
                setDigest(null);
                setLoading(false);
                return;
            }
            if (!response.ok) throw new Error('Failed to fetch digest');
            const data = await response.json();
            setDigest(data);
        } catch (err) {
            console.error(err);
            setError('Impossible de charger la veille.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDigest();
    }, []);

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tech Watch</h1>
                    <p className="text-muted-foreground">
                        Veille technologique automatisée via Gemini
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchDigest}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0">
                {loading ? (
                    <div className="h-64 flex items-center justify-center border rounded-lg border-dashed">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <Card className="border-destructive/50">
                        <CardHeader>
                            <CardTitle className="text-destructive">Erreur</CardTitle>
                            <CardDescription>{error}</CardDescription>
                        </CardHeader>
                    </Card>
                ) : digest ? (
                    <div className="grid gap-6 md:grid-cols-4 h-full">
                        {/* Main Reading Area */}
                        <Card className="md:col-span-3 h-fit">
                            <CardHeader className="border-b bg-muted/20">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <CardTitle>Daily Digest</CardTitle>
                                        <CardDescription className="flex items-center">
                                            <Calendar className="mr-2 h-3 w-3" />
                                            {digest.date}
                                        </CardDescription>
                                    </div>
                                    <Rss className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <MarkdownRenderer content={digest.content} />
                            </CardContent>
                        </Card>

                        {/* Sidebar / Stats (Future History List) */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">À propos</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    Ce contenu est généré automatiquement par l&apos;agent Tech Watch en analysant les tops articles de Hacker News (&gt;100 pts) et leurs discussions.
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle>Aucune veille disponible</CardTitle>
                            <CardDescription>
                                Le bot n&apos;a pas encore généré de digest pour aujourd&apos;hui.
                                Assurez-vous que l&apos;action GitHub a tourné.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>
        </div>
    );
}
