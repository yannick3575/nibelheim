'use client';

import { memo } from 'react';
import { FileText, Bookmark, Code2, Rss } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SearchResult } from '@/lib/search';

const TYPE_ICONS = {
  note: FileText,
  bookmark: Bookmark,
  snippet: Code2,
  article: Rss,
} as const;

const SOURCE_LABELS = {
  kb: 'Knowledge Base',
  tech_watch: 'Tech Watch',
} as const;

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}

export const SearchResultItem = memo(function SearchResultItem({
  result,
  isSelected,
  onClick,
}: SearchResultItemProps) {
  const Icon = TYPE_ICONS[result.type as keyof typeof TYPE_ICONS] ?? FileText;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left transition-colors ${
        isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
      }`}
    >
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-1">{result.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{result.excerpt}</p>
      </div>
      <Badge variant="outline" className="text-[10px] flex-shrink-0 mt-0.5">
        {SOURCE_LABELS[result.source]}
      </Badge>
    </button>
  );
});
