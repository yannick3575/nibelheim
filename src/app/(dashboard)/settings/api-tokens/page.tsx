'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Key, Plus, Trash2, Copy, Check, Calendar, Clock } from 'lucide-react';
import { CreateTokenDialog } from './components/create-token-dialog';
import { RevokeTokenDialog } from './components/revoke-token-dialog';
import { toast } from 'sonner';

interface ApiToken {
    id: string;
    name: string;
    scopes: string[];
    last_used_at: string | null;
    expires_at: string | null;
    created_at: string;
}

export default function ApiTokensPage() {
    const [tokens, setTokens] = useState<ApiToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [revokeToken, setRevokeToken] = useState<ApiToken | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Load tokens on mount
    useEffect(() => {
        fetchTokens();
    }, []);

    async function fetchTokens() {
        try {
            const response = await fetch('/api/tokens');
            if (response.ok) {
                const data = await response.json();
                setTokens(data.tokens);
            }
        } catch (error) {
            console.error('Failed to fetch tokens:', error);
            toast.error('Échec du chargement des tokens');
        } finally {
            setLoading(false);
        }
    }

    function formatDate(dateString: string | null) {
        if (!dateString) return 'Jamais';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function isExpired(expiresAt: string | null) {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    }

    function copyTokenId(id: string) {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        toast.success('ID du token copié');
        setTimeout(() => setCopiedId(null), 2000);
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Key className="h-8 w-8" />
                        Tokens API
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Gérez vos tokens d&apos;authentification pour l&apos;automation (Claude Chrome, scripts, etc.)
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} size="lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un token
                </Button>
            </div>

            <Separator className="mb-6" />

            {/* Tokens List */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Chargement...
                </div>
            ) : tokens.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Aucun token API</h3>
                        <p className="text-muted-foreground mb-4">
                            Créez votre premier token pour automatiser Tech Watch avec Claude Chrome
                        </p>
                        <Button onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Créer un token
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {tokens.map((token) => {
                        const expired = isExpired(token.expires_at);
                        return (
                            <Card key={token.id} className={expired ? 'opacity-60' : ''}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="flex items-center gap-2">
                                                {token.name}
                                                {expired && (
                                                    <Badge variant="destructive">Expiré</Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="mt-1 flex items-center gap-2">
                                                <button
                                                    onClick={() => copyTokenId(token.id)}
                                                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                                                >
                                                    <span className="font-mono text-xs">
                                                        {token.id.substring(0, 8)}...
                                                    </span>
                                                    {copiedId === token.id ? (
                                                        <Check className="h-3 w-3" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </CardDescription>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setRevokeToken(token)}
                                            disabled={expired}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Scopes */}
                                    <div className="mb-4">
                                        <div className="text-sm font-medium mb-2">Permissions:</div>
                                        <div className="flex flex-wrap gap-2">
                                            {token.scopes.map((scope) => (
                                                <Badge key={scope} variant="secondary">
                                                    {scope}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator className="my-4" />

                                    {/* Metadata */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                                <Calendar className="h-3 w-3" />
                                                Créé
                                            </div>
                                            <div className="font-medium">
                                                {formatDate(token.created_at)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                                <Clock className="h-3 w-3" />
                                                Dernière utilisation
                                            </div>
                                            <div className="font-medium">
                                                {formatDate(token.last_used_at)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                                <Calendar className="h-3 w-3" />
                                                Expire
                                            </div>
                                            <div className={`font-medium ${expired ? 'text-destructive' : ''}`}>
                                                {token.expires_at ? formatDate(token.expires_at) : 'Jamais'}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Dialogs */}
            <CreateTokenDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={fetchTokens}
            />
            {revokeToken && (
                <RevokeTokenDialog
                    token={revokeToken}
                    open={!!revokeToken}
                    onOpenChange={(open) => !open && setRevokeToken(null)}
                    onSuccess={fetchTokens}
                />
            )}
        </div>
    );
}
