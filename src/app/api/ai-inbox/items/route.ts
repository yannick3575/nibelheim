import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getItems, createItem, getSettings } from '@/lib/ai-inbox';
import { analyzeItem, DEFAULT_USER_PROFILE } from '@/lib/ai-inbox-gemini';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractUrlContent } from '@/lib/scraper';
import { getYouTubeTranscript } from '@/lib/youtube';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ItemFilters, Item, UserProfile } from '@/types/ai-inbox';

/**
 * Schema for creating a new inbox item
 */
const createItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be 500 characters or less'),
  url: z.string().url('Invalid URL format').optional().or(z.literal('')),
  source_type: z
    .enum(['youtube', 'substack', 'manual', 'other'], {
      message: 'Source type must be youtube, substack, manual, or other',
    })
    .optional(),
  category: z
    .enum(['tools', 'prompts', 'tutorials', 'news', 'inspiration'], {
      message:
        'Category must be tools, prompts, tutorials, news, or inspiration',
    })
    .optional(),
  raw_content: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * GET /api/ai-inbox/items
 * List items with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters: ItemFilters = {};

    const status = searchParams.get('status');
    if (status && ['unread', 'read', 'archived'].includes(status)) {
      filters.status = status as ItemFilters['status'];
    }

    const category = searchParams.get('category');
    if (
      category &&
      ['tools', 'prompts', 'tutorials', 'news', 'inspiration'].includes(
        category
      )
    ) {
      filters.category = category as ItemFilters['category'];
    }

    const source_type = searchParams.get('source_type');
    if (
      source_type &&
      ['youtube', 'substack', 'manual', 'other'].includes(source_type)
    ) {
      filters.source_type = source_type as ItemFilters['source_type'];
    }

    const favorite = searchParams.get('favorite');
    if (favorite === 'true') {
      filters.favorite = true;
    }

    const limit = searchParams.get('limit');
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
        filters.limit = limitNum;
      }
    }

    const offset = searchParams.get('offset');
    if (offset) {
      const offsetNum = parseInt(offset, 10);
      if (!isNaN(offsetNum) && offsetNum >= 0) {
        filters.offset = offsetNum;
      }
    }

    const items = await getItems(filters);
    return NextResponse.json(items);
  } catch (error) {
    logger.error('[ai-inbox/items] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-inbox/items
 * Create a new inbox item
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = createItemSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues
        .map((issue) => issue.message)
        .join(', ');
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { title, url, source_type, category, raw_content, tags } =
      validation.data;

    const item = await createItem({
      title,
      url: url || undefined,
      source_type,
      category,
      raw_content,
      tags,
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Failed to create item. URL may already exist.' },
        { status: 500 }
      );
    }

    logger.log('[ai-inbox/items] Created item:', item.id);

    const settings = await getSettings();
    const userProfile = settings?.profile || DEFAULT_USER_PROFILE;
    const analysisPromise = triggerAsyncAnalysis(item, userProfile, supabase);

    // Use request.waitUntil to ensure async analysis completes in serverless environments
    if ((request as any).waitUntil) {
      (request as any).waitUntil(
        analysisPromise.catch((err) => {
          logger.error('[ai-inbox/items] Async analysis failed:', err);
        })
      );
    } else {
      // Fallback for environments without waitUntil - still fire and forget but log it
      logger.warn('[ai-inbox/items] request.waitUntil not available, analysis might be interrupted');
      analysisPromise.catch((err) => {
        logger.error('[ai-inbox/items] Async analysis failed (fallback):', err);
      });
    }

    return NextResponse.json(item);
  } catch (error) {
    logger.error('[ai-inbox/items] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Trigger async AI analysis for a newly created item
 * This runs in the background without blocking the HTTP response
 */
async function triggerAsyncAnalysis(
  item: Item,
  userProfile: UserProfile,
  supabaseUserClient?: SupabaseClient
): Promise<void> {
  const logPrefix = `[ai-inbox/items][analysis][${item.id}]`;

  // Prefer service role if available, otherwise fall back to the current user's session client
  const userClientHasFrom =
    supabaseUserClient && typeof (supabaseUserClient as any).from === 'function';
  let supabaseWriter: SupabaseClient | null = userClientHasFrom
    ? supabaseUserClient
    : null;
  try {
    supabaseWriter = createAdminClient();
  } catch (error) {
    logger.warn(
      `${logPrefix} Admin client unavailable (missing SUPABASE_SERVICE_ROLE_KEY?). Falling back to user session.`,
      error
    );
  }

  if (!supabaseWriter) {
    logger.error(`${logPrefix} No Supabase client available for analysis. Skipping update.`);
    return;
  }

  try {
    logger.log(`${logPrefix} Starting async analysis`);

    // ATTEMPT CONTENT EXTRACTION: 
    // 1. If YouTube, try to get transcript
    // 2. Otherwise (or if transcript fails), try Jina Reader scraping
    let currentItem = { ...item };
    if (item.url && !item.raw_content) {
      let extracted: string | null = null;
      const isYouTube = item.url.includes('youtube.com') || item.url.includes('youtu.be');

      if (isYouTube) {
        logger.log(`${logPrefix} Attempting YouTube transcript fetch`);
        extracted = await getYouTubeTranscript(item.url);
        if (extracted) {
          logger.log(`${logPrefix} Obtained YouTube transcript (${extracted.length} chars)`);
        } else {
          logger.warn(`${logPrefix} YouTube transcript not available`);
        }
      }

      // Fallback to Jina Reader if not YouTube or if transcript failed
      if (!extracted) {
        logger.log(`${logPrefix} Attempting Jina scraping`);
        extracted = await extractUrlContent(item.url);
        if (extracted) {
          logger.log(`${logPrefix} Updated raw_content via Jina scraping (${extracted.length} chars)`);
        } else {
          logger.warn(`${logPrefix} Jina scraping failed`);
        }
      }

      if (extracted) {
        // Update database with extracted content using Admin Client
        const { error: updateError } = await supabaseWriter
          .from('ai_inbox_items')
          .update({ raw_content: extracted })
          .eq('id', item.id);

        if (!updateError) {
          currentItem.raw_content = extracted;
          logger.log(`${logPrefix} Saved extracted content to database`);
        } else {
          logger.error(`${logPrefix} Failed to save extracted content:`, updateError);
        }
      }
    }

    // Run Gemini analysis
    logger.log(`${logPrefix} Starting Gemini analysis`);
    const analysis = await analyzeItem(currentItem, userProfile);

    if (analysis) {
      // Update item with analysis results using Admin Client
      const { error: saveError } = await supabaseWriter
        .from('ai_inbox_items')
        .update({ ai_analysis: analysis })
        .eq('id', item.id);

      if (!saveError) {
        logger.log(`${logPrefix} Analysis saved successfully`);
      } else {
        logger.error(`${logPrefix} Failed to save analysis to database:`, saveError);
      }
    } else {
      logger.warn(`${logPrefix} No analysis returned from Gemini`);

      // FALLBACK: Update with a "Failure" content
      await supabaseWriter.from('ai_inbox_items').update({
        ai_analysis: {
          summary: "L'analyse automatique a échoué (timeout ou erreur de l'IA).",
          actionability: 1,
          complexity: 1,
          project_ideas: ["Veuillez réessayer manuellement l'analyse."],
          relevance_to_profile: "Analyse indisponible.",
          suggested_category: item.category,
          suggested_tags: item.tags || []
        }
      }).eq('id', item.id);
    }
  } catch (error) {
    logger.error(`${logPrefix} Error in async analysis flow:`, error);

    // Ensure we don't leave the item in a "stuck" state if possible
    try {
      await supabaseWriter.from('ai_inbox_items').update({
        ai_analysis: {
          summary: "Erreur critique lors de l'analyse en arrière-plan.",
          actionability: 1,
          complexity: 1,
          project_ideas: [],
          relevance_to_profile: "Erreur technique.",
          suggested_category: item.category,
          suggested_tags: item.tags || []
        }
      }).eq('id', item.id);
    } catch (innerError) {
      logger.error(`${logPrefix} Failed to save final error state:`, innerError);
    }
  }
}
