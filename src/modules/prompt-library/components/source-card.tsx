'use client';

import { useState, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Github,
  Globe,
  Rss,
  MoreVertical,
  Pencil,
  Trash2,
  Sparkles,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import type { DiscoverySource, DiscoverySourceCategory } from '@/lib/prompt-library/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SourceCardProps {
  source: DiscoverySource;
  onEdit: (source: DiscoverySource) => void;
  onDelete: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onTriggerDiscover: (id: string) => void;
  isDiscovering?: boolean;
}

const CATEGORY_STYLES: Record<DiscoverySourceCategory, { bg: string; text: string; border: string }> = {
  general: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' },
  coding: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  writing: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  creative: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  analysis: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  system_prompts: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  other: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
};

const SOURCE_TYPE_ICONS = {
  github_raw: Github,
  github_api: Github,
  web: Globe,
  rss: Rss,
};

// Optimization: Use memo to prevent re-renders when other sources in the list are updated.
export const SourceCard = memo(function SourceCard({
  source,
  onEdit,
  onDelete,
  onToggleEnabled,
  onTriggerDiscover,
  isDiscovering = false,
}: SourceCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryStyle = CATEGORY_STYLES[source.category] || CATEGORY_STYLES.other;
  const SourceIcon = SOURCE_TYPE_ICONS[source.source_type] || Globe;

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(source.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const lastFetched = source.last_fetched_at
    ? formatDistanceToNow(new Date(source.last_fetched_at), { addSuffix: true, locale: fr })
    : null;

  return (
    <>
      <Card
        className={`transition-all duration-200 ${
          source.is_enabled
            ? 'border-primary/20 hover:border-primary/40'
            : 'border-muted opacity-60'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border} border`}
              >
                <SourceIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold truncate">{source.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border} text-xs`}>
                    {source.category.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">P{source.priority}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Switch
                      checked={source.is_enabled}
                      onCheckedChange={(checked: boolean) => onToggleEnabled(source.id, checked)}
                      className="data-[state=checked]:bg-primary"
                      aria-label={source.is_enabled ? "Désactiver la source" : "Activer la source"}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{source.is_enabled ? "Désactiver la source" : "Activer la source"}</p>
                </TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Plus d'options">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Plus d&apos;options</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(source)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onTriggerDiscover(source.id)}
                    disabled={!source.is_enabled || isDiscovering}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Découvrir maintenant
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ouvrir l&apos;URL
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
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

        <CardContent className="pt-0">
          {source.description && (
            <CardDescription className="text-sm mb-3 line-clamp-2">
              {source.description}
            </CardDescription>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {source.last_error ? (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  Erreur
                </span>
              ) : source.last_fetched_at ? (
                <span className="flex items-center gap-1 text-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  OK
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Jamais exécuté
                </span>
              )}
              {source.prompts_extracted > 0 && (
                <span>{source.prompts_extracted} prompts</span>
              )}
            </div>
            {lastFetched && <span>{lastFetched}</span>}
          </div>

          {source.last_error && (
            <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/20">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-destructive truncate cursor-help">
                    {source.last_error}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs break-words">{source.last_error}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette source ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La source &quot;{source.name}&quot; sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
