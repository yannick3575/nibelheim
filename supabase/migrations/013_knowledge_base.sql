-- ============================================================
-- Migration 013: Knowledge Base + Unified Embeddings
--
-- Changes:
--   1. Alter tech_watch_articles.embedding from vector(1536) to vector(768)
--      (column was never populated - safe to change dimension)
--   2. Replace IVFFlat with HNSW on tech_watch_articles
--      (HNSW works on small/empty datasets, IVFFlat does not)
--   3. Create knowledge_base_entries table with FTS + vector search
--   4. Create search_kb_and_tech_watch RPC for hybrid search
-- ============================================================

-- ============================================================
-- PART 1: Fix tech_watch_articles vector column
-- ============================================================

-- Drop the old IVFFlat index (requires minimum rows; broken on empty table)
DROP INDEX IF EXISTS public.tech_watch_articles_embedding_idx;

-- Change dimension from 1536 (OpenAI) to 768 (Gemini text-embedding-004)
-- Safe because the column has never been populated
ALTER TABLE public.tech_watch_articles
  ALTER COLUMN embedding TYPE vector(768);

-- Create HNSW index (no minimum row requirement, better for incremental inserts)
CREATE INDEX IF NOT EXISTS idx_tech_watch_articles_embedding_hnsw
  ON public.tech_watch_articles
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================================
-- PART 2: knowledge_base_entries table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.knowledge_base_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Content
  type          TEXT NOT NULL DEFAULT 'note'
                  CHECK (type IN ('note', 'bookmark', 'snippet')),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL DEFAULT '',

  -- Bookmark-specific (null for notes/snippets)
  source_url    TEXT,
  source_title  TEXT,

  -- Snippet-specific
  code_language TEXT,  -- 'typescript', 'python', etc.

  -- Organisation
  category      TEXT NOT NULL DEFAULT 'general'
                  CHECK (category IN ('general', 'engineering', 'research', 'reference', 'personal')),
  tags          TEXT[] DEFAULT '{}',
  is_favorite   BOOLEAN DEFAULT false,

  -- Full-text search (auto-generated from title + content)
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED,

  -- Semantic search
  embedding     vector(768),

  -- Timestamps
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT kb_title_not_empty CHECK (length(trim(title)) > 0)
);

-- ============================================================
-- PART 3: Indexes for knowledge_base_entries
-- ============================================================

-- Primary user filter
CREATE INDEX IF NOT EXISTS idx_kb_entries_user_id
  ON public.knowledge_base_entries(user_id);

-- Type filter
CREATE INDEX IF NOT EXISTS idx_kb_entries_user_type
  ON public.knowledge_base_entries(user_id, type);

-- Category filter
CREATE INDEX IF NOT EXISTS idx_kb_entries_user_category
  ON public.knowledge_base_entries(user_id, category);

-- Tags GIN for array containment queries
CREATE INDEX IF NOT EXISTS idx_kb_entries_tags
  ON public.knowledge_base_entries USING GIN(tags);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_kb_entries_search_vector
  ON public.knowledge_base_entries USING GIN(search_vector);

-- Favorites (sparse partial index)
CREATE INDEX IF NOT EXISTS idx_kb_entries_favorites
  ON public.knowledge_base_entries(user_id, created_at DESC)
  WHERE is_favorite = true;

-- HNSW for semantic search
CREATE INDEX IF NOT EXISTS idx_kb_entries_embedding_hnsw
  ON public.knowledge_base_entries
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================================
-- PART 4: Row Level Security
-- ============================================================

ALTER TABLE public.knowledge_base_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own kb entries"
  ON public.knowledge_base_entries
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- PART 5: updated_at trigger (reuses existing function)
-- ============================================================

CREATE TRIGGER update_kb_entries_updated_at
  BEFORE UPDATE ON public.knowledge_base_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PART 6: Hybrid search RPC
--
-- Combines:
--   - Cosine similarity (vector search)
--   - Full-text search rank (tsvector)
--   - Weighted fusion: 0.7 * semantic + 0.3 * fts
--
-- Returns union of KB entries + Tech Watch articles.
-- ============================================================

CREATE OR REPLACE FUNCTION public.search_kb_and_tech_watch(
  p_user_id         UUID,
  p_query_embedding vector(768),
  p_query_text      TEXT,
  p_limit           INT DEFAULT 10,
  p_kb_only         BOOLEAN DEFAULT false,
  p_tw_only         BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id          UUID,
  source      TEXT,
  type        TEXT,
  title       TEXT,
  excerpt     TEXT,
  url         TEXT,
  tags        TEXT[],
  score       FLOAT,
  created_at  TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH kb_results AS (
    SELECT
      e.id,
      'kb'::TEXT                          AS source,
      e.type::TEXT                        AS type,
      e.title,
      left(e.content, 200)               AS excerpt,
      e.source_url                       AS url,
      e.tags,
      (
        0.7 * (1 - (e.embedding <=> p_query_embedding)) +
        0.3 * COALESCE(ts_rank(e.search_vector, websearch_to_tsquery('english', p_query_text)), 0)
      )::FLOAT                           AS score,
      e.created_at
    FROM public.knowledge_base_entries e
    WHERE
      e.user_id = p_user_id
      AND e.embedding IS NOT NULL
      AND NOT p_tw_only
    ORDER BY e.embedding <=> p_query_embedding
    LIMIT p_limit * 2
  ),
  tw_results AS (
    SELECT
      a.id,
      'tech_watch'::TEXT                  AS source,
      'article'::TEXT                     AS type,
      a.title,
      left(coalesce(a.summary, a.content, ''), 200) AS excerpt,
      a.url                              AS url,
      a.tags,
      (
        0.7 * (1 - (a.embedding <=> p_query_embedding)) +
        0.3 * COALESCE(ts_rank(
          to_tsvector('english', coalesce(a.title, '') || ' ' || coalesce(a.summary, '')),
          websearch_to_tsquery('english', p_query_text)
        ), 0)
      )::FLOAT                           AS score,
      a.collected_at                     AS created_at
    FROM public.tech_watch_articles a
    WHERE
      a.user_id = p_user_id
      AND a.embedding IS NOT NULL
      AND NOT p_kb_only
    ORDER BY a.embedding <=> p_query_embedding
    LIMIT p_limit * 2
  ),
  combined AS (
    SELECT * FROM kb_results
    UNION ALL
    SELECT * FROM tw_results
  )
  SELECT *
  FROM combined
  ORDER BY combined.score DESC
  LIMIT p_limit;
END;
$$;
