'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookText, Plus, Grid3x3, List, Star, Loader2 } from 'lucide-react';
import { PromptCard } from './components/prompt-card';
import { PromptListItem } from './components/prompt-list-item';
import { CreatePromptDialog } from './components/create-prompt-dialog';
import { FilterBar } from './components/filter-bar';
import type { Prompt, PromptCategory } from '@/lib/prompt-library/types';

type ViewMode = 'cards' | 'list';

export default function PromptLibraryModule() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | 'all'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch prompts
  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (showFavoritesOnly) params.append('favorites', 'true');
      if (debouncedSearch) params.append('search', debouncedSearch);

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
  }, [selectedCategory, showFavoritesOnly, debouncedSearch]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

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

  const totalPrompts = prompts.length;
  const favoriteCount = prompts.filter((p) => p.is_favorite).length;
  const categoryCount = new Set(prompts.map((p) => p.category)).size;

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookText className="h-8 w-8" />
            Prompt Library
          </h1>
          <p className="text-muted-foreground">
            Gérez et réutilisez vos meilleurs prompts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('cards')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau prompt
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{loading ? '-' : totalPrompts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Favoris</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              {loading ? '-' : favoriteCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Catégories utilisées</CardDescription>
            <CardTitle className="text-2xl">{loading ? '-' : categoryCount}</CardTitle>
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
              {!searchQuery && selectedCategory === 'all' && !showFavoritesOnly && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un prompt
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'cards' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onDelete={handlePromptDeleted}
                onUpdate={handlePromptUpdated}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {prompts.map((prompt) => (
              <PromptListItem
                key={prompt.id}
                prompt={prompt}
                onDelete={handlePromptDeleted}
                onUpdate={handlePromptUpdated}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <CreatePromptDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onPromptCreated={handlePromptCreated}
      />
    </div>
  );
}
