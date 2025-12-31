/**
 * AI Inbox Library Functions
 *
 * Server-side functions for the AI Inbox module.
 * Uses the Supabase server client with RLS for user data isolation.
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type {
  Item,
  ItemRow,
  ItemFilters,
  CreateItemInput,
  UpdateItemInput,
  Settings,
  SettingsRow,
  UserProfile,
  SourceType,
  Category,
  Status,
} from '@/types/ai-inbox';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Transform database row to typed Item
 * Ensures type safety by casting string columns to literal types
 */
function rowToItem(row: ItemRow): Item {
  return {
    ...row,
    source_type: row.source_type as SourceType,
    category: row.category as Category,
    status: row.status as Status,
  };
}

/**
 * Default user profile for new users
 */
const DEFAULT_PROFILE: UserProfile = {
  current_stack: [],
  current_projects: [],
  skill_level: 'intermediate',
  interests: [],
};

// ============================================
// ITEM FUNCTIONS
// ============================================

/**
 * Get all items for the current user with optional filters
 */
export async function getItems(filters: ItemFilters = {}): Promise<Item[]> {
  const {
    status,
    category,
    source_type,
    favorite,
    limit = 50,
    offset = 0,
  } = filters;

  const supabase = await createClient();

  let query = supabase
    .from('ai_inbox_items')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (source_type) {
    query = query.eq('source_type', source_type);
  }
  if (favorite === true) {
    query = query.eq('is_favorite', true);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('[ai-inbox] getItems failed:', error, { filters });
    return [];
  }

  return (data || []).map(rowToItem);
}

/**
 * Get a single item by ID
 */
export async function getItem(id: string): Promise<Item | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_inbox_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('[ai-inbox] getItem failed:', error, { itemId: id });
    return null;
  }

  return data ? rowToItem(data) : null;
}

/**
 * Create a new inbox item
 * Returns the created item (without ai_analysis which is added async)
 */
export async function createItem(
  input: CreateItemInput
): Promise<Item | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logger.error('[ai-inbox] createItem: No authenticated user');
    return null;
  }

  const { data, error } = await supabase
    .from('ai_inbox_items')
    .insert({
      user_id: user.id,
      title: input.title,
      url: input.url || null,
      source_type: input.source_type || 'manual',
      category: input.category || 'news',
      raw_content: input.raw_content || null,
      tags: input.tags || [],
      status: 'unread',
      is_favorite: false,
    })
    .select()
    .single();

  if (error) {
    // Check for duplicate URL
    if (error.code === '23505') {
      logger.warn('[ai-inbox] Duplicate URL:', { url: input.url });
      return null;
    }
    logger.error('[ai-inbox] createItem failed:', error, { title: input.title });
    return null;
  }

  return data ? rowToItem(data) : null;
}

/**
 * Update an existing inbox item
 */
export async function updateItem(
  id: string,
  updates: UpdateItemInput
): Promise<boolean> {
  const supabase = await createClient();

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.is_favorite !== undefined)
    updateData.is_favorite = updates.is_favorite;
  if (updates.tags !== undefined) updateData.tags = updates.tags;
  if (updates.ai_analysis !== undefined)
    updateData.ai_analysis = updates.ai_analysis;

  const { error } = await supabase
    .from('ai_inbox_items')
    .update(updateData)
    .eq('id', id);

  if (error) {
    logger.error('[ai-inbox] updateItem failed:', error, { itemId: id });
    return false;
  }

  return true;
}

/**
 * Delete an inbox item
 */
export async function deleteItem(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('ai_inbox_items')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('[ai-inbox] deleteItem failed:', error, { itemId: id });
    return false;
  }

  return true;
}

// ============================================
// SETTINGS FUNCTIONS
// ============================================

/**
 * Get user settings
 * Creates default profile if none exists (upsert pattern)
 */
export async function getSettings(): Promise<Settings | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logger.error('[ai-inbox] getSettings: No authenticated user');
    return null;
  }

  // Try to get existing settings
  const { data: existing, error: fetchError } = await supabase
    .from('ai_inbox_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // If settings exist, return them
  if (existing && !fetchError) {
    return existing as Settings;
  }

  // If error is not "no rows found", log it
  if (fetchError && fetchError.code !== 'PGRST116') {
    logger.error('[ai-inbox] getSettings fetch failed:', fetchError);
    return null;
  }

  // Create default settings for new user
  const { data: created, error: createError } = await supabase
    .from('ai_inbox_settings')
    .insert({
      user_id: user.id,
      profile: DEFAULT_PROFILE,
    })
    .select()
    .single();

  if (createError) {
    logger.error('[ai-inbox] getSettings create failed:', createError);
    return null;
  }

  return created as Settings;
}

/**
 * Update user profile settings
 */
export async function updateSettings(profile: UserProfile): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logger.error('[ai-inbox] updateSettings: No authenticated user');
    return false;
  }

  // Upsert pattern: update if exists, insert if not
  const { error } = await supabase
    .from('ai_inbox_settings')
    .upsert(
      {
        user_id: user.id,
        profile,
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    logger.error('[ai-inbox] updateSettings failed:', error);
    return false;
  }

  return true;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Mark item as read
 * Convenience wrapper around updateItem
 */
export async function markAsRead(id: string): Promise<boolean> {
  return updateItem(id, { status: 'read' });
}

/**
 * Mark item as unread
 * Convenience wrapper around updateItem
 */
export async function markAsUnread(id: string): Promise<boolean> {
  return updateItem(id, { status: 'unread' });
}

/**
 * Archive an item
 * Convenience wrapper around updateItem
 */
export async function archiveItem(id: string): Promise<boolean> {
  return updateItem(id, { status: 'archived' });
}

/**
 * Toggle item favorite status
 */
export async function toggleFavorite(
  id: string,
  is_favorite: boolean
): Promise<boolean> {
  return updateItem(id, { is_favorite });
}

/**
 * Get favorite items
 * Convenience wrapper around getItems
 */
export async function getFavorites(): Promise<Item[]> {
  return getItems({ favorite: true });
}

/**
 * Get unread items count
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('ai_inbox_items')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'unread');

  if (error) {
    logger.error('[ai-inbox] getUnreadCount failed:', error);
    return 0;
  }

  return count || 0;
}
