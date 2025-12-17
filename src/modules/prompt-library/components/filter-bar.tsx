'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PROMPT_CATEGORIES, type PromptCategory } from '@/lib/prompt-library/types';

interface FilterBarProps {
  selectedCategory: PromptCategory | 'all';
  onCategoryChange: (category: PromptCategory | 'all') => void;
  showFavoritesOnly: boolean;
  onShowFavoritesChange: (show: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function FilterBar({
  selectedCategory,
  onCategoryChange,
  showFavoritesOnly,
  onShowFavoritesChange,
  searchQuery,
  onSearchChange,
}: FilterBarProps) {
  const hasActiveFilters = selectedCategory !== 'all' || showFavoritesOnly || searchQuery.length > 0;

  const clearFilters = () => {
    onCategoryChange('all');
    onShowFavoritesChange(false);
    onSearchChange('');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher dans les prompts..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category filter */}
      <Select
        value={selectedCategory}
        onValueChange={(v) => onCategoryChange(v as PromptCategory | 'all')}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Catégorie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les catégories</SelectItem>
          {PROMPT_CATEGORIES.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Favorites toggle */}
      <Button
        variant={showFavoritesOnly ? 'default' : 'outline'}
        size="icon"
        onClick={() => onShowFavoritesChange(!showFavoritesOnly)}
        className={cn(showFavoritesOnly && 'bg-yellow-500 hover:bg-yellow-600')}
      >
        <Star className={cn('h-4 w-4', showFavoritesOnly && 'fill-current')} />
      </Button>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
