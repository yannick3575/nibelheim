import { createClient } from '@/lib/supabase/server';

// ============================================
// TYPES
// ============================================

export interface Article {
    id: string;
    user_id: string;
    title: string;
    url: string;
    source: string;
    content: string | null;
    summary: string | null;
    tags: string[];
    published_at: string | null;
    collected_at: string;
    read: boolean;
    is_favorite: boolean;
}

export interface Digest {
    id: string;
    user_id: string;
    period_start: string;
    period_end: string;
    summary: string;
    key_topics: string[];
    article_ids: string[];
    created_at: string;
}

export interface DigestWithArticles extends Digest {
    articles: Article[];
}

export interface DigestMeta {
    id: string;
    date: string;
    article_count: number;
}

// ============================================
// DIGEST FUNCTIONS
// ============================================

/**
 * Get the latest digest with its articles
 * Note: Uses 2 queries due to article_ids array storage. For true single-query,
 * consider using a junction table with foreign keys.
 */
export async function getLatestDigest(): Promise<DigestWithArticles | null> {
    const supabase = await createClient();

    // Select only needed columns instead of *
    const { data: digest, error } = await supabase
        .from('tech_watch_digests')
        .select('id, user_id, period_start, period_end, summary, key_topics, article_ids, created_at')
        .order('period_start', { ascending: false })
        .limit(1)
        .single();

    if (error || !digest) {
        console.error('Error fetching latest digest:', error);
        return null;
    }

    // Fetch related articles with specific columns (excluding large content field for list view)
    const articles = await getArticlesByIds(digest.article_ids || []);

    return { ...digest, articles };
}

/**
 * Get a digest by date (YYYY-MM-DD format)
 * Note: Uses 2 queries due to article_ids array storage. For true single-query,
 * consider using a junction table with foreign keys.
 */
export async function getDigestByDate(date: string): Promise<DigestWithArticles | null> {
    const supabase = await createClient();

    const periodStart = `${date}T00:00:00`;
    const periodEnd = `${date}T23:59:59`;

    // Select only needed columns instead of *
    const { data: digest, error } = await supabase
        .from('tech_watch_digests')
        .select('id, user_id, period_start, period_end, summary, key_topics, article_ids, created_at')
        .gte('period_start', periodStart)
        .lte('period_end', periodEnd)
        .single();

    if (error || !digest) {
        return null;
    }

    const articles = await getArticlesByIds(digest.article_ids || []);

    return { ...digest, articles };
}

/**
 * Get all digests metadata (for history list)
 */
export async function getDigests(limit = 30): Promise<DigestMeta[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tech_watch_digests')
        .select('id, period_start, article_ids')
        .order('period_start', { ascending: false })
        .limit(limit);

    if (error || !data) {
        console.error('Error fetching digests:', error);
        return [];
    }

    return data.map(d => ({
        id: d.id,
        date: d.period_start.split('T')[0],
        article_count: d.article_ids?.length || 0
    }));
}

// ============================================
// ARTICLE FUNCTIONS
// ============================================

/**
 * Get articles by their IDs
 * Selects specific columns to reduce payload size
 */
export async function getArticlesByIds(ids: string[]): Promise<Article[]> {
    if (!ids || ids.length === 0) return [];

    const supabase = await createClient();

    // Select specific columns - content is large and often not needed in list views
    const { data, error } = await supabase
        .from('tech_watch_articles')
        .select('id, user_id, title, url, source, content, summary, tags, published_at, collected_at, read, is_favorite')
        .in('id', ids)
        .order('collected_at', { ascending: false });

    if (error) {
        console.error('Error fetching articles:', error);
        return [];
    }

    return data || [];
}

/**
 * Get all articles with optional pagination
 */
export async function getArticles(limit = 50, offset = 0): Promise<Article[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tech_watch_articles')
        .select('*')
        .order('collected_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching articles:', error);
        return [];
    }

    return data || [];
}

/**
 * Get a single article by ID
 */
export async function getArticle(id: string): Promise<Article | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tech_watch_articles')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching article:', error);
        return null;
    }

    return data;
}

/**
 * Toggle article read status
 */
export async function toggleArticleRead(id: string, read: boolean): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('tech_watch_articles')
        .update({ read })
        .eq('id', id);

    if (error) {
        console.error('Error updating article read status:', error);
        return false;
    }

    return true;
}

/**
 * Toggle article favorite status
 */
export async function toggleArticleFavorite(id: string, is_favorite: boolean): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('tech_watch_articles')
        .update({ is_favorite })
        .eq('id', id);

    if (error) {
        console.error('Error updating article favorite status:', error);
        return false;
    }

    return true;
}

/**
 * Get all favorite articles for the current user
 */
export async function getFavoriteArticles(): Promise<Article[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tech_watch_articles')
        .select('*')
        .eq('is_favorite', true)
        .order('collected_at', { ascending: false });

    if (error) {
        console.error('Error fetching favorite articles:', error);
        return [];
    }

    return data || [];
}

// ============================================
// SOURCE FUNCTIONS
// ============================================

export interface Source {
    id: string;
    user_id: string;
    type: 'rss' | 'api' | 'manual';
    name: string;
    url: string | null;
    config: Record<string, unknown>;
    enabled: boolean;
    last_fetched_at: string | null;
    created_at: string;
}

/**
 * Get all sources for the current user
 */
export async function getSources(): Promise<Source[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tech_watch_sources')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching sources:', error);
        return [];
    }

    return data || [];
}

/**
 * Create a new source
 */
export async function createSource(source: {
    type: Source['type'];
    name: string;
    url?: string;
    config?: Record<string, unknown>;
}): Promise<Source | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('tech_watch_sources')
        .insert({
            user_id: user.id,
            type: source.type,
            name: source.name,
            url: source.url || null,
            config: source.config || {},
            enabled: true
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
 * Update a source
 */
export async function updateSource(id: string, updates: Partial<Source>): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('tech_watch_sources')
        .update(updates)
        .eq('id', id);

    if (error) {
        console.error('Error updating source:', error);
        return false;
    }

    return true;
}

/**
 * Delete a source
 */
export async function deleteSource(id: string): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('tech_watch_sources')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting source:', error);
        return false;
    }

    return true;
}
