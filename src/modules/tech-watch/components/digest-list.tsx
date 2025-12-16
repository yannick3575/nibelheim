'use client';

import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DigestMeta } from '@/lib/tech-watch';

interface DigestListProps {
    digests: DigestMeta[];
    selectedDate: string | null;
    onSelect: (date: string) => void;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
}

export function DigestList({ digests, selectedDate, onSelect }: DigestListProps) {
    if (digests.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Historique
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Aucun digest disponible
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Historique
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto">
                    {digests.map((digest) => (
                        <button
                            key={digest.id}
                            onClick={() => onSelect(digest.date)}
                            className={cn(
                                "w-full px-4 py-3 text-left transition-colors",
                                "hover:bg-muted/50 border-b border-border last:border-b-0",
                                selectedDate === digest.date && "bg-muted"
                            )}
                        >
                            <div className="font-medium text-sm">
                                {formatDate(digest.date)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                                {digest.article_count} article{digest.article_count > 1 ? 's' : ''}
                            </div>
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
