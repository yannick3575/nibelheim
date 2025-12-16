'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Rss, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Source } from '@/lib/tech-watch';

export function TechWatchSettings() {
    const [sources, setSources] = useState<Source[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSource, setNewSource] = useState({ name: '', url: '', type: 'rss' as const });
    const [saving, setSaving] = useState(false);

    // Fetch sources
    useEffect(() => {
        async function fetchSources() {
            try {
                const response = await fetch('/api/tech-watch/sources');
                if (response.ok) {
                    const data = await response.json();
                    setSources(data);
                }
            } catch (error) {
                console.error('Error fetching sources:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchSources();
    }, []);

    // Toggle source enabled
    const handleToggle = async (id: string, enabled: boolean) => {
        try {
            const response = await fetch(`/api/tech-watch/sources/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled })
            });

            if (response.ok) {
                setSources(prev => prev.map(s =>
                    s.id === id ? { ...s, enabled } : s
                ));
            }
        } catch (error) {
            console.error('Error toggling source:', error);
        }
    };

    // Delete source
    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cette source ?')) return;

        try {
            const response = await fetch(`/api/tech-watch/sources/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setSources(prev => prev.filter(s => s.id !== id));
            }
        } catch (error) {
            console.error('Error deleting source:', error);
        }
    };

    // Add new source
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSource.name || !newSource.url) return;

        setSaving(true);
        try {
            const response = await fetch('/api/tech-watch/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSource)
            });

            if (response.ok) {
                const data = await response.json();
                setSources(prev => [data, ...prev]);
                setNewSource({ name: '', url: '', type: 'rss' });
                setShowAddForm(false);
            }
        } catch (error) {
            console.error('Error adding source:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Sources de veille</CardTitle>
                            <CardDescription>
                                Gérez les flux RSS et sources analysées par le bot
                            </CardDescription>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => setShowAddForm(!showAddForm)}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Add form */}
                    {showAddForm && (
                        <form onSubmit={handleAdd} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Nom</label>
                                    <Input
                                        placeholder="Hacker News"
                                        value={newSource.name}
                                        onChange={(e) => setNewSource(s => ({ ...s, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">URL du flux RSS</label>
                                    <Input
                                        placeholder="https://hnrss.org/newest?points=100"
                                        value={newSource.url}
                                        onChange={(e) => setNewSource(s => ({ ...s, url: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" size="sm" disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Ajouter
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAddForm(false)}
                                >
                                    Annuler
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Sources list */}
                    {sources.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Rss className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Aucune source configurée</p>
                            <p className="text-xs mt-1">
                                Le bot utilise Hacker News par défaut
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sources.map((source) => (
                                <div
                                    key={source.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleToggle(source.id, !source.enabled)}
                                            className={`w-10 h-6 rounded-full transition-colors relative ${source.enabled ? 'bg-primary' : 'bg-muted'
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${source.enabled ? 'left-5' : 'left-1'
                                                    }`}
                                            />
                                        </button>
                                        <div>
                                            <div className="font-medium text-sm">{source.name}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <span className="capitalize">{source.type}</span>
                                                {source.url && (
                                                    <>
                                                        <span>•</span>
                                                        <a
                                                            href={source.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="hover:underline flex items-center gap-0.5"
                                                        >
                                                            {new URL(source.url).hostname}
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(source.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info card */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Comment ça marche ?</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-2">
                    <p>
                        Le bot Tech Watch s&apos;exécute automatiquement toutes les 6 heures via GitHub Actions.
                    </p>
                    <p>
                        Il récupère les articles des sources configurées, extrait leur contenu,
                        et génère une analyse via Gemini.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
