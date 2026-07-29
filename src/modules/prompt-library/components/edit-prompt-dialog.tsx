'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Pencil } from 'lucide-react';
import { PROMPT_CATEGORIES, type Prompt, type PromptCategory } from '@/lib/prompt-library/types';
import { toast } from 'sonner';

interface EditPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: Prompt;
  onPromptUpdated: (prompt: Prompt) => void;
}

export function EditPromptDialog({
  open,
  onOpenChange,
  prompt,
  onPromptUpdated,
}: EditPromptDialogProps) {
  const [title, setTitle] = useState(prompt.title);
  const [content, setContent] = useState(prompt.content);
  const [category, setCategory] = useState<PromptCategory>(prompt.category);
  const [tagsInput, setTagsInput] = useState(prompt.tags.join(', '));
  const [saving, setSaving] = useState(false);

  // Reset form when prompt changes
  useEffect(() => {
    setTitle(prompt.title);
    setContent(prompt.content);
    setCategory(prompt.category);
    setTagsInput(prompt.tags.join(', '));
  }, [prompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('Le titre et le contenu sont requis');
      return;
    }

    setSaving(true);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const response = await fetch(`/api/prompt-library/${prompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          tags,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to update prompt');
      }

      const updated = await response.json();
      onPromptUpdated(updated);
      toast.success('Prompt mis à jour');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating prompt:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Modifier le prompt
          </DialogTitle>
          <DialogDescription>
            Modifiez les détails de votre prompt.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="edit-title">Titre *</Label>
            <Input
              id="edit-title"
              placeholder="Ex: Générer un résumé d'article"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              autoFocus
            />
          </div>

          {/* Content */}
          <div className="grid gap-2">
            <Label htmlFor="edit-content">Contenu *</Label>
            <Textarea
              id="edit-content"
              placeholder={`Ex: Résume cet article en {{nombre}} points clés:\n\n{{article}}`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              Astuce : Utilisez {`{{nom}}`} pour créer des variables remplaçables.
            </p>
          </div>

          {/* Category */}
          <div className="grid gap-2">
            <Label htmlFor="edit-category">Catégorie</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as PromptCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {PROMPT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="grid gap-2">
            <Label htmlFor="edit-tags">Tags (séparés par des virgules)</Label>
            <Input
              id="edit-tags"
              placeholder="Ex: résumé, article, productivité"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
