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
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { KB_CATEGORIES, type KBEntry, type KBCategory } from '@/lib/knowledge-base/types';

interface EditEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: KBEntry;
  onEntryUpdated: (entry: KBEntry) => void;
}

export function EditEntryDialog({ open, onOpenChange, entry, onEntryUpdated }: EditEntryDialogProps) {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [sourceUrl, setSourceUrl] = useState(entry.source_url ?? '');
  const [codeLanguage, setCodeLanguage] = useState(entry.code_language ?? '');
  const [category, setCategory] = useState<KBCategory>(entry.category);
  const [tagsInput, setTagsInput] = useState(entry.tags.join(', '));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const body: Record<string, unknown> = {
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
      };

      if (entry.type === 'bookmark') body.source_url = sourceUrl || null;
      if (entry.type === 'snippet') body.code_language = codeLanguage || null;

      const response = await fetch(`/api/knowledge-base/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to update');

      const updated = await response.json();
      onEntryUpdated(updated);
      onOpenChange(false);
      toast.success('Entrée mise à jour !');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;entrée</DialogTitle>
          <DialogDescription>Modifiez les détails de votre entrée.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="edit-title">Titre *</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          {/* Bookmark: Source URL */}
          {entry.type === 'bookmark' && (
            <div className="grid gap-2">
              <Label htmlFor="edit-source_url">URL source</Label>
              <Input
                id="edit-source_url"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}

          {/* Snippet: Code language */}
          {entry.type === 'snippet' && (
            <div className="grid gap-2">
              <Label htmlFor="edit-code_language">Langage</Label>
              <Input
                id="edit-code_language"
                value={codeLanguage}
                onChange={(e) => setCodeLanguage(e.target.value)}
              />
            </div>
          )}

          {/* Content */}
          <div className="grid gap-2">
            <Label htmlFor="edit-content">{entry.type === 'snippet' ? 'Code' : 'Contenu'}</Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={entry.type === 'snippet' ? 10 : 6}
              className={entry.type === 'snippet' ? 'font-mono text-sm' : ''}
            />
          </div>

          {/* Category */}
          <div className="grid gap-2">
            <Label htmlFor="edit-category">Catégorie</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as KBCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KB_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="grid gap-2">
            <Label htmlFor="edit-tags">Tags</Label>
            <Input
              id="edit-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Séparés par des virgules"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegarder
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
