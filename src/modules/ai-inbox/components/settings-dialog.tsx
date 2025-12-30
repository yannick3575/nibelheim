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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Settings, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Settings as AISettings, SkillLevel, UserProfile } from '@/types/ai-inbox';
import { SKILL_LEVEL_LABELS } from '@/types/ai-inbox';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStack, setCurrentStack] = useState('');
  const [currentProjects, setCurrentProjects] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('intermediate');
  const [interests, setInterests] = useState('');

  // Fetch current settings when dialog opens
  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-inbox/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const settings: AISettings = await response.json();

      // Populate form with existing values
      setCurrentStack(settings.profile.current_stack.join(', '));
      setCurrentProjects(settings.profile.current_projects.join(', '));
      setSkillLevel(settings.profile.skill_level);
      setInterests(settings.profile.interests.join(', '));
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const profile: UserProfile = {
        current_stack: parseCommaSeparated(currentStack),
        current_projects: parseCommaSeparated(currentProjects),
        skill_level: skillLevel,
        interests: parseCommaSeparated(interests),
      };

      const response = await fetch('/api/ai-inbox/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to update settings');
      }

      toast.success('Paramètres sauvegardés');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la sauvegarde'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres du profil
          </DialogTitle>
          <DialogDescription>
            Configurez votre profil pour personnaliser les analyses IA selon
            votre contexte.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Current Stack */}
            <div className="grid gap-2">
              <Label htmlFor="current_stack">Stack technique actuelle</Label>
              <Input
                id="current_stack"
                placeholder="Ex: Next.js, TypeScript, Supabase, Python"
                value={currentStack}
                onChange={(e) => setCurrentStack(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Technologies que vous utilisez actuellement (séparées par des
                virgules)
              </p>
            </div>

            {/* Current Projects */}
            <div className="grid gap-2">
              <Label htmlFor="current_projects">Projets en cours</Label>
              <Input
                id="current_projects"
                placeholder="Ex: SaaS B2B, App mobile, API REST"
                value={currentProjects}
                onChange={(e) => setCurrentProjects(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Types de projets sur lesquels vous travaillez
              </p>
            </div>

            {/* Skill Level */}
            <div className="grid gap-2">
              <Label htmlFor="skill_level">Niveau d&apos;expérience</Label>
              <Select
                value={skillLevel}
                onValueChange={(v) => setSkillLevel(v as SkillLevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {SKILL_LEVEL_LABELS[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Interests */}
            <div className="grid gap-2">
              <Label htmlFor="interests">Centres d&apos;intérêt</Label>
              <Input
                id="interests"
                placeholder="Ex: IA générative, DevOps, Architecture système"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Sujets qui vous intéressent pour orienter les recommandations
              </p>
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
        )}
      </DialogContent>
    </Dialog>
  );
}

function parseCommaSeparated(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
