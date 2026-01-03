'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Rss, RefreshCw, Calendar, Loader2, BookOpen, Star } from 'lucide-react';
import { DigestList } from './components/digest-list';
import { ArticleCard } from './components/article-card';
import type { DigestMeta, DigestWithArticles, Article } from '@/lib/tech-watch';

export default function TechWatchModule() {
    const [digests, setDigests] = useState<DigestMeta[]>([]);
    const [currentDigest, setCurrentDigest] = useState<DigestWithArticles | null>(null);
    const [favorites, setFavorites] = useState<Article[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'digest' | 'favorites'>('digest');
    const [loading, setLoading] = useState(true);
    const [favoritesLoading, setFavoritesLoading] = useState(false);
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

    // Fetch favorite articles
    const fetchFavorites = useCallback(async () => {
        setFavoritesLoading(true);
        try {
            const response = await fetch('/api/tech-watch/favorites');
            if (!response.ok) throw new Error('Failed to fetch favorites');
            const data = await response.json();
            setFavorites(data);
        } catch (err) {
            console.error('Error fetching favorites:', err);
        } finally {
            setFavoritesLoading(false);
        }
    }, []);

    // Handle date selection from history
    const handleSelectDate = useCallback((date: string) => {
        setSelectedDate(date);
        fetchDigest(date);
        setActiveTab('digest');
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

        // Update local state to maintain UI consistency if parent re-renders
        setCurrentDigest(prev => prev ? {
            ...prev,
            articles: prev.articles.map(a =>
                a.id === id ? { ...a, read } : a
            )
        } : null);
    }, []);

    // Handle article favorite toggle
    const handleToggleFavorite = useCallback(async (id: string, is_favorite: boolean) => {
        const response = await fetch(`/api/tech-watch/articles/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_favorite })
        });

        if (!response.ok) {
            throw new Error('Failed to update article');
        }

        // Update local state for digest articles
        setCurrentDigest(prev => prev ? {
            ...prev,
            articles: prev.articles.map(a =>
                a.id === id ? { ...a, is_favorite } : a
            )
        } : null);

        // Update favorites list
        if (is_favorite) {
            // Refresh favorites to get the full article
            fetchFavorites();
        } else {
            // Remove from favorites
            setFavorites(prev => prev.filter(a => a.id !== id));
        }
    }, [fetchFavorites]);

    // Refresh current view
    const handleRefresh = useCallback(() => {
        fetchDigests();
        fetchDigest(selectedDate || undefined);
        if (activeTab === 'favorites') {
            fetchFavorites();
        }
    }, [fetchDigests, fetchDigest, fetchFavorites, selectedDate, activeTab]);

    // Handle tab change
    const handleTabChange = useCallback((value: string) => {
        setActiveTab(value as 'digest' | 'favorites');
        if (value === 'favorites' && favorites.length === 0) {
            fetchFavorites();
        }
    }, [favorites.length, fetchFavorites]);

    // Initial load - fetch in parallel to avoid waterfall
    useEffect(() => {
        Promise.all([fetchDigests(), fetchDigest()]);
    }, [fetchDigests, fetchDigest]);

    // Calculate stats
    const totalArticles = currentDigest?.articles?.length || 0;
    const unreadArticles = currentDigest?.articles?.filter(a => !a.read).length || 0;

    return (
        <div className="space-y-4 sm:space-y-6 h-full flex flex-col">
            {/* Header with Aurora accent */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-aurora-cyan/20 to-aurora-teal/20 text-aurora-cyan border border-aurora-cyan/20 flex-shrink-0">
                        <Rss className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tech Watch</h1>
                        <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">
                            Veille technologique automatisée via Gemini
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 sm:flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={handleRefresh} className="border-aurora-cyan/30 hover:border-aurora-cyan/50 hover:bg-aurora-cyan/10 transition-all">
                        <RefreshCw className={`sm:mr-2 h-4 w-4 ${loading || favoritesLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Actualiser</span>
                    </Button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
                <TabsList className="w-full sm:w-fit grid grid-cols-2 sm:flex">
                    <TabsTrigger value="digest" className="gap-1 sm:gap-2">
                        <Rss className="h-4 w-4" />
                        <span className="hidden sm:inline">Daily </span>Digest
                    </TabsTrigger>
                    <TabsTrigger value="favorites" className="gap-1 sm:gap-2">
                        <Star className="h-4 w-4" />
                        Favoris
                        {favorites.length > 0 && (
                            <span className="ml-1 text-xs bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded-full">
                                {favorites.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Daily Digest Tab */}
                <TabsContent value="digest" className="flex-1 min-h-0 mt-4">
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
                        <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">
                            {/* Main Content Area - Articles */}
                            <div className="lg:col-span-3 space-y-3 sm:space-y-4 order-2 lg:order-1">
                                {/* Digest Header */}
                                <Card>
                                    <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
                                        <div className="flex justify-between items-start sm:items-center">
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                                    <Rss className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                                    <span className="truncate">Daily Digest</span>
                                                </CardTitle>
                                                <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                                                    <span className="flex items-center">
                                                        <Calendar className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                                        <span className="truncate">
                                                            {new Date(currentDigest.period_start).toLocaleDateString('fr-FR', {
                                                                weekday: 'short',
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </span>
                                                    <span className="flex items-center">
                                                        <BookOpen className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
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
                                            onToggleFavorite={handleToggleFavorite}
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
                            <div className="space-y-4 order-1 lg:order-2">
                                <DigestList
                                    digests={digests}
                                    selectedDate={selectedDate || currentDigest.period_start.split('T')[0]}
                                    onSelect={handleSelectDate}
                                />

                                <Card className="hidden lg:block">
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
                        <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">
                            <div className="lg:col-span-3 order-2 lg:order-1">
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
                            <div className="space-y-4 order-1 lg:order-2">
                                <DigestList
                                    digests={digests}
                                    selectedDate={null}
                                    onSelect={handleSelectDate}
                                />
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* Favorites Tab */}
                <TabsContent value="favorites" className="flex-1 min-h-0 mt-4">
                    {favoritesLoading ? (
                        <div className="h-64 flex items-center justify-center border rounded-lg border-dashed">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : favorites.length > 0 ? (
                        <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">
                            <div className="lg:col-span-3 space-y-3 sm:space-y-4 order-2 lg:order-1">
                                {/* Favorites Header */}
                                <Card>
                                    <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
                                        <div className="flex justify-between items-start sm:items-center">
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                                                    <span className="truncate">Mes Favoris</span>
                                                </CardTitle>
                                                <CardDescription className="text-xs sm:text-sm">
                                                    {favorites.length} article{favorites.length > 1 ? 's' : ''} sauvegardé{favorites.length > 1 ? 's' : ''}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>

                                {/* Favorite Article Cards */}
                                {favorites.map((article) => (
                                    <ArticleCard
                                        key={article.id}
                                        article={article}
                                        onToggleRead={handleToggleRead}
                                        onToggleFavorite={handleToggleFavorite}
                                    />
                                ))}
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-4 order-1 lg:order-2">
                                <Card className="hidden lg:block">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">À propos des Favoris</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground">
                                        Les articles favoris sont sauvegardés pour référence future. Cliquez sur l&apos;étoile pour ajouter ou retirer un article de vos favoris.
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <Card className="border-dashed">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Star className="h-5 w-5" />
                                    Aucun favori
                                </CardTitle>
                                <CardDescription>
                                    Vous n&apos;avez pas encore ajouté d&apos;articles à vos favoris.
                                    Cliquez sur l&apos;étoile d&apos;un article pour le sauvegarder ici.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
