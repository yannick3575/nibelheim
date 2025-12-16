'use client';

import { useState } from 'react';
import { ExternalLink, MessageSquare, Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import type { Article } from '@/lib/tech-watch';

interface ArticleCardProps {
    article: Article;
    onToggleRead: (id: string, read: boolean) => Promise<void>;
}

export function ArticleCard({ article, onToggleRead }: ArticleCardProps) {
    const [isRead, setIsRead] = useState(article.read);
    const [isUpdating, setIsUpdating] = useState(false);

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

    // Extract HN discussion URL from summary if present
    const hnUrlMatch = article.summary?.match(/\[Hacker News\]\((https:\/\/news\.ycombinator\.com\/item\?id=\d+)\)/);
    const hnUrl = hnUrlMatch ? hnUrlMatch[1] : null;

    return (
        <Card className={cn(
            "transition-opacity",
            isRead && "opacity-60"
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group"
                        >
                            <CardTitle className="text-base font-semibold leading-tight group-hover:underline flex items-center gap-2">
                                {article.title}
                                <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </CardTitle>
                        </a>
                        <CardDescription className="mt-1.5 flex items-center gap-3">
                            <span className="capitalize">{article.source.replace('_', ' ')}</span>
                            {hnUrl && (
                                <a
                                    href={hnUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-orange-500 hover:text-orange-400 transition-colors"
                                >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    <span>Discussion</span>
                                </a>
                            )}
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleRead}
                        disabled={isUpdating}
                        className={cn(
                            "flex-shrink-0",
                            isRead && "text-green-500 hover:text-green-400"
                        )}
                        title={isRead ? "Marquer comme non lu" : "Marquer comme lu"}
                    >
                        {isRead ? (
                            <Check className="h-5 w-5" />
                        ) : (
                            <Circle className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </CardHeader>
            {article.summary && (
                <CardContent className="pt-0">
                    <MarkdownRenderer content={article.summary} />
                </CardContent>
            )}
        </Card>
    );
}
