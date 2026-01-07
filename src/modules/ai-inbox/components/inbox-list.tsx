'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Inbox, Loader2, Plus, Sparkles } from 'lucide-react';
import { InboxItemCard } from './inbox-item-card';
import type { Item, Status } from '@/types/ai-inbox';

interface InboxListProps {
  items: Item[];
  loading: boolean;
  error: string | null;
  hasNoItems: boolean;
  onToggleRead: (id: string, status: Status) => Promise<void>;
  onToggleFavorite: (id: string, is_favorite: boolean) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAnalyze: (id: string) => Promise<void>;
  onAddItem: () => void;
}

export const InboxList = memo(function InboxList({
  items,
  loading,
  error,
  hasNoItems,
  onToggleRead,
  onToggleFavorite,
  onArchive,
  onDelete,
  onAnalyze,
  onAddItem,
}: InboxListProps) {
  if (loading && items.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border rounded-lg border-dashed">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Erreur</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (items.length > 0) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {items.map((item) => (
          <InboxItemCard
            key={item.id}
            item={item}
            onToggleRead={onToggleRead}
            onToggleFavorite={onToggleFavorite}
            onArchive={onArchive}
            onDelete={onDelete}
            onAnalyze={onAnalyze}
          />
        ))}
      </div>
    );
  }

  if (hasNoItems) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-aurora-cyan" />
            Commencez votre veille
          </CardTitle>
          <CardDescription>
            Votre inbox est vide. Ajoutez des liens YouTube, articles, newsletters
            ou autres contenus pour recevoir des analyses IA personnalisées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onAddItem}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un premier contenu
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          Aucun résultat
        </CardTitle>
        <CardDescription>
          Aucun item ne correspond à vos filtres. Essayez de modifier vos critères.
        </CardDescription>
      </CardHeader>
    </Card>
  );
});
