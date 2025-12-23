import { createClient } from '@/lib/supabase/server';
import type { Prompt, CreatePromptInput, UpdatePromptInput, PromptFilters } from './types';

// Re-export types and client-safe utilities
export * from './types';

// ============================================
// CRUD FUNCTIONS (Server-only)
// ============================================

/**
 * Get all prompts for the current user with optional filters
 */
export async function getPrompts(filters?: PromptFilters): Promise<Prompt[]> {
  const supabase = await createClient();

  let query = supabase
    .from('prompt_library_prompts')
    .select('*')
    .order('updated_at', { ascending: false });

  // Apply filters
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.favorites) {
    query = query.eq('is_favorite', true);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  if (filters?.search) {
    // Full-text search on search_vector
    query = query.textSearch('search_vector', filters.search, {
      type: 'websearch',
      config: 'english',
    });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching prompts:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single prompt by ID
 */
export async function getPrompt(id: string): Promise<Prompt | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_library_prompts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching prompt:', error);
    return null;
  }

  return data;
}

/**
 * Create a new prompt
 */
export async function createPrompt(input: CreatePromptInput): Promise<Prompt | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('prompt_library_prompts')
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      content: input.content.trim(),
      category: input.category,
      tags: input.tags || [],
      is_favorite: input.is_favorite || false,
      source_url: input.source_url,
      is_automated: input.is_automated || false,
      status: input.status || 'published',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating prompt:', error);
    return null;
  }

  return data;
}

/**
 * Update a prompt
 */
export async function updatePrompt(id: string, updates: UpdatePromptInput): Promise<Prompt | null> {
  const supabase = await createClient();

  // Clean up updates
  const cleanUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) cleanUpdates.title = updates.title.trim();
  if (updates.content !== undefined) cleanUpdates.content = updates.content.trim();
  if (updates.category !== undefined) cleanUpdates.category = updates.category;
  if (updates.tags !== undefined) cleanUpdates.tags = updates.tags;
  if (updates.is_favorite !== undefined) cleanUpdates.is_favorite = updates.is_favorite;
  if (updates.source_url !== undefined) cleanUpdates.source_url = updates.source_url;
  if (updates.is_automated !== undefined) cleanUpdates.is_automated = updates.is_automated;
  if (updates.status !== undefined) cleanUpdates.status = updates.status;

  const { data, error } = await supabase
    .from('prompt_library_prompts')
    .update(cleanUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating prompt:', error);
    return null;
  }

  return data;
}

/**
 * Delete a prompt
 */
export async function deletePrompt(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from('prompt_library_prompts').delete().eq('id', id);

  if (error) {
    console.error('Error deleting prompt:', error);
    return false;
  }

  return true;
}

/**
 * Toggle favorite status
 */
export async function togglePromptFavorite(id: string, is_favorite: boolean): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('prompt_library_prompts')
    .update({ is_favorite })
    .eq('id', id);

  if (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }

  return true;
}

/**
 * Get all unique tags from user's prompts
 */
export async function getAllTags(): Promise<string[]> {
  const supabase = await createClient();

  // RLS ensures we only get current user's tags
  const { data, error } = await supabase.from('prompt_library_prompts').select('tags');

  if (error || !data) {
    console.error('Error fetching tags:', error);
    return [];
  }

  // Flatten and deduplicate tags
  const allTags = data.flatMap((p) => p.tags || []);
  return Array.from(new Set(allTags)).sort();
}
