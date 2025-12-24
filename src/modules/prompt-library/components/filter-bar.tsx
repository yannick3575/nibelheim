'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Star, X, FileEdit, CheckCircle2, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PROMPT_CATEGORIES, type PromptCategory, type PromptStatus } from '@/lib/prompt-library/types';

type StatusFilter = PromptStatus | 'all';

interface FilterBarProps {
  selectedCategory: PromptCategory | 'all';
  onCategoryChange: (category: PromptCategory | 'all') => void;
  showFavoritesOnly: boolean;
  onShowFavoritesChange: (show: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus?: StatusFilter;
  onStatusChange?: (status: StatusFilter) => void;
  draftCount?: number;
}

export function FilterBar({
  selectedCategory,
  onCategoryChange,
  showFavoritesOnly,
  onShowFavoritesChange,
  searchQuery,
  onSearchChange,
  selectedStatus = 'published',
  onStatusChange,
  draftCount = 0,
}: FilterBarProps) {
  const hasActiveFilters = selectedCategory !== 'all' || showFavoritesOnly || searchQuery.length > 0 || selectedStatus !== 'published';

  const clearFilters = () => {
    onCategoryChange('all');
    onShowFavoritesChange(false);
    onSearchChange('');
    onStatusChange?.('published');
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Status tabs row */}
      {onStatusChange && (
        <div className="flex items-center gap-2">
          <Button
            variant={selectedStatus === 'published' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStatusChange('published')}
            className={cn(
              'gap-2',
              selectedStatus === 'published' && 'bg-green-600 hover:bg-green-700'
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            Publiés
          </Button>
          <Button
            variant={selectedStatus === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStatusChange('draft')}
            className={cn(
              'gap-2',
              selectedStatus === 'draft' && 'bg-amber-600 hover:bg-amber-700'
            )}
          >
            <FileEdit className="h-4 w-4" />
            Brouillons
            {draftCount > 0 && (
              <Badge variant="secondary" className="ml-1 bg-background/50">
                {draftCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStatusChange('all')}
          >
            Tous
          </Button>
        </div>
      )}

      {/* Search and other filters row */}
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
    </div>
  );
}
