'use client';

import { useState, useOptimistic, useTransition, memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Star, Copy, Pencil, Trash2, Check, MoreVertical, Braces, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractVariables, CATEGORY_COLORS, type Prompt } from '@/lib/prompt-library/types';
import { toast } from 'sonner';
import { VariableDialog } from './variable-dialog';
import { EditPromptDialog } from './edit-prompt-dialog';

interface PromptListItemProps {
  prompt: Prompt;
  onDelete: (id: string) => void;
  onUpdate: (prompt: Prompt) => void;
}

// Optimization: Use memo to prevent re-renders when other prompts in the list are updated.
// The parent component ensures that the prompt object reference is stable for unchanged items.
export const PromptListItem = memo(function PromptListItem({ prompt, onDelete, onUpdate }: PromptListItemProps) {
  // React 19: useOptimistic for instant UI feedback - reverts to source value on re-render
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(
    prompt.is_favorite,
    (_current, newValue: boolean) => newValue
  );
  const [isPending, startTransition] = useTransition();

  const [showVariableDialog, setShowVariableDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Optimization: Memoize variable extraction
  const variables = useMemo(() => extractVariables(prompt.content), [prompt.content]);
  const hasVariables = variables.length > 0;

  const handleToggleFavorite = () => {
    const newFavorite = !optimisticFavorite;
    setOptimisticFavorite(newFavorite); // Instant UI update

    startTransition(async () => {
      try {
        const response = await fetch(`/api/prompt-library/${prompt.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_favorite: newFavorite }),
        });

        if (!response.ok) throw new Error('Failed to toggle favorite');

        const updated = await response.json();
        onUpdate(updated);
        toast.success(newFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris');
      } catch (error) {
        console.error('Error toggling favorite:', error);
        // Reverts to source value when component re-renders
        toast.error('Erreur lors de la mise à jour');
      }
    });
  };

  const handleCopy = () => {
    if (hasVariables) {
      setShowVariableDialog(true);
    } else {
      navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      toast.success('Copié dans le presse-papier');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/prompt-library/${prompt.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      onDelete(prompt.id);
      toast.success('Prompt supprimé');
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast.error('Erreur lors de la suppression');
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className={cn("flex items-center gap-4 p-4 border rounded-lg hover:border-primary/50 transition-colors", prompt.status === 'draft' && "border-orange-500/30 bg-orange-500/5 hover:border-orange-500/50")}>
        {/* Favorite */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-8 w-8 flex-shrink-0', optimisticFavorite && 'text-yellow-500', isPending && 'opacity-70')}
              onClick={handleToggleFavorite}
              disabled={isPending}
              aria-label={optimisticFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Star className={cn('h-4 w-4', optimisticFavorite && 'fill-yellow-500')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{optimisticFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{prompt.title}</span>
            {hasVariables && <Braces className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
            {prompt.status === 'draft' && (
              <Badge variant="outline" className="text-[10px] h-4 py-0 bg-orange-500/10 text-orange-600 border-orange-500/20">
                Brouillon
              </Badge>
            )}
            {prompt.is_automated && (
              <Badge variant="outline" className="text-[10px] h-4 py-0 bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                Auto
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge
              variant="outline"
              className={cn('capitalize text-xs', CATEGORY_COLORS[prompt.category])}
            >
              {prompt.category}
            </Badge>
            {prompt.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {prompt.tags.length > 2 && (
              <span className="text-xs text-muted-foreground">+{prompt.tags.length - 2}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                aria-label={hasVariables ? 'Remplir & copier' : 'Copier'}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{hasVariables ? 'Remplir & copier' : 'Copier'}</p>
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
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
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

      {showVariableDialog && (
        <VariableDialog
          open={showVariableDialog}
          onOpenChange={setShowVariableDialog}
          prompt={prompt}
        />
      )}

      {showEditDialog && (
        <EditPromptDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          prompt={prompt}
          onPromptUpdated={onUpdate}
        />
      )}

      {showDeleteDialog && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce prompt ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le prompt &quot;{prompt.title}&quot; sera définitivement supprimé.
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
      )}
    </>
  );
});
