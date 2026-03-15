'use client';

import { useState, useOptimistic, useTransition, memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Star,
  Copy,
  Pencil,
  Trash2,
  Check,
  MoreVertical,
  FileText,
  Bookmark,
  Code2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { KB_CATEGORY_COLORS, KB_TYPE_COLORS, type KBEntry } from '@/lib/knowledge-base/types';
import { toast } from 'sonner';

const TYPE_ICONS = {
  note: FileText,
  bookmark: Bookmark,
  snippet: Code2,
} as const;

interface EntryCardProps {
  entry: KBEntry;
  onDelete: (id: string) => void;
  onUpdate: (entry: KBEntry) => void;
  onEdit: (entry: KBEntry) => void;
}

export const EntryCard = memo(function EntryCard({ entry, onDelete, onUpdate, onEdit }: EntryCardProps) {
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(
    entry.is_favorite,
    (_current, newValue: boolean) => newValue
  );
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const TypeIcon = useMemo(() => TYPE_ICONS[entry.type], [entry.type]);

  const handleToggleFavorite = () => {
    const newFavorite = !optimisticFavorite;
    startTransition(async () => {
      setOptimisticFavorite(newFavorite);
      try {
        const response = await fetch(`/api/knowledge-base/${entry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_favorite: newFavorite }),
        });
        if (!response.ok) throw new Error('Failed to toggle favorite');
        const updated = await response.json();
        onUpdate(updated);
      } catch {
        toast.error('Erreur lors de la mise à jour');
      }
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(entry.content);
    setCopied(true);
    toast.success('Copié dans le presse-papier');
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/knowledge-base/${entry.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      onDelete(entry.id);
      toast.success('Entrée supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="group hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold leading-tight line-clamp-2 flex items-center gap-2">
                <TypeIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                {entry.type === 'bookmark' && entry.source_url ? (
                  <a
                    href={entry.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {entry.title}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                ) : (
                  entry.title
                )}
              </CardTitle>
              <CardDescription className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className={cn('capitalize text-xs', KB_TYPE_COLORS[entry.type])}>
                  {entry.type}
                </Badge>
                <Badge variant="outline" className={cn('capitalize text-xs', KB_CATEGORY_COLORS[entry.category])}>
                  {entry.category}
                </Badge>
                {entry.code_language && (
                  <Badge variant="secondary" className="text-xs font-mono">
                    {entry.code_language}
                  </Badge>
                )}
                {entry.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {entry.tags.length > 2 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground cursor-help" tabIndex={0}>
                        +{entry.tags.length - 2}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[200px] break-words">{entry.tags.slice(2).join(', ')}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardDescription>
            </div>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-8 w-8', optimisticFavorite && 'text-yellow-500', isPending && 'opacity-70')}
                    onClick={handleToggleFavorite}
                    disabled={isPending}
                  >
                    <Star className={cn('h-4 w-4', optimisticFavorite && 'fill-yellow-500')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{optimisticFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}</p>
                </TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(entry)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {entry.type === 'snippet' ? (
            <pre className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3 overflow-x-auto line-clamp-4">
              <code>{entry.content}</code>
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{entry.content}</p>
          )}

          <Button variant="outline" size="sm" onClick={handleCopy} className="w-full">
            {copied ? <Check className="mr-2 h-3.5 w-3.5" /> : <Copy className="mr-2 h-3.5 w-3.5" />}
            Copier
          </Button>
        </CardContent>
      </Card>

      {showDeleteDialog && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette entrée ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. &quot;{entry.title}&quot; sera définitivement supprimé.
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
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
});
