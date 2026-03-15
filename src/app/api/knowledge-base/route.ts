import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getKBEntries, createKBEntry } from '@/lib/knowledge-base';
import { withUserRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import type { KBCategory, KBEntryType } from '@/lib/knowledge-base/types';

const createEntrySchema = z.object({
  type: z.enum(['note', 'bookmark', 'snippet']),
  title: z.string().min(1, 'Title is required').max(300),
  content: z.string().max(100000, 'Content too long').default(''),
  source_url: z.string().url().optional(),
  source_title: z.string().max(300).optional(),
  code_language: z.string().max(50).optional(),
  category: z.enum(['general', 'engineering', 'research', 'reference', 'personal']).optional(),
  tags: z.array(z.string().min(1).max(50).trim()).max(20).optional(),
  is_favorite: z.boolean().optional(),
});

const getQuerySchema = z.object({
  type: z.enum(['note', 'bookmark', 'snippet']).optional(),
  category: z.enum(['general', 'engineering', 'research', 'reference', 'personal']).optional(),
  favorites: z.enum(['true']).optional(),
  search: z.string().max(200).optional(),
  tags: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResponse = await withUserRateLimit(user.id, 'readonly');
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const rawParams: Record<string, string | undefined> = {};
    for (const key of ['type', 'category', 'favorites', 'search', 'tags'] as const) {
      rawParams[key] = searchParams.get(key) ?? undefined;
    }

    const validation = getQuerySchema.safeParse(rawParams);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    const q = validation.data;
    const filters: {
      type?: KBEntryType;
      category?: KBCategory;
      favorites?: boolean;
      search?: string;
      tags?: string[];
    } = {};

    if (q.type) filters.type = q.type;
    if (q.category) filters.category = q.category;
    if (q.favorites === 'true') filters.favorites = true;
    if (q.search) filters.search = q.search;
    if (q.tags) filters.tags = q.tags.split(',').filter(Boolean);

    const entries = await getKBEntries(filters);
    const response = NextResponse.json(entries);
    response.headers.set('Cache-Control', 'private, no-cache');
    return response;
  } catch (error) {
    logger.error('[knowledge-base] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResponse = await withUserRateLimit(user.id, 'default');
    if (rateLimitResponse) return rateLimitResponse;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = createEntrySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const entry = await createKBEntry(validation.data);
    if (!entry) {
      return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
    }

    logger.log('[knowledge-base] Created entry:', entry.id, entry.type);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    logger.error('[knowledge-base] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
