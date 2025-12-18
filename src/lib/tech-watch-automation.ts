/**
 * Tech Watch Automation Functions
 * These functions are designed for API automation (Claude Chrome, etc.)
 * They use the service role client to bypass RLS and accept explicit user_id
 */

import { createClient } from '@supabase/supabase-js';
import { Article, Source } from './tech-watch';

// ============================================
// SUPABASE SERVICE CLIENT
// ============================================

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// ============================================
// ARTICLE FUNCTIONS (with explicit user_id)
// ============================================

export interface CreateArticleInput {
    title: string;
    url: string;
    source: string;
    content?: string;
    summary?: string;
    tags?: string[];
    published_at?: string;
}

/**
 * Create a new article for a specific user
 * Used by automation APIs
 */
export async function createArticle(
    userId: string,
    input: CreateArticleInput
): Promise<Article | null> {
    const supabase = getServiceClient();

    const { data, error } = await supabase
        .from('tech_watch_articles')
        .insert({
            user_id: userId,
            title: input.title,
            url: input.url,
            source: input.source,
            content: input.content || null,
            summary: input.summary || null,
            tags: input.tags || [],
            published_at: input.published_at || null,
            read: false,
            is_favorite: false,
        })
        .select()
        .single();

    if (error) {
        // Check if it's a duplicate URL error
        if (error.code === '23505') {
            // Duplicate URL - fetch and return existing article
            const { data: existing } = await supabase
                .from('tech_watch_articles')
                .select('*')
                .eq('user_id', userId)
                .eq('url', input.url)
                .single();

            return existing;
        }

        console.error('Error creating article:', error);
        return null;
    }

    return data;
}

/**
 * Get articles for a specific user (for automation APIs)
 */
export async function getArticlesForUser(
    userId: string,
    options: {
        limit?: number;
        offset?: number;
        unreadOnly?: boolean;
    } = {}
): Promise<Article[]> {
    const { limit = 50, offset = 0, unreadOnly = false } = options;
    const supabase = getServiceClient();

    let query = supabase
        .from('tech_watch_articles')
        .select('*')
        .eq('user_id', userId)
        .order('collected_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (unreadOnly) {
        query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching articles:', error);
        return [];
    }

    return data || [];
}

/**
 * Update an article for a specific user
 */
export async function updateArticle(
    userId: string,
    articleId: string,
    updates: Partial<Article>
): Promise<boolean> {
    const supabase = getServiceClient();

    const { error } = await supabase
        .from('tech_watch_articles')
        .update(updates)
        .eq('id', articleId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error updating article:', error);
        return false;
    }

    return true;
}

// ============================================
// SOURCE FUNCTIONS (with explicit user_id)
// ============================================

export interface CreateSourceInput {
    type: 'rss' | 'api' | 'manual';
    name: string;
    url?: string;
    config?: Record<string, unknown>;
}

/**
 * Create a new source for a specific user
 */
export async function createSourceForUser(
    userId: string,
    input: CreateSourceInput
): Promise<Source | null> {
    const supabase = getServiceClient();

    const { data, error } = await supabase
        .from('tech_watch_sources')
        .insert({
            user_id: userId,
            type: input.type,
            name: input.name,
            url: input.url || null,
            config: input.config || {},
            enabled: true,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating source:', error);
        return null;
    }

    return data;
}

/**
 * Get sources for a specific user
 */
export async function getSourcesForUser(userId: string): Promise<Source[]> {
    const supabase = getServiceClient();

    const { data, error } = await supabase
        .from('tech_watch_sources')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching sources:', error);
        return [];
    }

    return data || [];
}

/**
 * Update a source for a specific user
 */
export async function updateSourceForUser(
    userId: string,
    sourceId: string,
    updates: Partial<Source>
): Promise<boolean> {
    const supabase = getServiceClient();

    const { error } = await supabase
        .from('tech_watch_sources')
        .update(updates)
        .eq('id', sourceId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error updating source:', error);
        return false;
    }

    return true;
}

/**
 * Delete a source for a specific user
 */
export async function deleteSourceForUser(
    userId: string,
    sourceId: string
): Promise<boolean> {
    const supabase = getServiceClient();

    const { error } = await supabase
        .from('tech_watch_sources')
        .delete()
        .eq('id', sourceId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error deleting source:', error);
        return false;
    }

    return true;
}
