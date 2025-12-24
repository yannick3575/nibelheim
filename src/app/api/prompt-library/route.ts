import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrompts, createPrompt } from '@/lib/prompt-library';
import type { PromptCategory, PromptStatus } from '@/lib/prompt-library/types';
import { logger } from '@/lib/logger';

const createPromptSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(50000, 'Content too long (max 50KB)'),
  category: z.enum(['coding', 'writing', 'analysis', 'creative', 'other']),
  tags: z
    .array(z.string().min(1).max(50, 'Tag too long').trim())
    .max(20, 'Too many tags (max 20)')
    .optional(),
  is_favorite: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: {
      category?: PromptCategory;
      tags?: string[];
      favorites?: boolean;
      search?: string;
      status?: PromptStatus | 'all';
    } = {};

    const category = searchParams.get('category');
    if (category) filters.category = category as PromptCategory;

    const tags = searchParams.get('tags');
    if (tags) filters.tags = tags.split(',');

    const favorites = searchParams.get('favorites');
    if (favorites === 'true') filters.favorites = true;

    const search = searchParams.get('search');
    if (search) filters.search = search;

    const status = searchParams.get('status');
    if (status) filters.status = status as PromptStatus | 'all';

    const prompts = await getPrompts(filters);
    const response = NextResponse.json(prompts);
    // Cache for 2 minutes, allow stale for 30 minutes while revalidating
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=1800');
    return response;
  } catch (error) {
    logger.error('[prompt-library] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createPromptSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const prompt = await createPrompt(validation.data);

    if (!prompt) {
      return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
    }

    logger.log('[prompt-library] Created prompt:', prompt.id);
    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    logger.error('[prompt-library] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
