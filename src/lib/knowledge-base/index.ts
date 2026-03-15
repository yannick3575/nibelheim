import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { generateEmbedding, prepareKBEntryText } from '@/lib/embeddings';
import type { KBEntry, CreateKBEntryInput, UpdateKBEntryInput, KBFilters } from './types';

// Re-export types for convenience
export * from './types';

// Columns to select (exclude embedding - large binary not needed in lists)
const SELECT_COLUMNS =
  'id, user_id, type, title, content, source_url, source_title, code_language, category, tags, is_favorite, created_at, updated_at';

// ============================================================
// CRUD FUNCTIONS
// ============================================================

/**
 * Get all KB entries for the current user with optional filters.
 */
export async function getKBEntries(filters?: KBFilters): Promise<KBEntry[]> {
  const supabase = await createClient();

  let query = supabase
    .from('knowledge_base_entries')
    .select(SELECT_COLUMNS)
    .order('updated_at', { ascending: false });

  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.favorites) query = query.eq('is_favorite', true);
  if (filters?.tags?.length) query = query.contains('tags', filters.tags);

  if (filters?.search) {
    query = query.textSearch('search_vector', filters.search, {
      type: 'websearch',
      config: 'english',
    });
  }

  const { data, error } = await query;

  if (error) {
    logger.error('[knowledge-base] getKBEntries failed:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single KB entry by ID.
 */
export async function getKBEntry(id: string): Promise<KBEntry | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('knowledge_base_entries')
    .select(SELECT_COLUMNS)
    .eq('id', id)
    .single();

  if (error) {
    logger.error('[knowledge-base] getKBEntry failed:', error, { entryId: id });
    return null;
  }

  return data;
}

/**
 * Create a new KB entry with embedding generated in background.
 */
export async function createKBEntry(input: CreateKBEntryInput): Promise<KBEntry | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: entry, error } = await supabase
    .from('knowledge_base_entries')
    .insert({
      user_id: user.id,
      type: input.type,
      title: input.title.trim(),
      content: input.content.trim(),
      source_url: input.source_url ?? null,
      source_title: input.source_title ?? null,
      code_language: input.code_language ?? null,
      category: input.category ?? 'general',
      tags: input.tags ?? [],
      is_favorite: input.is_favorite ?? false,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    logger.error('[knowledge-base] createKBEntry failed:', error, { title: input.title });
    return null;
  }

  // Generate embedding in background (entry is usable without it)
  void (async () => {
    try {
      const text = prepareKBEntryText(entry.title, entry.content);
      const result = await generateEmbedding(text, 'RETRIEVAL_DOCUMENT');
      if (result) {
        const { error: embedError } = await supabase
          .from('knowledge_base_entries')
          .update({ embedding: result.embedding })
          .eq('id', entry.id);
        if (embedError) {
          logger.error('[knowledge-base] Embedding update failed:', embedError, { entryId: entry.id });
        }
      }
    } catch (err) {
      logger.error('[knowledge-base] Embedding generation failed:', err, { entryId: entry.id });
    }
  })();

  return entry;
}

/**
 * Update a KB entry. Regenerates embedding if title or content changed.
 */
export async function updateKBEntry(id: string, updates: UpdateKBEntryInput): Promise<KBEntry | null> {
  const supabase = await createClient();

  const cleanUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) cleanUpdates.title = updates.title.trim();
  if (updates.content !== undefined) cleanUpdates.content = updates.content.trim();
  if (updates.source_url !== undefined) cleanUpdates.source_url = updates.source_url;
  if (updates.source_title !== undefined) cleanUpdates.source_title = updates.source_title;
  if (updates.code_language !== undefined) cleanUpdates.code_language = updates.code_language;
  if (updates.category !== undefined) cleanUpdates.category = updates.category;
  if (updates.tags !== undefined) cleanUpdates.tags = updates.tags;
  if (updates.is_favorite !== undefined) cleanUpdates.is_favorite = updates.is_favorite;

  const { data: entry, error } = await supabase
    .from('knowledge_base_entries')
    .update(cleanUpdates)
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    logger.error('[knowledge-base] updateKBEntry failed:', error, { entryId: id });
    return null;
  }

  // Regenerate embedding if text content changed
  const textChanged = updates.title !== undefined || updates.content !== undefined;
  if (textChanged && entry) {
    void (async () => {
      try {
        const text = prepareKBEntryText(entry.title, entry.content);
        const result = await generateEmbedding(text, 'RETRIEVAL_DOCUMENT');
        if (result) {
          await supabase
            .from('knowledge_base_entries')
            .update({ embedding: result.embedding })
            .eq('id', id);
        }
      } catch (err) {
        logger.error('[knowledge-base] Embedding re-generation failed:', err, { entryId: id });
      }
    })();
  }

  return entry;
}

/**
 * Delete a KB entry.
 */
export async function deleteKBEntry(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from('knowledge_base_entries').delete().eq('id', id);

  if (error) {
    logger.error('[knowledge-base] deleteKBEntry failed:', error, { entryId: id });
    return false;
  }

  return true;
}

/**
 * Re-generate embedding for a specific entry.
 */
export async function regenerateEmbedding(id: string): Promise<boolean> {
  const supabase = await createClient();

  const entry = await getKBEntry(id);
  if (!entry) return false;

  const text = prepareKBEntryText(entry.title, entry.content);
  const result = await generateEmbedding(text, 'RETRIEVAL_DOCUMENT');

  if (!result) {
    logger.error('[knowledge-base] regenerateEmbedding failed', { entryId: id });
    return false;
  }

  const { error } = await supabase
    .from('knowledge_base_entries')
    .update({ embedding: result.embedding })
    .eq('id', id);

  if (error) {
    logger.error('[knowledge-base] regenerateEmbedding update failed:', error, { entryId: id });
    return false;
  }

  return true;
}
