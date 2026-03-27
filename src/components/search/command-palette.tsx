'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Search, Loader2, Brain, Rss } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCommandPalette } from './use-command-palette';
import { SearchResultItem } from './search-result-item';
import type { SearchResult } from '@/lib/search';

interface SearchResults {
  kb: SearchResult[];
  techWatch: SearchResult[];
  total: number;
}

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [fetchedResults, setFetchedResults] = useState<SearchResults | null>(null);
  const [fetchedForQuery, setFetchedForQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Derive displayed results and loading state (avoids setState in effects)
  const results = debouncedQuery && debouncedQuery.length >= 2 ? fetchedResults : null;
  const loading = debouncedQuery.length >= 2 && debouncedQuery !== fetchedForQuery;

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch results
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      return;
    }

    let cancelled = false;

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setFetchedResults(data);
          setFetchedForQuery(debouncedQuery);
          setSelectedIndex(0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchedResults(null);
          setFetchedForQuery(debouncedQuery);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Reset state via event handler (avoids setState in effect)
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      if (!newOpen) {
        setQuery('');
        setDebouncedQuery('');
        setFetchedResults(null);
        setFetchedForQuery('');
        setSelectedIndex(0);
      }
    },
    [setOpen]
  );

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Get flat list of results for keyboard navigation
  const allResults = results ? [...results.kb, ...results.techWatch] : [];

  const handleSelect = useCallback(
    (result: SearchResult) => {
      handleOpenChange(false);
      if (result.source === 'kb') {
        router.push(`/knowledge-base`);
      } else if (result.source === 'tech_watch' && result.url) {
        window.open(result.url, '_blank');
      } else {
        router.push(`/tech-watch`);
      }
    },
    [handleOpenChange, router]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(allResults[selectedIndex]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden" showCloseButton={false}>
        <VisuallyHidden>
          <DialogTitle>Recherche</DialogTitle>
        </VisuallyHidden>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          {loading ? (
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin flex-shrink-0" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher dans tout..."
            className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {!results && !loading && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Tapez pour rechercher dans Knowledge Base et Tech Watch</p>
              <p className="text-xs mt-1 opacity-70">Recherche sémantique + full-text</p>
            </div>
          )}

          {results && results.total === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucun résultat pour &quot;{debouncedQuery}&quot;
            </div>
          )}

          {results && results.kb.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Brain className="h-3.5 w-3.5" />
                Knowledge Base
              </div>
              {results.kb.map((result, i) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    isSelected={i === selectedIndex}
                    onClick={() => handleSelect(result)}
                  />
              ))}
            </div>
          )}

          {results && results.techWatch.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Rss className="h-3.5 w-3.5" />
                Tech Watch
              </div>
              {results.techWatch.map((result, i) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    isSelected={results.kb.length + i === selectedIndex}
                    onClick={() => handleSelect(result)}
                  />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border px-1">↑</kbd>
              <kbd className="rounded border px-1">↓</kbd>
              naviguer
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border px-1">↵</kbd>
              ouvrir
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="rounded border px-1">⌘K</kbd>
            rechercher
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
