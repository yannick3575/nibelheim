'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, Database, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { SourceCard } from './source-card';
import { AddEditSourceDialog } from './add-edit-source-dialog';
import type { DiscoverySource } from '@/lib/prompt-library/types';
import { toast } from 'sonner';

export function SourcesList() {
  const [sources, setSources] = useState<DiscoverySource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discoveringIds, setDiscoveringIds] = useState<Set<string>>(new Set());
  const [discoveringAll, setDiscoveringAll] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<DiscoverySource | null>(null);

  // Fetch sources
  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/prompt-library/sources');
      if (!response.ok) throw new Error('Failed to fetch sources');
      const data = await response.json();
      setSources(data.sources || []);
    } catch (err) {
      console.error('Error fetching sources:', err);
      setError('Impossible de charger les sources.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // Handle source saved (created or updated)
  const handleSourceSaved = useCallback((source: DiscoverySource) => {
    setSources((prev) => {
      const exists = prev.find((s) => s.id === source.id);
      if (exists) {
        return prev.map((s) => (s.id === source.id ? source : s));
      }
      return [source, ...prev];
    });
    setEditingSource(null);
    toast.success(editingSource ? 'Source modifiée' : 'Source ajoutée');
  }, [editingSource]);

  // Handle toggle enabled
  const handleToggleEnabled = useCallback(async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/prompt-library/sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: enabled }),
      });

      if (!response.ok) throw new Error('Failed to update source');

      const data = await response.json();
      setSources((prev) => prev.map((s) => (s.id === id ? data.source : s)));
      toast.success(enabled ? 'Source activée' : 'Source désactivée');
    } catch (err) {
      console.error('Error toggling source:', err);
      toast.error('Erreur lors de la mise à jour');
    }
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/prompt-library/sources/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete source');

      setSources((prev) => prev.filter((s) => s.id !== id));
      toast.success('Source supprimée');
    } catch (err) {
      console.error('Error deleting source:', err);
      toast.error('Erreur lors de la suppression');
    }
  }, []);

  // Handle trigger discover for a single source
  const handleTriggerDiscover = useCallback(async (id: string) => {
    setDiscoveringIds((prev) => new Set(prev).add(id));
    try {
      const response = await fetch('/api/prompt-library/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceIds: [id] }),
      });

      if (!response.ok) throw new Error('Failed to discover');

      const data = await response.json();
      if (data.count > 0) {
        toast.success(`${data.count} prompts découverts !`);
      } else {
        toast.info('Aucun nouveau prompt trouvé');
      }

      // Refresh sources to get updated stats
      await fetchSources();
    } catch (err) {
      console.error('Error discovering:', err);
      toast.error('Erreur lors de la découverte');
    } finally {
      setDiscoveringIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [fetchSources]);

  // Handle discover all
  const handleDiscoverAll = useCallback(async () => {
    setDiscoveringAll(true);
    try {
      const response = await fetch('/api/prompt-library/discover', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to discover');

      const data = await response.json();
      if (data.count > 0) {
        toast.success(`${data.count} prompts découverts depuis ${sources.filter(s => s.is_enabled).length} sources !`);
      } else {
        toast.info('Aucun nouveau prompt trouvé');
      }

      if (data.errors?.length > 0) {
        toast.warning(`${data.errors.length} source(s) en erreur`);
      }

      // Refresh sources to get updated stats
      await fetchSources();
    } catch (err) {
      console.error('Error discovering all:', err);
      toast.error('Erreur lors de la découverte');
    } finally {
      setDiscoveringAll(false);
    }
  }, [fetchSources, sources]);

  // Open edit dialog
  const handleEdit = useCallback((source: DiscoverySource) => {
    setEditingSource(source);
    setDialogOpen(true);
  }, []);

  // Open add dialog
  const handleAdd = useCallback(() => {
    setEditingSource(null);
    setDialogOpen(true);
  }, []);

  const enabledCount = sources.filter((s) => s.is_enabled).length;
  const totalPrompts = sources.reduce((sum, s) => sum + s.prompts_extracted, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Sources de découverte</h2>
          <p className="text-sm text-muted-foreground">
            Gérez les sources utilisées pour découvrir automatiquement des prompts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchSources}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </Button>
          <Button
            variant="outline"
            onClick={handleDiscoverAll}
            disabled={discoveringAll || enabledCount === 0}
            className="border-aurora-violet/30 hover:border-aurora-violet/50"
          >
            {discoveringAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4 text-aurora-violet" />
            )}
            Découvrir tout
          </Button>
          <Button onClick={handleAdd} className="bg-gradient-to-r from-aurora-magenta to-aurora-violet">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Sources actives</CardDescription>
            <CardTitle className="text-2xl text-primary">
              {loading ? '-' : `${enabledCount}/${sources.length}`}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-aurora-violet/20">
          <CardHeader className="pb-2">
            <CardDescription>Prompts extraits</CardDescription>
            <CardTitle className="text-2xl text-aurora-violet">
              {loading ? '-' : totalPrompts}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-500/20">
          <CardHeader className="pb-2">
            <CardDescription>Dernière exécution</CardDescription>
            <CardTitle className="text-lg text-green-500">
              {loading ? '-' : sources.some(s => s.last_fetched_at) ? 'Récent' : 'Jamais'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-3/4 mt-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
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
            <Button onClick={fetchSources} variant="outline">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      ) : sources.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Aucune source configurée. Ajoutez votre première source !
            </p>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une source
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleEnabled={handleToggleEnabled}
              onTriggerDiscover={handleTriggerDiscover}
              isDiscovering={discoveringIds.has(source.id)}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      <AddEditSourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        source={editingSource}
        onSave={handleSourceSaved}
      />
    </div>
  );
}
