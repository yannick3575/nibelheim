/**
 * AI Inbox Automation Functions
 *
 * These functions are designed for API automation (Claude Chrome, external bots, etc.)
 * They use the service role client to bypass RLS and accept explicit user_id.
 *
 * Use these functions when:
 * - The user_id is known but no session cookie is available
 * - Automating via API tokens
 * - Background jobs need to access user data
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import type {
  Item,
  ItemRow,
  ItemFilters,
  CreateItemInput,
  UpdateItemInput,
  Settings,
  UserProfile,
  SourceType,
  Category,
  Status,
} from '@/types/ai-inbox';

// ============================================
// SUPABASE SERVICE CLIENT
// ============================================

/**
 * Get Supabase client with service role key
 * Bypasses RLS - use with caution and always verify user_id
 */
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Transform database row to typed Item
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
// ITEM FUNCTIONS (with explicit user_id)
// ============================================

/**
 * Create a new inbox item for a specific user
 * Used by automation APIs
 */
export async function createItemForUser(
  userId: string,
  input: CreateItemInput
): Promise<Item | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('ai_inbox_items')
    .insert({
      user_id: userId,
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
      // Return existing item on duplicate
      const { data: existing } = await supabase
        .from('ai_inbox_items')
        .select('*')
        .eq('user_id', userId)
        .eq('url', input.url)
        .single();

      if (existing) {
        logger.warn('[ai-inbox-automation] Duplicate URL, returning existing:', {
          url: input.url,
        });
        return rowToItem(existing);
      }
      return null;
    }

    logger.error('[ai-inbox-automation] createItemForUser failed:', error, {
      userId,
      title: input.title,
    });
    return null;
  }

  return data ? rowToItem(data) : null;
}

/**
 * Get items for a specific user with optional filters
 */
export async function getItemsForUser(
  userId: string,
  filters: ItemFilters = {}
): Promise<Item[]> {
  const {
    status,
    category,
    source_type,
    favorite,
    limit = 50,
    offset = 0,
  } = filters;

  const supabase = getServiceClient();

  let query = supabase
    .from('ai_inbox_items')
    .select('*')
    .eq('user_id', userId)
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
    logger.error('[ai-inbox-automation] getItemsForUser failed:', error, {
      userId,
      filters,
    });
    return [];
  }

  return (data || []).map(rowToItem);
}

/**
 * Get a single item for a specific user
 */
export async function getItemForUser(
  userId: string,
  itemId: string
): Promise<Item | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('ai_inbox_items')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (error) {
    logger.error('[ai-inbox-automation] getItemForUser failed:', error, {
      userId,
      itemId,
    });
    return null;
  }

  return data ? rowToItem(data) : null;
}

/**
 * Update an item for a specific user
 */
export async function updateItemForUser(
  userId: string,
  itemId: string,
  updates: UpdateItemInput
): Promise<boolean> {
  const supabase = getServiceClient();

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.is_favorite !== undefined)
    updateData.is_favorite = updates.is_favorite;
  if (updates.tags !== undefined) updateData.tags = updates.tags;

  const { error } = await supabase
    .from('ai_inbox_items')
    .update(updateData)
    .eq('id', itemId)
    .eq('user_id', userId);

  if (error) {
    logger.error('[ai-inbox-automation] updateItemForUser failed:', error, {
      userId,
      itemId,
    });
    return false;
  }

  return true;
}

/**
 * Delete an item for a specific user
 */
export async function deleteItemForUser(
  userId: string,
  itemId: string
): Promise<boolean> {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('ai_inbox_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);

  if (error) {
    logger.error('[ai-inbox-automation] deleteItemForUser failed:', error, {
      userId,
      itemId,
    });
    return false;
  }

  return true;
}

// ============================================
// SETTINGS FUNCTIONS (with explicit user_id)
// ============================================

/**
 * Get settings for a specific user
 * Creates default profile if none exists
 */
export async function getSettingsForUser(userId: string): Promise<Settings | null> {
  const supabase = getServiceClient();

  // Try to get existing settings
  const { data: existing, error: fetchError } = await supabase
    .from('ai_inbox_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  // If settings exist, return them
  if (existing && !fetchError) {
    return existing as Settings;
  }

  // If error is not "no rows found", log it
  if (fetchError && fetchError.code !== 'PGRST116') {
    logger.error('[ai-inbox-automation] getSettingsForUser fetch failed:', fetchError, {
      userId,
    });
    return null;
  }

  // Create default settings for user
  const { data: created, error: createError } = await supabase
    .from('ai_inbox_settings')
    .insert({
      user_id: userId,
      profile: DEFAULT_PROFILE,
    })
    .select()
    .single();

  if (createError) {
    logger.error('[ai-inbox-automation] getSettingsForUser create failed:', createError, {
      userId,
    });
    return null;
  }

  return created as Settings;
}

/**
 * Update settings for a specific user
 */
export async function updateSettingsForUser(
  userId: string,
  profile: UserProfile
): Promise<boolean> {
  const supabase = getServiceClient();

  // Upsert: update if exists, insert if not
  const { error } = await supabase.from('ai_inbox_settings').upsert(
    {
      user_id: userId,
      profile,
    },
    {
      onConflict: 'user_id',
    }
  );

  if (error) {
    logger.error('[ai-inbox-automation] updateSettingsForUser failed:', error, {
      userId,
    });
    return false;
  }

  return true;
}

// ============================================
// AI ANALYSIS FUNCTIONS
// ============================================

/**
 * Update the AI analysis for an item
 * Called after Gemini analysis is complete
 */
export async function updateItemAnalysis(
  userId: string,
  itemId: string,
  analysis: Item['ai_analysis']
): Promise<boolean> {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('ai_inbox_items')
    .update({ ai_analysis: analysis })
    .eq('id', itemId)
    .eq('user_id', userId);

  if (error) {
    logger.error('[ai-inbox-automation] updateItemAnalysis failed:', error, {
      userId,
      itemId,
    });
    return false;
  }

  return true;
}

/**
 * Get items pending AI analysis (no ai_analysis yet)
 */
export async function getItemsPendingAnalysis(
  userId: string,
  limit = 10
): Promise<Item[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('ai_inbox_items')
    .select('*')
    .eq('user_id', userId)
    .is('ai_analysis', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    logger.error('[ai-inbox-automation] getItemsPendingAnalysis failed:', error, {
      userId,
    });
    return [];
  }

  return (data || []).map(rowToItem);
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Mark multiple items as read
 */
export async function markItemsAsReadForUser(
  userId: string,
  itemIds: string[]
): Promise<boolean> {
  if (itemIds.length === 0) return true;

  const supabase = getServiceClient();

  const { error } = await supabase
    .from('ai_inbox_items')
    .update({ status: 'read' })
    .eq('user_id', userId)
    .in('id', itemIds);

  if (error) {
    logger.error('[ai-inbox-automation] markItemsAsReadForUser failed:', error, {
      userId,
      count: itemIds.length,
    });
    return false;
  }

  return true;
}

/**
 * Archive multiple items
 */
export async function archiveItemsForUser(
  userId: string,
  itemIds: string[]
): Promise<boolean> {
  if (itemIds.length === 0) return true;

  const supabase = getServiceClient();

  const { error } = await supabase
    .from('ai_inbox_items')
    .update({ status: 'archived' })
    .eq('user_id', userId)
    .in('id', itemIds);

  if (error) {
    logger.error('[ai-inbox-automation] archiveItemsForUser failed:', error, {
      userId,
      count: itemIds.length,
    });
    return false;
  }

  return true;
}

/**
 * Delete multiple items
 */
export async function deleteItemsForUser(
  userId: string,
  itemIds: string[]
): Promise<boolean> {
  if (itemIds.length === 0) return true;

  const supabase = getServiceClient();

  const { error } = await supabase
    .from('ai_inbox_items')
    .delete()
    .eq('user_id', userId)
    .in('id', itemIds);

  if (error) {
    logger.error('[ai-inbox-automation] deleteItemsForUser failed:', error, {
      userId,
      count: itemIds.length,
    });
    return false;
  }

  return true;
}

// ============================================
// STATS FUNCTIONS
// ============================================

/**
 * Get item counts by status for a user
 */
export async function getItemCountsForUser(
  userId: string
): Promise<{ unread: number; read: number; archived: number; total: number }> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('ai_inbox_items')
    .select('status')
    .eq('user_id', userId);

  if (error) {
    logger.error('[ai-inbox-automation] getItemCountsForUser failed:', error, {
      userId,
    });
    return { unread: 0, read: 0, archived: 0, total: 0 };
  }

  const counts = {
    unread: 0,
    read: 0,
    archived: 0,
    total: data?.length || 0,
  };

  for (const item of data || []) {
    if (item.status === 'unread') counts.unread++;
    else if (item.status === 'read') counts.read++;
    else if (item.status === 'archived') counts.archived++;
  }

  return counts;
}
