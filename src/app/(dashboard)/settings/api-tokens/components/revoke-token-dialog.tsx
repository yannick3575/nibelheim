'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ApiToken {
    id: string;
    name: string;
    scopes: string[];
    last_used_at: string | null;
    expires_at: string | null;
    created_at: string;
}

interface RevokeTokenDialogProps {
    token: ApiToken;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function RevokeTokenDialog({ token, open, onOpenChange, onSuccess }: RevokeTokenDialogProps) {
    const [loading, setLoading] = useState(false);

    async function handleRevoke() {
        setLoading(true);

        try {
            const response = await fetch(`/api/tokens/${token.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to revoke token');
            }

            toast.success('Token révoqué avec succès');
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to revoke token:', error);
            toast.error('Échec de la révocation du token');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Révoquer le token
                    </DialogTitle>
                    <DialogDescription>
                        Cette action est irréversible. Le token ne pourra plus être utilisé.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="bg-muted rounded-lg p-4">
                        <div className="text-sm font-medium mb-1">Token à révoquer:</div>
                        <div className="text-lg font-semibold">{token.name}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-1">
                            ID: {token.id.substring(0, 8)}...
                        </div>
                    </div>

                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <div className="flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <div className="font-semibold text-destructive">
                                    Attention
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Tous les services utilisant ce token (Claude Chrome, scripts, etc.)
                                    cesseront immédiatement de fonctionner.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleRevoke}
                        disabled={loading}
                    >
                        {loading ? 'Révocation...' : 'Révoquer le token'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
