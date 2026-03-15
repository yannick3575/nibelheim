'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KB_CATEGORIES, KB_ENTRY_TYPES, type KBCategory, type KBEntryType } from '@/lib/knowledge-base/types';

interface FilterBarProps {
  selectedType: KBEntryType | 'all';
  onTypeChange: (type: KBEntryType | 'all') => void;
  selectedCategory: KBCategory | 'all';
  onCategoryChange: (category: KBCategory | 'all') => void;
  showFavoritesOnly: boolean;
  onShowFavoritesChange: (show: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const FilterBar = memo(function FilterBar({
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  showFavoritesOnly,
  onShowFavoritesChange,
  searchQuery,
  onSearchChange,
}: FilterBarProps) {
  const hasActiveFilters =
    selectedType !== 'all' || selectedCategory !== 'all' || showFavoritesOnly || searchQuery !== '';

  return (
    <div className="space-y-3">
      {/* Type filter buttons */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTypeChange('all')}
          className={cn(
            'h-8 text-xs',
            selectedType === 'all' && 'bg-primary/10 text-primary'
          )}
        >
          Tout
        </Button>
        {KB_ENTRY_TYPES.map((t) => (
          <Button
            key={t.value}
            variant="ghost"
            size="sm"
            onClick={() => onTypeChange(t.value)}
            className={cn(
              'h-8 text-xs',
              selectedType === t.value && 'bg-primary/10 text-primary'
            )}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Search + category + favorites */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher..."
            className="pl-9"
          />
        </div>

        <Select value={selectedCategory} onValueChange={(v) => onCategoryChange(v as KBCategory | 'all')}>
          <SelectTrigger className="sm:w-[160px]">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {KB_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={showFavoritesOnly ? 'default' : 'outline'}
          size="icon"
          onClick={() => onShowFavoritesChange(!showFavoritesOnly)}
          className={cn(showFavoritesOnly && 'bg-yellow-500 hover:bg-yellow-600 text-white')}
        >
          <Star className={cn('h-4 w-4', showFavoritesOnly && 'fill-white')} />
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              onTypeChange('all');
              onCategoryChange('all');
              onShowFavoritesChange(false);
              onSearchChange('');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
});
