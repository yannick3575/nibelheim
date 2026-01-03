import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getItems, createItem, getSettings, updateItem } from '@/lib/ai-inbox';
import { analyzeItem, DEFAULT_USER_PROFILE } from '@/lib/ai-inbox-gemini';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { extractUrlContent } from '@/lib/scraper';
import { getYouTubeTranscript } from '@/lib/youtube';
import type { ItemFilters, Item } from '@/types/ai-inbox';

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

    // Fire-and-forget: trigger async analysis without blocking the response
    triggerAsyncAnalysis(item).catch((err) => {
      logger.error('[ai-inbox/items] Async analysis failed:', err);
    });

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
async function triggerAsyncAnalysis(item: Item): Promise<void> {
  try {
    logger.log('[ai-inbox/items] Starting async analysis for item:', item.id);

    // Get user settings for personalized analysis
    const settings = await getSettings();
    const userProfile = settings?.profile || DEFAULT_USER_PROFILE;

    // ATTEMPT CONTENT EXTRACTION: 
    // 1. If YouTube, try to get transcript
    // 2. Otherwise (or if transcript fails), try Jina Reader scraping
    let currentItem = { ...item };
    if (item.url && !item.raw_content) {
      let extracted: string | null = null;

      const isYouTube = item.url.includes('youtube.com') || item.url.includes('youtu.be');

      if (isYouTube) {
        extracted = await getYouTubeTranscript(item.url);
        if (extracted) {
          logger.log('[ai-inbox/items] Successfully obtained YouTube transcript');
        }
      }

      // Fallback to Jina Reader if not YouTube or if transcript failed
      if (!extracted) {
        extracted = await extractUrlContent(item.url);
        if (extracted) {
          logger.log('[ai-inbox/items] Successfully updated raw_content via Jina scraping');
        }
      }

      if (extracted) {
        // Update database with extracted content
        const updateSuccess = await updateItem(item.id, { raw_content: extracted });
        if (updateSuccess) {
          currentItem.raw_content = extracted;
        }
      }
    }

    // Run Gemini analysis (now with more content if scraping succeeded)
    const analysis = await analyzeItem(currentItem, userProfile);

    if (analysis) {
      // Update item with analysis results
      const success = await updateItem(item.id, { ai_analysis: analysis });

      if (success) {
        logger.log('[ai-inbox/items] Analysis saved for item:', item.id);
      } else {
        logger.error('[ai-inbox/items] Failed to save analysis for item:', item.id);
      }
    } else {
      logger.log('[ai-inbox/items] No analysis returned for item:', item.id);
    }
  } catch (error) {
    logger.error('[ai-inbox/items] Error in async analysis:', error);
    throw error;
  }
}
