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
import { Loader2 } from 'lucide-react';
import type {
  DiscoverySource,
  DiscoverySourceType,
  DiscoverySourceCategory,
  DISCOVERY_SOURCE_CATEGORIES,
} from '@/lib/prompt-library/types';

interface AddEditSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: DiscoverySource | null;
  onSave: (source: DiscoverySource) => void;
}

const SOURCE_TYPES: { value: DiscoverySourceType; label: string }[] = [
  { value: 'github_raw', label: 'GitHub Raw' },
  { value: 'github_api', label: 'GitHub API' },
  { value: 'web', label: 'Web Page' },
  { value: 'rss', label: 'RSS Feed' },
];

const CATEGORIES: { value: DiscoverySourceCategory; label: string }[] = [
  { value: 'general', label: 'Général' },
  { value: 'coding', label: 'Coding' },
  { value: 'writing', label: 'Écriture' },
  { value: 'creative', label: 'Créatif' },
  { value: 'analysis', label: 'Analyse' },
  { value: 'system_prompts', label: 'System Prompts' },
  { value: 'other', label: 'Autre' },
];

export function AddEditSourceDialog({
  open,
  onOpenChange,
  source,
  onSave,
}: AddEditSourceDialogProps) {
  const isEditing = !!source;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [sourceType, setSourceType] = useState<DiscoverySourceType>('github_raw');
  const [category, setCategory] = useState<DiscoverySourceCategory>('general');
  const [priority, setPriority] = useState(50);

  // Reset form when dialog opens/closes or source changes
  useEffect(() => {
    if (open) {
      if (source) {
        setName(source.name);
        setDescription(source.description || '');
        setUrl(source.url);
        setSourceType(source.source_type);
        setCategory(source.category);
        setPriority(source.priority);
      } else {
        setName('');
        setDescription('');
        setUrl('');
        setSourceType('github_raw');
        setCategory('general');
        setPriority(50);
      }
      setError(null);
    }
  }, [open, source]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError('Le nom est requis');
      return false;
    }
    if (!url.trim()) {
      setError("L'URL est requise");
      return false;
    }
    try {
      new URL(url);
    } catch {
      setError("L'URL n'est pas valide");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = isEditing
        ? `/api/prompt-library/sources/${source.id}`
        : '/api/prompt-library/sources';

      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          url: url.trim(),
          source_type: sourceType,
          category,
          priority,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      const data = await response.json();
      onSave(data.source);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la source' : 'Ajouter une source'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez les informations de cette source de découverte.'
              : 'Ajoutez une nouvelle source pour découvrir des prompts.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Awesome ChatGPT Prompts"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://raw.githubusercontent.com/..."
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle..."
              rows={2}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source_type">Type de source</Label>
              <Select
                value={sourceType}
                onValueChange={(value) => setSourceType(value as DiscoverySourceType)}
                disabled={loading}
              >
                <SelectTrigger id="source_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as DiscoverySourceCategory)}
                disabled={loading}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">
              Priorité ({priority})
            </Label>
            <Input
              id="priority"
              type="range"
              min={0}
              max={100}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              disabled={loading}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Les sources avec une priorité plus élevée sont traitées en premier.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
