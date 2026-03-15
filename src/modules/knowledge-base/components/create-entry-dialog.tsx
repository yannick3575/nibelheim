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
import { Loader2, Plus, FileText, Bookmark, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import { KB_CATEGORIES, type KBEntry, type KBEntryType, type KBCategory } from '@/lib/knowledge-base/types';
import { cn } from '@/lib/utils';

interface CreateEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntryCreated: (entry: KBEntry) => void;
  defaultType?: KBEntryType;
}

const TYPE_OPTIONS = [
  { value: 'note' as const, label: 'Note', icon: FileText, description: 'Note libre en markdown' },
  { value: 'bookmark' as const, label: 'Bookmark', icon: Bookmark, description: 'Lien web avec résumé' },
  { value: 'snippet' as const, label: 'Snippet', icon: Code2, description: 'Bloc de code' },
];

export function CreateEntryDialog({ open, onOpenChange, onEntryCreated, defaultType = 'note' }: CreateEntryDialogProps) {
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<KBEntryType>(defaultType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('');
  const [category, setCategory] = useState<KBCategory>('general');
  const [tagsInput, setTagsInput] = useState('');

  const resetForm = () => {
    setType(defaultType);
    setTitle('');
    setContent('');
    setSourceUrl('');
    setCodeLanguage('');
    setCategory('general');
    setTagsInput('');
  };

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
        type,
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
      };

      if (type === 'bookmark' && sourceUrl) body.source_url = sourceUrl;
      if (type === 'snippet' && codeLanguage) body.code_language = codeLanguage;

      const response = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to create entry');

      const entry = await response.json();
      onEntryCreated(entry);
      resetForm();
      toast.success('Entrée créée !');
    } catch {
      toast.error('Erreur lors de la création');
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
            Nouvelle entrée
          </DialogTitle>
          <DialogDescription>Ajoutez une note, un bookmark ou un snippet à votre base de connaissances.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Type selector */}
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition-colors',
                    type === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50 text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'bookmark' ? 'Titre de la page...' : type === 'snippet' ? 'Nom du snippet...' : 'Titre de la note...'
              }
              required
            />
          </div>

          {/* Bookmark: Source URL */}
          {type === 'bookmark' && (
            <div className="grid gap-2">
              <Label htmlFor="source_url">URL source</Label>
              <Input
                id="source_url"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}

          {/* Snippet: Code language */}
          {type === 'snippet' && (
            <div className="grid gap-2">
              <Label htmlFor="code_language">Langage</Label>
              <Input
                id="code_language"
                value={codeLanguage}
                onChange={(e) => setCodeLanguage(e.target.value)}
                placeholder="typescript, python, sql..."
              />
            </div>
          )}

          {/* Content */}
          <div className="grid gap-2">
            <Label htmlFor="content">
              {type === 'snippet' ? 'Code' : 'Contenu'}
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={type === 'snippet' ? 10 : 6}
              className={type === 'snippet' ? 'font-mono text-sm' : ''}
              placeholder={
                type === 'snippet'
                  ? '// Votre code ici...'
                  : type === 'bookmark'
                    ? 'Notes et résumé...'
                    : 'Votre note en markdown...'
              }
            />
            {type !== 'snippet' && (
              <p className="text-xs text-muted-foreground">Supporte le markdown</p>
            )}
          </div>

          {/* Category */}
          <div className="grid gap-2">
            <Label htmlFor="category">Catégorie</Label>
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
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="react, typescript, tips (séparés par des virgules)"
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
                  Création...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
