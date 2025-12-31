'use client';

import { memo } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface PromptStatsProps {
  stats: {
    total: number;
    favorites: number;
    categories: number;
  };
  loading: boolean;
}

// Optimization: Memoized component to prevent re-renders when parent state changes (e.g. search input)
export const PromptStats = memo(function PromptStats({ stats, loading }: PromptStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-aurora-magenta/20 hover:border-aurora-magenta/30 transition-colors">
        <CardHeader className="pb-2">
          <CardDescription>Total</CardDescription>
          <CardTitle className="text-2xl text-aurora-magenta">{loading ? '-' : stats.total}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-yellow-500/20 hover:border-yellow-500/30 transition-colors">
        <CardHeader className="pb-2">
          <CardDescription>Favoris</CardDescription>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            {loading ? '-' : stats.favorites}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-aurora-violet/20 hover:border-aurora-violet/30 transition-colors">
        <CardHeader className="pb-2">
          <CardDescription>Catégories utilisées</CardDescription>
          <CardTitle className="text-2xl text-aurora-violet">{loading ? '-' : stats.categories}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
});
