'use client';

import { useOptimistic, useTransition, useState, memo } from 'react';
import {
  ExternalLink,
  Check,
  Circle,
  Star,
  Archive,
  Sparkles,
  Trash2,
  Tag,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { Item, Status } from '@/types/ai-inbox';
import { CATEGORY_LABELS, SOURCE_TYPE_LABELS } from '@/types/ai-inbox';

interface InboxItemCardProps {
  item: Item;
  onToggleRead: (id: string, status: Status) => Promise<void>;
  onToggleFavorite: (id: string, is_favorite: boolean) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAnalyze: (id: string) => Promise<void>;
}

export const InboxItemCard = memo(function InboxItemCard({
  item,
  onToggleRead,
  onToggleFavorite,
  onArchive,
  onDelete,
  onAnalyze,
}: InboxItemCardProps) {
  // React 19: useOptimistic for instant UI feedback - reverts to source value on re-render
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    item.status,
    (_current, newValue: Status) => newValue
  );
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(
    item.is_favorite,
    (_current, newValue: boolean) => newValue
  );
  const [isReadPending, startReadTransition] = useTransition();
  const [isFavoritePending, startFavoriteTransition] = useTransition();
  const [isActionPending, startActionTransition] = useTransition();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const isRead = optimisticStatus === 'read' || optimisticStatus === 'archived';

  const handleToggleRead = () => {
    const newStatus: Status = isRead ? 'unread' : 'read';
    setOptimisticStatus(newStatus);

    startReadTransition(async () => {
      try {
        await onToggleRead(item.id, newStatus);
      } catch (error) {
        console.error('Failed to toggle read status:', error);
        toast.error('Erreur lors de la mise à jour');
      }
    });
  };

  const handleToggleFavorite = () => {
    const newFavorite = !optimisticFavorite;
    setOptimisticFavorite(newFavorite);

    startFavoriteTransition(async () => {
      try {
        await onToggleFavorite(item.id, newFavorite);
        toast.success(newFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris');
      } catch (error) {
        console.error('Failed to toggle favorite status:', error);
        toast.error('Erreur lors de la mise à jour');
      }
    });
  };

  const handleArchive = () => {
    setOptimisticStatus('archived');

    startActionTransition(async () => {
      try {
        await onArchive(item.id);
        toast.success('Archivé');
      } catch (error) {
        console.error('Failed to archive:', error);
        toast.error("Erreur lors de l'archivage");
      }
    });
  };

  const handleDelete = () => {
    startActionTransition(async () => {
      try {
        await onDelete(item.id);
        toast.success('Supprimé');
      } catch (error) {
        console.error('Failed to delete:', error);
        toast.error('Erreur lors de la suppression');
      }
    });
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await onAnalyze(item.id);
      toast.success('Analyse terminée');
    } catch (error) {
      console.error('Failed to analyze:', error);
      toast.error("Erreur lors de l'analyse");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card
      className={cn(
        'transition-opacity',
        isRead && 'opacity-60',
        optimisticStatus === 'archived' && 'opacity-40'
      )}
    >
      <CardHeader className="pb-3 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <CardTitle className="text-sm sm:text-base font-semibold leading-tight group-hover:underline flex items-center gap-2">
                  <span className="break-words">{item.title}</span>
                  <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </CardTitle>
              </a>
            ) : (
              <CardTitle className="text-sm sm:text-base font-semibold leading-tight">
                {item.title}
              </CardTitle>
            )}
            <CardDescription className="mt-1.5 flex items-center gap-2 sm:gap-3 flex-wrap text-xs sm:text-sm">
              <Badge variant="outline" className="text-xs">
                {SOURCE_TYPE_LABELS[item.source_type]}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {CATEGORY_LABELS[item.category]}
              </Badge>
              {item.tags && item.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  {item.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <span className="text-muted-foreground">
                {new Date(item.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              {!item.ai_analysis && !isAnalyzing && (
                <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/50">
                  ⏳ Analyse en cours...
                </Badge>
              )}
              {isAnalyzing && (
                <Badge variant="outline" className="text-xs text-aurora-cyan border-aurora-cyan/50">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Analyse IA...
                </Badge>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleFavorite}
                  disabled={isFavoritePending}
                  className={cn(
                    'flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 p-0',
                    optimisticFavorite && 'text-yellow-500',
                    isFavoritePending && 'opacity-70'
                  )}
                  aria-label={
                    optimisticFavorite
                      ? 'Retirer des favoris'
                      : 'Ajouter aux favoris'
                  }
                >
                  <Star
                    className={cn(
                      'h-3.5 w-3.5 sm:h-4 sm:w-4',
                      optimisticFavorite && 'fill-yellow-500'
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {optimisticFavorite
                    ? 'Retirer des favoris'
                    : 'Ajouter aux favoris'}
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleRead}
                  disabled={isReadPending}
                  className={cn(
                    'flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 p-0',
                    isRead && 'text-green-500 hover:text-green-400',
                    isReadPending && 'opacity-70'
                  )}
                  aria-label={
                    isRead ? 'Marquer comme non lu' : 'Marquer comme lu'
                  }
                >
                  {isRead ? (
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRead ? 'Marquer comme non lu' : 'Marquer comme lu'}</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 p-0"
                  disabled={isActionPending}
                >
                  <span className="sr-only">Actions</span>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAnalyze}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyser avec IA
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archiver
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      {item.ai_analysis && (
        <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-aurora-cyan">
                <Sparkles className="h-4 w-4" />
                Analyse IA
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-aurora-cyan"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Re-analyser
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Re-analyser avec IA</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-sm">
              <MarkdownRenderer content={item.ai_analysis.summary} />
            </div>
            {item.ai_analysis.actionability !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Actionnabilité:
                </span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-aurora-cyan rounded-full"
                    style={{
                      width: `${(item.ai_analysis.actionability / 5) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium">
                  {item.ai_analysis.actionability}/5
                </span>
              </div>
            )}
            {item.ai_analysis.project_ideas &&
              item.ai_analysis.project_ideas.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Idées de projets:</span>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {item.ai_analysis.project_ideas.map((idea, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-aurora-cyan">•</span>
                        {idea}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </CardContent>
      )}
    </Card>
  );
});
