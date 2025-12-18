'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface CreateTokenDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const SCOPE_OPTIONS = [
    { value: 'tech-watch:read', label: 'Tech Watch: Lecture', description: 'Lire les articles et sources' },
    { value: 'tech-watch:write', label: 'Tech Watch: Écriture', description: 'Créer/modifier articles et sources' },
];

const EXPIRATION_OPTIONS = [
    { value: '30', label: '30 jours' },
    { value: '90', label: '90 jours (recommandé)' },
    { value: '180', label: '180 jours' },
    { value: '365', label: '1 an' },
    { value: 'never', label: 'Jamais (non recommandé)' },
];

export function CreateTokenDialog({ open, onOpenChange, onSuccess }: CreateTokenDialogProps) {
    const [step, setStep] = useState<'form' | 'result'>('form');
    const [name, setName] = useState('');
    const [scopes, setScopes] = useState<string[]>(['tech-watch:read', 'tech-watch:write']);
    const [expiration, setExpiration] = useState('90');
    const [loading, setLoading] = useState(false);
    const [createdToken, setCreatedToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    function resetForm() {
        setStep('form');
        setName('');
        setScopes(['tech-watch:read', 'tech-watch:write']);
        setExpiration('90');
        setCreatedToken(null);
        setCopied(false);
    }

    function handleClose() {
        resetForm();
        onOpenChange(false);
    }

    function toggleScope(scope: string) {
        setScopes((prev) =>
            prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Le nom du token est requis');
            return;
        }

        if (scopes.length === 0) {
            toast.error('Sélectionnez au moins une permission');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    scopes,
                    expiresInDays: expiration === 'never' ? undefined : parseInt(expiration),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create token');
            }

            const data = await response.json();
            setCreatedToken(data.token);
            setStep('result');
            onSuccess();
            toast.success('Token créé avec succès');
        } catch (error) {
            console.error('Failed to create token:', error);
            toast.error('Échec de la création du token');
        } finally {
            setLoading(false);
        }
    }

    function copyToken() {
        if (createdToken) {
            navigator.clipboard.writeText(createdToken);
            setCopied(true);
            toast.success('Token copié dans le presse-papiers');
            setTimeout(() => setCopied(false), 2000);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                {step === 'form' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Créer un nouveau token API</DialogTitle>
                            <DialogDescription>
                                Créez un token pour automatiser Tech Watch avec Claude Chrome ou vos propres scripts.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom du token *</Label>
                                <Input
                                    id="name"
                                    placeholder="Ex: Claude Chrome - Production"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Un nom descriptif pour identifier ce token
                                </p>
                            </div>

                            {/* Scopes */}
                            <div className="space-y-2">
                                <Label>Permissions *</Label>
                                <div className="space-y-2">
                                    {SCOPE_OPTIONS.map((option) => (
                                        <div
                                            key={option.value}
                                            className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                                scopes.includes(option.value)
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:bg-muted/50'
                                            }`}
                                            onClick={() => toggleScope(option.value)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={scopes.includes(option.value)}
                                                onChange={() => toggleScope(option.value)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">{option.label}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {option.description}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Sélectionnez les permissions minimales nécessaires
                                </p>
                            </div>

                            {/* Expiration */}
                            <div className="space-y-2">
                                <Label htmlFor="expiration">Expiration</Label>
                                <Select value={expiration} onValueChange={setExpiration}>
                                    <SelectTrigger id="expiration">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EXPIRATION_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Renouvelez régulièrement vos tokens pour plus de sécurité
                                </p>
                            </div>

                            <Separator />

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={handleClose}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Création...' : 'Créer le token'}
                                </Button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Token créé avec succès!</DialogTitle>
                            <DialogDescription>
                                Copiez ce token immédiatement. Il ne sera plus affiché.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 mt-4">
                            {/* Warning */}
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <div className="font-semibold text-destructive">
                                            Important: Sauvegardez ce token maintenant
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Pour des raisons de sécurité, ce token ne sera plus jamais affiché.
                                            Copiez-le et stockez-le dans un endroit sûr.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Token Display */}
                            <div className="space-y-2">
                                <Label>Votre token API</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={createdToken || ''}
                                        readOnly
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={copyToken}
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Token Info */}
                            <div className="space-y-3 rounded-lg border p-4 bg-muted/50">
                                <div>
                                    <div className="text-sm font-medium mb-1">Nom</div>
                                    <div className="text-sm text-muted-foreground">{name}</div>
                                </div>
                                <Separator />
                                <div>
                                    <div className="text-sm font-medium mb-2">Permissions</div>
                                    <div className="flex flex-wrap gap-2">
                                        {scopes.map((scope) => (
                                            <Badge key={scope} variant="secondary">
                                                {scope}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <div className="text-sm font-medium mb-1">Expiration</div>
                                    <div className="text-sm text-muted-foreground">
                                        {expiration === 'never'
                                            ? 'Jamais'
                                            : `${expiration} jours`}
                                    </div>
                                </div>
                            </div>

                            {/* Close Button */}
                            <div className="flex justify-end">
                                <Button onClick={handleClose}>J&apos;ai copié le token</Button>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
