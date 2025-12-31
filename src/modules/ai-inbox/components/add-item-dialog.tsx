'use client';

import { useState } from 'react';
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
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Item, SourceType, Category } from '@/types/ai-inbox';
import { SOURCE_TYPE_LABELS, CATEGORY_LABELS } from '@/types/ai-inbox';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemCreated: (item: Item) => void;
}

const SOURCE_TYPES: SourceType[] = [
  'youtube',
  'substack',
  'manual',
  'other',
];

const CATEGORIES: Category[] = [
  'tools',
  'prompts',
  'tutorials',
  'news',
  'inspiration',
];

export function AddItemDialog({
  open,
  onOpenChange,
  onItemCreated,
}: AddItemDialogProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('manual');
  const [category, setCategory] = useState<Category>('news');
  const [rawContent, setRawContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setSourceType('manual');
    setCategory('news');
    setRawContent('');
    setTagsInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    if (url && !isValidUrl(url)) {
      toast.error('URL invalide');
      return;
    }

    setSaving(true);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const response = await fetch('/api/ai-inbox/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim() || undefined,
          source_type: sourceType,
          category,
          raw_content: rawContent.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Échec de la création');
      }

      const item = await response.json();
      onItemCreated(item);
      toast.success('Item ajouté avec succès');

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'ajout"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ajouter un contenu
          </DialogTitle>
          <DialogDescription>
            Ajoutez un lien YouTube, article, newsletter ou autre contenu à
            analyser.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              placeholder="Ex: Introduction à RAG avec LangChain"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={500}
              autoFocus
            />
          </div>

          {/* URL */}
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          {/* Source Type & Category */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="source_type">Type de source</Label>
              <Select
                value={sourceType}
                onValueChange={(v) => setSourceType(v as SourceType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {SOURCE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as Category)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Raw Content */}
          <div className="grid gap-2">
            <Label htmlFor="raw_content">Notes / Contenu (optionnel)</Label>
            <Textarea
              id="raw_content"
              placeholder="Ajoutez des notes ou le contenu brut si pas d'URL..."
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              rows={4}
            />
          </div>

          {/* Tags */}
          <div className="grid gap-2">
            <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
            <Input
              id="tags"
              placeholder="Ex: rag, langchain, tutoriel"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
