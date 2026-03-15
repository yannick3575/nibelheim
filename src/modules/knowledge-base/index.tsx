'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Plus, Grid3x3, List } from 'lucide-react';
import { EntryCard } from './components/entry-card';
import { CreateEntryDialog } from './components/create-entry-dialog';
import { EditEntryDialog } from './components/edit-entry-dialog';
import { FilterBar } from './components/filter-bar';
import { EntryStats } from './components/entry-stats';
import type { KBEntry, KBEntryType, KBCategory } from '@/lib/knowledge-base/types';

type ViewMode = 'cards' | 'list';

export default function KnowledgeBaseModule() {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<KBEntryType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<KBCategory | 'all'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KBEntry | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (showFavoritesOnly) params.append('favorites', 'true');
      if (debouncedSearch) params.append('search', debouncedSearch);

      const response = await fetch(`/api/knowledge-base?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch entries');

      const data = await response.json();
      setEntries(data);
    } catch {
      setError('Impossible de charger les entrées.');
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedCategory, showFavoritesOnly, debouncedSearch]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Handlers
  const handleEntryCreated = useCallback((entry: KBEntry) => {
    setEntries((prev) => [entry, ...prev]);
    setCreateDialogOpen(false);
  }, []);

  const handleEntryDeleted = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleEntryUpdated = useCallback((updated: KBEntry) => {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setEditingEntry(null);
  }, []);

  const stats = useMemo(() => {
    return {
      total: entries.length,
      notes: entries.filter((e) => e.type === 'note').length,
      bookmarks: entries.filter((e) => e.type === 'bookmark').length,
      snippets: entries.filter((e) => e.type === 'snippet').length,
      favorites: entries.filter((e) => e.is_favorite).length,
    };
  }, [entries]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-aurora-cyan/20 to-aurora-teal/20 text-aurora-cyan border border-aurora-cyan/20">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
            <p className="text-muted-foreground">Votre second cerveau — notes, bookmarks et snippets</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('cards')}
            className={
              viewMode === 'cards'
                ? 'bg-gradient-to-r from-primary to-aurora-teal'
                : 'border-primary/30 hover:border-primary/50'
            }
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className={
              viewMode === 'list'
                ? 'bg-gradient-to-r from-primary to-aurora-teal'
                : 'border-primary/30 hover:border-primary/50'
            }
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-aurora-cyan to-aurora-teal hover:from-aurora-cyan/90 hover:to-aurora-teal/90 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle entrée
          </Button>
        </div>
      </div>

      {/* Stats */}
      <EntryStats stats={stats} loading={loading} />

      {/* Filters */}
      <FilterBar
        selectedType={selectedType}
        onTypeChange={setSelectedType}
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
              <Button onClick={fetchEntries} variant="outline">
                Réessayer
              </Button>
            </CardContent>
          </Card>
        ) : entries.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedType !== 'all' || selectedCategory !== 'all' || showFavoritesOnly
                  ? 'Aucune entrée ne correspond aux filtres.'
                  : 'Votre base de connaissances est vide. Commencez par ajouter une note !'}
              </p>
              {searchQuery || selectedType !== 'all' || selectedCategory !== 'all' || showFavoritesOnly ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('all');
                    setSelectedCategory('all');
                    setShowFavoritesOnly(false);
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              ) : (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une entrée
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'cards' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onDelete={handleEntryDeleted}
                onUpdate={handleEntryUpdated}
                onEdit={setEditingEntry}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onDelete={handleEntryDeleted}
                onUpdate={handleEntryUpdated}
                onEdit={setEditingEntry}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <CreateEntryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onEntryCreated={handleEntryCreated}
      />

      {/* Edit Dialog */}
      {editingEntry && (
        <EditEntryDialog
          open={!!editingEntry}
          onOpenChange={(open) => {
            if (!open) setEditingEntry(null);
          }}
          entry={editingEntry}
          onEntryUpdated={handleEntryUpdated}
        />
      )}
    </div>
  );
}
