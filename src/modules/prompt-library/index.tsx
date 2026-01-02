'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookText, Plus, Grid3x3, List, Star, Loader2, Sparkles, Database } from 'lucide-react';
import { PromptList } from './components/prompt-list';
import { CreatePromptDialog } from './components/create-prompt-dialog';
import { FilterBar } from './components/filter-bar';
import { SourcesList } from './components/sources-list';
import type { Prompt, PromptCategory, PromptStatus } from '@/lib/prompt-library/types';
import { toast } from 'sonner';

type ViewMode = 'cards' | 'list';
type TabValue = 'prompts' | 'sources';
type StatusFilter = PromptStatus | 'all';

export default function PromptLibraryModule() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftCount, setDraftCount] = useState(0);

  // UI State
  const [activeTab, setActiveTab] = useState<TabValue>('prompts');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | 'all'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('published');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch draft count for badge
  const fetchDraftCount = useCallback(async () => {
    try {
      const response = await fetch('/api/prompt-library?status=draft');
      if (response.ok) {
        const data = await response.json();
        setDraftCount(data.length);
      }
    } catch {
      // Silently ignore - not critical
    }
  }, []);

  // Fetch prompts
  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (showFavoritesOnly) params.append('favorites', 'true');
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedStatus !== 'published') params.append('status', selectedStatus);

      const response = await fetch(`/api/prompt-library?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch prompts');

      const data = await response.json();
      setPrompts(data);
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError('Impossible de charger les prompts.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, showFavoritesOnly, debouncedSearch, selectedStatus]);

  // Handle discover
  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      const response = await fetch('/api/prompt-library/discover', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to discover prompts');

      const data = await response.json();
      if (data.success && data.count > 0) {
        toast.success(`${data.count} nouveaux prompts découverts !`);
        // Switch to drafts tab and refresh
        setSelectedStatus('draft');
        fetchDraftCount();
      } else {
        toast.info('Aucun nouveau prompt trouvé.');
      }
    } catch (err) {
      console.error('Error discovering prompts:', err);
      toast.error('Erreur lors de la découverte de prompts.');
    } finally {
      setDiscovering(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'prompts') {
      fetchPrompts();
      fetchDraftCount();
    }
  }, [fetchPrompts, fetchDraftCount, activeTab]);

  // Handle prompt created
  const handlePromptCreated = useCallback((prompt: Prompt) => {
    setPrompts((prev) => [prompt, ...prev]);
    setCreateDialogOpen(false);
  }, []);

  // Handle prompt deleted
  const handlePromptDeleted = useCallback((id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Handle prompt updated
  const handlePromptUpdated = useCallback((updated: Prompt) => {
    setPrompts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const stats = useMemo(() => {
    return {
      total: prompts.length,
      favorites: prompts.filter((p) => p.is_favorite).length,
      categories: new Set(prompts.map((p) => p.category)).size
    };
  }, [prompts]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header with Aurora accent */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-aurora-magenta/20 to-aurora-violet/20 text-aurora-magenta border border-aurora-magenta/20">
            <BookText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Prompt Library</h1>
            <p className="text-muted-foreground">
              Gérez et réutilisez vos meilleurs prompts
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="prompts" className="gap-2">
              <BookText className="h-4 w-4" />
              Prompts
            </TabsTrigger>
            <TabsTrigger value="sources" className="gap-2">
              <Database className="h-4 w-4" />
              Sources
            </TabsTrigger>
          </TabsList>

          {/* Actions for Prompts tab */}
          {activeTab === 'prompts' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDiscover}
                disabled={discovering}
                className="border-aurora-violet/30 hover:border-aurora-violet/50 hover:bg-aurora-violet/5"
              >
                {discovering ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4 text-aurora-violet" />
                )}
                Découvrir
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('cards')}
                className={viewMode === 'cards' ? 'bg-gradient-to-r from-primary to-aurora-violet' : 'border-primary/30 hover:border-primary/50'}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-gradient-to-r from-primary to-aurora-violet' : 'border-primary/30 hover:border-primary/50'}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)} className="bg-gradient-to-r from-aurora-magenta to-aurora-violet hover:from-aurora-magenta/90 hover:to-aurora-violet/90 transition-all">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau prompt
              </Button>
            </div>
          )}
        </div>

        {/* Prompts Tab Content */}
        <TabsContent value="prompts" className="flex-1 flex flex-col space-y-6 mt-6">
          {/* Stats with subtle Aurora accents */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-aurora-magenta/20 hover:border-aurora-magenta/30 transition-colors">
              <CardHeader className="pb-2">
                <CardDescription>Total</CardDescription>
                <CardTitle className="text-2xl text-aurora-magenta">{loading ? '-' : stats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-yellow-500/20 hover:border-yellow-500/30 transition-colors">
              <CardHeader className="pb-2">
                <CardDescription>Favoris</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  {loading ? '-' : stats.favorites}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-aurora-violet/20 hover:border-aurora-violet/30 transition-colors">
              <CardHeader className="pb-2">
                <CardDescription>Catégories utilisées</CardDescription>
                <CardTitle className="text-2xl text-aurora-violet">{loading ? '-' : stats.categories}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filters */}
          <FilterBar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            showFavoritesOnly={showFavoritesOnly}
            onShowFavoritesChange={setShowFavoritesOnly}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            draftCount={draftCount}
          />

          {/* Content */}
          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Erreur</CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={fetchPrompts} variant="outline">
                    Réessayer
                  </Button>
                </CardContent>
              </Card>
            ) : prompts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <BookText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || selectedCategory !== 'all' || showFavoritesOnly
                      ? 'Aucun prompt ne correspond aux filtres.'
                      : 'Aucun prompt enregistré. Créez votre premier prompt !'}
                  </p>
                  {(searchQuery || selectedCategory !== 'all' || showFavoritesOnly) ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setShowFavoritesOnly(false);
                      }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  ) : (
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Créer un prompt
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <PromptList
                prompts={prompts}
                viewMode={viewMode}
                onDelete={handlePromptDeleted}
                onUpdate={handlePromptUpdated}
              />
            )}
          </div>
        </TabsContent>

        {/* Sources Tab Content */}
        <TabsContent value="sources" className="flex-1 mt-6">
          <SourcesList />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <CreatePromptDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onPromptCreated={handlePromptCreated}
      />
    </div>
  );
}
