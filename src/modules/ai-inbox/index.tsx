'use client';

<<<<<<< HEAD
import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { InboxList } from './components/inbox-list';
import { InboxHeader } from './components/inbox-header';
import { FilterBar } from './components/filter-bar';
import { AddItemDialog } from './components/add-item-dialog';
import { SettingsDialog } from './components/settings-dialog';
import type { Item, Status, StatusFilter, CategoryFilter, SourceTypeFilter } from '@/types/ai-inbox';

export function AIInboxModule() {
=======
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Inbox, RefreshCw, Plus, Settings } from 'lucide-react';
import { InboxList } from './components/inbox-list';
import { AddItemDialog } from './components/add-item-dialog';
import { SettingsDialog } from './components/settings-dialog';
import { FilterBar } from './components/filter-bar';
import { createClient } from '@/lib/supabase/client';
import type { Item, Status, Category, SourceType } from '@/types/ai-inbox';

type StatusFilter = Status | 'all';
type CategoryFilter = Category | 'all';
type SourceTypeFilter = SourceType | 'all';

export default function AIInboxModule() {
>>>>>>> remotes/origin/palette-message-bubble-ux-9879608455324157822
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedSourceType, setSelectedSourceType] = useState<SourceTypeFilter>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all items without server-side filtering for local filtering
      const response = await fetch('/api/ai-inbox/items');
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setItems(data);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Impossible de charger les items.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('ai_inbox_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_inbox_items',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as Item;
            setItems((prev) => {
              // Avoid duplicates
              if (prev.find((item) => item.id === newItem.id)) return prev;
              return [newItem, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new as Item;
            setItems((prev) =>
              prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setItems((prev) => prev.filter((item) => item.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate counts for filter bar
  const counts = useMemo(() => {
    return {
      unread: items.filter((i) => i.status === 'unread').length,
      read: items.filter((i) => i.status === 'read').length,
      archived: items.filter((i) => i.status === 'archived').length,
    };
  }, [items]);

  // Filter items locally
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Status filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // Source type filter
      if (selectedSourceType !== 'all' && item.source_type !== selectedSourceType) return false;

      // Favorites filter
      if (showFavoritesOnly && !item.is_favorite) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesTags) return false;
      }

      return true;
    });
  }, [items, selectedStatus, selectedCategory, selectedSourceType, showFavoritesOnly, searchQuery]);

  // Handlers
  const handleToggleRead = useCallback(async (id: string, status: Status) => {
    const response = await fetch(`/api/ai-inbox/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) throw new Error('Failed to update item');

    // Update local state
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  }, []);

  const handleToggleFavorite = useCallback(async (id: string, is_favorite: boolean) => {
    const response = await fetch(`/api/ai-inbox/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favorite }),
    });

    if (!response.ok) throw new Error('Failed to update item');

    // Update local state
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_favorite } : item))
    );
  }, []);

  const handleArchive = useCallback(async (id: string) => {
    const response = await fetch(`/api/ai-inbox/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    });

    if (!response.ok) throw new Error('Failed to archive item');

    // Update local state
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'archived' as Status } : item
      )
    );
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const response = await fetch(`/api/ai-inbox/items/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete item');

    // Remove from local state
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleAnalyze = useCallback(async (id: string) => {
    const response = await fetch(`/api/ai-inbox/analyze/${id}`, {
      method: 'POST',
    });

    if (!response.ok) throw new Error('Failed to analyze item');

    const data = await response.json();

    // Update local state with analysis results
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ai_analysis: data.analysis } : item
      )
    );
  }, []);

  const handleItemCreated = useCallback((_item: Item) => {
    // We rely on Supabase Realtime for the insertion to avoid duplicates
    // and ensure the item appears in the list correctly.
    // The dialog will still close and show a success toast.
  }, []);

  const handleRefresh = useCallback(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = useCallback(() => {
    setAddDialogOpen(true);
  }, []);

<<<<<<< HEAD
  const handleOpenSettings = useCallback(() => {
    setSettingsDialogOpen(true);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 h-full flex flex-col">
      {/* Header */}
      <InboxHeader
        loading={loading}
        onRefresh={handleRefresh}
        onAddItem={handleAddItem}
        onOpenSettings={handleOpenSettings}
      />
=======
  return (
    <div className="space-y-4 sm:space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-aurora-cyan/20 to-aurora-teal/20 text-aurora-cyan border border-aurora-cyan/20 flex-shrink-0">
            <Inbox className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AI Inbox</h1>
            <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">
              Votre flux de contenus tech avec analyse IA personnalisée
            </p>
          </div>
        </div>
        <div className="flex gap-2 sm:flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsDialogOpen(true)}
            className="border-aurora-cyan/30 hover:border-aurora-cyan/50 hover:bg-aurora-cyan/10 transition-all"
          >
            <Settings className="sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-aurora-cyan/30 hover:border-aurora-cyan/50 hover:bg-aurora-cyan/10 transition-all"
          >
            <RefreshCw className={`sm:mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
          <Button size="sm" onClick={handleAddItem}>
            <Plus className="sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Ajouter</span>
          </Button>
        </div>
      </div>
>>>>>>> remotes/origin/palette-message-bubble-ux-9879608455324157822

      {/* Filter Bar */}
      <FilterBar
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedSourceType={selectedSourceType}
        onSourceTypeChange={setSelectedSourceType}
        showFavoritesOnly={showFavoritesOnly}
        onShowFavoritesChange={setShowFavoritesOnly}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        counts={counts}
      />

      {/* Content */}
      <div className="flex-1 min-h-0">
        <InboxList
          items={filteredItems}
          loading={loading}
          error={error}
          hasNoItems={items.length === 0}
          onToggleRead={handleToggleRead}
          onToggleFavorite={handleToggleFavorite}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onAnalyze={handleAnalyze}
          onAddItem={handleAddItem}
        />
      </div>

      {/* Dialogs */}
      <AddItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onItemCreated={handleItemCreated}
      />
      <SettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
      />
    </div>
  );
}
