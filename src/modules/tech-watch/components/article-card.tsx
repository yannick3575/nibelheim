'use client';

import { useState } from 'react';
import { ExternalLink, MessageSquare, Check, Circle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { toast } from 'sonner';
import type { Article } from '@/lib/tech-watch';

interface ArticleCardProps {
    article: Article;
    onToggleRead: (id: string, read: boolean) => Promise<void>;
    onToggleFavorite?: (id: string, is_favorite: boolean) => Promise<void>;
}

export function ArticleCard({ article, onToggleRead, onToggleFavorite }: ArticleCardProps) {
    const [isRead, setIsRead] = useState(article.read);
    const [isFavorite, setIsFavorite] = useState(article.is_favorite);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isFavoriteUpdating, setIsFavoriteUpdating] = useState(false);

    const handleToggleRead = async () => {
        setIsUpdating(true);
        try {
            await onToggleRead(article.id, !isRead);
            setIsRead(!isRead);
        } catch (error) {
            console.error('Failed to toggle read status:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleToggleFavorite = async () => {
        if (!onToggleFavorite || isFavoriteUpdating) return; // Guard against race condition

        const newFavorite = !isFavorite;
        setIsFavorite(newFavorite); // Optimistic update
        setIsFavoriteUpdating(true);

        try {
            await onToggleFavorite(article.id, newFavorite);
            toast.success(newFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris');
        } catch (error) {
            console.error('Failed to toggle favorite status:', error);
            setIsFavorite(!newFavorite); // Revert on error
            toast.error('Erreur lors de la mise à jour');
        } finally {
            setIsFavoriteUpdating(false);
        }
    };

    // Extract HN discussion URL from summary if present
    const hnUrlMatch = article.summary?.match(/\[Hacker News\]\((https:\/\/news\.ycombinator\.com\/item\?id=\d+)\)/);
    const hnUrl = hnUrlMatch ? hnUrlMatch[1] : null;

    return (
        <Card className={cn(
            "transition-opacity",
            isRead && "opacity-60"
        )}>
            <CardHeader className="pb-3 p-4 sm:p-6">
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                        <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group"
                        >
                            <CardTitle className="text-sm sm:text-base font-semibold leading-tight group-hover:underline flex items-center gap-2">
                                <span className="break-words">{article.title}</span>
                                <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </CardTitle>
                        </a>
                        <CardDescription className="mt-1.5 flex items-center gap-2 sm:gap-3 flex-wrap text-xs sm:text-sm">
                            <span className="capitalize">{article.source.replace('_', ' ')}</span>
                            {hnUrl && (
                                <a
                                    href={hnUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-orange-500 hover:text-orange-400 transition-colors"
                                >
                                    <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                    <span className="hidden sm:inline">Discussion</span>
                                </a>
                            )}
                            {article.tags && article.tags.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                    {article.tags.slice(0, 3).map((tag) => (
                                        <Badge key={tag} variant="secondary" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                        {onToggleFavorite && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleToggleFavorite}
                                disabled={isFavoriteUpdating}
                                className={cn(
                                    "flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 p-0",
                                    isFavorite && "text-yellow-500"
                                )}
                                title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                            >
                                <Star className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isFavorite && "fill-yellow-500")} />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleToggleRead}
                            disabled={isUpdating}
                            className={cn(
                                "flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 p-0",
                                isRead && "text-green-500 hover:text-green-400"
                            )}
                            title={isRead ? "Marquer comme non lu" : "Marquer comme lu"}
                        >
                            {isRead ? (
                                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            ) : (
                                <Circle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            {article.summary && (
                <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
                    <MarkdownRenderer content={article.summary} />
                </CardContent>
            )}
        </Card>
    );
}
