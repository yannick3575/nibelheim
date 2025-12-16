'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rss, RefreshCw, Calendar, Loader2, BookOpen } from 'lucide-react';
import { DigestList } from './components/digest-list';
import { ArticleCard } from './components/article-card';
import type { DigestMeta, DigestWithArticles } from '@/lib/tech-watch';

export default function TechWatchModule() {
    const [digests, setDigests] = useState<DigestMeta[]>([]);
    const [currentDigest, setCurrentDigest] = useState<DigestWithArticles | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch digest history
    const fetchDigests = useCallback(async () => {
        try {
            const response = await fetch('/api/tech-watch/digests');
            if (!response.ok) throw new Error('Failed to fetch digests');
            const data = await response.json();
            setDigests(data);
        } catch (err) {
            console.error('Error fetching digests:', err);
        }
    }, []);

    // Fetch a specific digest by date or latest
    const fetchDigest = useCallback(async (date?: string) => {
        setLoading(true);
        setError(null);
        try {
            const url = date
                ? `/api/tech-watch/digests/${date}`
                : '/api/tech-watch/latest';

            const response = await fetch(url);

            if (response.status === 404) {
                setCurrentDigest(null);
                setLoading(false);
                return;
            }

            if (!response.ok) throw new Error('Failed to fetch digest');

            const data = await response.json();
            setCurrentDigest(data);
        } catch (err) {
            console.error('Error fetching digest:', err);
            setError('Impossible de charger la veille.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle date selection from history
    const handleSelectDate = useCallback((date: string) => {
        setSelectedDate(date);
        fetchDigest(date);
    }, [fetchDigest]);

    // Handle article read toggle
    const handleToggleRead = useCallback(async (id: string, read: boolean) => {
        const response = await fetch(`/api/tech-watch/articles/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read })
        });

        if (!response.ok) {
            throw new Error('Failed to update article');
        }
    }, []);

    // Refresh current view
    const handleRefresh = useCallback(() => {
        fetchDigests();
        fetchDigest(selectedDate || undefined);
    }, [fetchDigests, fetchDigest, selectedDate]);

    // Initial load
    useEffect(() => {
        fetchDigests();
        fetchDigest();
    }, [fetchDigests, fetchDigest]);

    // Calculate stats
    const totalArticles = currentDigest?.articles?.length || 0;
    const unreadArticles = currentDigest?.articles?.filter(a => !a.read).length || 0;

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
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0">
                {loading && !currentDigest ? (
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
                ) : currentDigest ? (
                    <div className="grid gap-6 lg:grid-cols-4">
                        {/* Main Content Area - Articles */}
                        <div className="lg:col-span-3 space-y-4">
                            {/* Digest Header */}
                            <Card>
                                <CardHeader className="border-b bg-muted/20">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <CardTitle className="flex items-center gap-2">
                                                <Rss className="h-5 w-5" />
                                                Daily Digest
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-4">
                                                <span className="flex items-center">
                                                    <Calendar className="mr-1.5 h-3.5 w-3.5" />
                                                    {new Date(currentDigest.period_start).toLocaleDateString('fr-FR', {
                                                        weekday: 'long',
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                                <span className="flex items-center">
                                                    <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                                                    {unreadArticles} / {totalArticles} non lus
                                                </span>
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>

                            {/* Individual Article Cards */}
                            {currentDigest.articles && currentDigest.articles.length > 0 ? (
                                currentDigest.articles.map((article) => (
                                    <ArticleCard
                                        key={article.id}
                                        article={article}
                                        onToggleRead={handleToggleRead}
                                    />
                                ))
                            ) : (
                                <Card className="border-dashed">
                                    <CardContent className="py-8 text-center text-muted-foreground">
                                        Aucun article dans ce digest
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar - History */}
                        <div className="space-y-4">
                            <DigestList
                                digests={digests}
                                selectedDate={selectedDate || currentDigest.period_start.split('T')[0]}
                                onSelect={handleSelectDate}
                            />

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">À propos</CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground">
                                    Contenu généré automatiquement en analysant les top articles de Hacker News (&gt;100 pts) et leurs discussions.
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-4">
                        <div className="lg:col-span-3">
                            <Card className="border-dashed">
                                <CardHeader>
                                    <CardTitle>Aucune veille disponible</CardTitle>
                                    <CardDescription>
                                        Le bot n&apos;a pas encore généré de digest.
                                        Assurez-vous que l&apos;action GitHub a tourné et que les variables d&apos;environnement Supabase sont configurées.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                        <div className="space-y-4">
                            <DigestList
                                digests={digests}
                                selectedDate={null}
                                onSelect={handleSelectDate}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
