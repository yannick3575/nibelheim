'use client';

import { memo, useEffect, useState } from 'react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Search, Star, X, FileEdit, CheckCircle2 } from 'lucide-react';
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

// Optimization: Memoized to prevent re-renders when unrelated parent state changes
export const FilterBar = memo(function FilterBar({
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
  // Local state for immediate input response
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync local state when parent searchQuery changes (e.g., reset filters)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounce logic
  useEffect(() => {
    if (localSearch === searchQuery) return;

    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange, searchQuery]);

  const hasActiveFilters = selectedCategory !== 'all' || showFavoritesOnly || localSearch.length > 0 || selectedStatus !== 'published';

  const clearFilters = () => {
    onCategoryChange('all');
    onShowFavoritesChange(false);
    onSearchChange(''); // This will update parent, which updates prop, which updates local state via useEffect
    onStatusChange?.('published');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
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
            value={localSearch}
            onChange={handleSearchChange}
            className="pl-9"
            aria-label="Recherche"
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showFavoritesOnly ? 'default' : 'outline'}
              size="icon"
              onClick={() => onShowFavoritesChange(!showFavoritesOnly)}
              className={cn(showFavoritesOnly && 'bg-yellow-500 hover:bg-yellow-600')}
              aria-label={showFavoritesOnly ? "Afficher tout" : "Afficher les favoris uniquement"}
            >
              <Star className={cn('h-4 w-4', showFavoritesOnly && 'fill-current')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{showFavoritesOnly ? "Afficher tout" : "Afficher les favoris uniquement"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFilters}
                aria-label="Effacer les filtres"
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Effacer les filtres</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
});
