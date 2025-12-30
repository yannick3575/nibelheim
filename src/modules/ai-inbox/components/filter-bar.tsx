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
import { Search, Star, X, Inbox, Check, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Status, Category, SourceType } from '@/types/ai-inbox';
import { CATEGORY_LABELS, SOURCE_TYPE_LABELS } from '@/types/ai-inbox';

type StatusFilter = Status | 'all';
type CategoryFilter = Category | 'all';
type SourceTypeFilter = SourceType | 'all';

interface FilterBarProps {
  selectedStatus: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  selectedCategory: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  selectedSourceType: SourceTypeFilter;
  onSourceTypeChange: (sourceType: SourceTypeFilter) => void;
  showFavoritesOnly: boolean;
  onShowFavoritesChange: (show: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    unread: number;
    read: number;
    archived: number;
  };
}

const SOURCE_TYPES: SourceType[] = [
  'youtube',
  'substack',
  'manual',
  'other',
];

const CATEGORIES: Category[] = [
  'tools',
  'prompts',
  'tutorials',
  'news',
  'inspiration',
];

export function FilterBar({
  selectedStatus,
  onStatusChange,
  selectedCategory,
  onCategoryChange,
  selectedSourceType,
  onSourceTypeChange,
  showFavoritesOnly,
  onShowFavoritesChange,
  searchQuery,
  onSearchChange,
  counts,
}: FilterBarProps) {
  const hasActiveFilters =
    selectedStatus !== 'all' ||
    selectedCategory !== 'all' ||
    selectedSourceType !== 'all' ||
    showFavoritesOnly ||
    searchQuery.length > 0;

  const clearFilters = () => {
    onStatusChange('all');
    onCategoryChange('all');
    onSourceTypeChange('all');
    onShowFavoritesChange(false);
    onSearchChange('');
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Status tabs row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={selectedStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusChange('all')}
        >
          Tous
        </Button>
        <Button
          variant={selectedStatus === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusChange('unread')}
          className={cn(
            'gap-2',
            selectedStatus === 'unread' && 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          <Inbox className="h-4 w-4" />
          Non lus
          {counts.unread > 0 && (
            <Badge variant="secondary" className="ml-1 bg-background/50">
              {counts.unread}
            </Badge>
          )}
        </Button>
        <Button
          variant={selectedStatus === 'read' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusChange('read')}
          className={cn(
            'gap-2',
            selectedStatus === 'read' && 'bg-green-600 hover:bg-green-700'
          )}
        >
          <Check className="h-4 w-4" />
          Lus
          {counts.read > 0 && (
            <Badge variant="secondary" className="ml-1 bg-background/50">
              {counts.read}
            </Badge>
          )}
        </Button>
        <Button
          variant={selectedStatus === 'archived' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusChange('archived')}
          className={cn(
            'gap-2',
            selectedStatus === 'archived' && 'bg-gray-600 hover:bg-gray-700'
          )}
        >
          <Archive className="h-4 w-4" />
          Archivés
          {counts.archived > 0 && (
            <Badge variant="secondary" className="ml-1 bg-background/50">
              {counts.archived}
            </Badge>
          )}
        </Button>
      </div>

      {/* Search and other filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Source Type filter */}
        <Select
          value={selectedSourceType}
          onValueChange={(v) => onSourceTypeChange(v as SourceTypeFilter)}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les sources</SelectItem>
            {SOURCE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {SOURCE_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category filter */}
        <Select
          value={selectedCategory}
          onValueChange={(v) => onCategoryChange(v as CategoryFilter)}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Favorites toggle */}
        <Button
          variant={showFavoritesOnly ? 'default' : 'outline'}
          size="icon"
          onClick={() => onShowFavoritesChange(!showFavoritesOnly)}
          className={cn(
            showFavoritesOnly && 'bg-yellow-500 hover:bg-yellow-600'
          )}
        >
          <Star
            className={cn('h-4 w-4', showFavoritesOnly && 'fill-current')}
          />
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
