'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Bookmark, Code2, Star } from 'lucide-react';

interface EntryStatsProps {
  stats: {
    total: number;
    notes: number;
    bookmarks: number;
    snippets: number;
    favorites: number;
  };
  loading: boolean;
}

const STAT_ITEMS = [
  {
    key: 'notes' as const,
    label: 'Notes',
    icon: FileText,
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
  },
  {
    key: 'bookmarks' as const,
    label: 'Bookmarks',
    icon: Bookmark,
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
  },
  {
    key: 'snippets' as const,
    label: 'Snippets',
    icon: Code2,
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/20',
  },
  {
    key: 'favorites' as const,
    label: 'Favoris',
    icon: Star,
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/20',
  },
];

export function EntryStats({ stats, loading }: EntryStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
      {STAT_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} className={item.borderColor}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className={`h-5 w-5 ${item.textColor}`} />
              <div>
                <p className="text-2xl font-bold">{stats[item.key]}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
