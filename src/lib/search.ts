import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/embeddings';
import { logger } from '@/lib/logger';

// ============================================================
// TYPES
// ============================================================

export interface SearchResult {
  id: string;
  source: 'kb' | 'tech_watch';
  type: string; // 'note' | 'bookmark' | 'snippet' | 'article'
  title: string;
  excerpt: string;
  url: string | null;
  tags: string[];
  score: number;
  created_at: string;
}

export interface SearchResponse {
  kb: SearchResult[];
  techWatch: SearchResult[];
  query: string;
  total: number;
}

// ============================================================
// SEARCH FUNCTION
// ============================================================

/**
 * Hybrid semantic + full-text search across KB and Tech Watch.
 * Falls back to text-only search if embedding generation fails.
 */
export async function hybridSearch(
  query: string,
  limit = 10,
  options: { kbOnly?: boolean; twOnly?: boolean } = {}
): Promise<SearchResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { kb: [], techWatch: [], query, total: 0 };

  // Generate query embedding
  const embeddingResult = await generateEmbedding(query, 'RETRIEVAL_QUERY');

  if (!embeddingResult) {
    logger.warn('[search] Embedding generation failed, falling back to text-only search');
    return textOnlySearch(supabase, query, limit, options);
  }

  const { data, error } = await supabase.rpc('search_kb_and_tech_watch', {
    p_user_id: user.id,
    p_query_embedding: embeddingResult.embedding,
    p_query_text: query,
    p_limit: limit,
    p_kb_only: options.kbOnly ?? false,
    p_tw_only: options.twOnly ?? false,
  });

  if (error) {
    logger.error('[search] hybridSearch RPC failed:', error, { query, limit });
    return { kb: [], techWatch: [], query, total: 0 };
  }

  const results = (data as SearchResult[]) || [];
  const kb = results.filter((r) => r.source === 'kb');
  const techWatch = results.filter((r) => r.source === 'tech_watch');

  return { kb, techWatch, query, total: results.length };
}

/**
 * Text-only fallback search (no embeddings required).
 * Reuses the already-authenticated Supabase client from hybridSearch.
 */
async function textOnlySearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  query: string,
  limit: number,
  options: { kbOnly?: boolean; twOnly?: boolean }
): Promise<SearchResponse> {
  const kbResults: SearchResult[] = [];
  const twResults: SearchResult[] = [];

  if (!options.twOnly) {
    const { data: kbData } = await supabase
      .from('knowledge_base_entries')
      .select('id, type, title, content, source_url, tags, created_at')
      .textSearch('search_vector', query, { type: 'websearch', config: 'english' })
      .limit(limit);

    (kbData || []).forEach((row) => {
      kbResults.push({
        id: row.id,
        source: 'kb',
        type: row.type,
        title: row.title,
        excerpt: row.content?.slice(0, 200) ?? '',
        url: row.source_url ?? null,
        tags: row.tags ?? [],
        score: 0.5,
        created_at: row.created_at,
      });
    });
  }

  if (!options.kbOnly) {
    // Escape LIKE wildcards to prevent pattern abuse
    const safeQuery = query.replace(/[%_\\]/g, '\\$&');
    const { data: twData } = await supabase
      .from('tech_watch_articles')
      .select('id, title, summary, url, tags, collected_at')
      .ilike('title', `%${safeQuery}%`)
      .limit(limit);

    (twData || []).forEach((row) => {
      twResults.push({
        id: row.id,
        source: 'tech_watch',
        type: 'article',
        title: row.title,
        excerpt: row.summary?.slice(0, 200) ?? '',
        url: row.url,
        tags: row.tags ?? [],
        score: 0.5,
        created_at: row.collected_at,
      });
    });
  }

  return { kb: kbResults, techWatch: twResults, query, total: kbResults.length + twResults.length };
}
