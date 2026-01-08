'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Inbox, RefreshCw, Plus, Settings } from 'lucide-react';

interface InboxHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onAddItem: () => void;
  onOpenSettings: () => void;
}

export const InboxHeader = memo(function InboxHeader({
  loading,
  onRefresh,
  onAddItem,
  onOpenSettings,
}: InboxHeaderProps) {
  return (
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
          onClick={onOpenSettings}
          className="border-aurora-cyan/30 hover:border-aurora-cyan/50 hover:bg-aurora-cyan/10 transition-all"
        >
          <Settings className="sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Profil</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="border-aurora-cyan/30 hover:border-aurora-cyan/50 hover:bg-aurora-cyan/10 transition-all"
        >
          <RefreshCw className={`sm:mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualiser</span>
        </Button>
        <Button size="sm" onClick={onAddItem}>
          <Plus className="sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </div>
    </div>
  );
});
