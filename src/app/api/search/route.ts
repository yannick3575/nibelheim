import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { hybridSearch } from '@/lib/search';
import { withUserRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const searchQuerySchema = z.object({
  q: z.string().min(1).max(500),
  limit: z.coerce.number().min(1).max(20).optional().default(10),
  source: z.enum(['all', 'kb', 'tech_watch']).optional().default('all'),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limit with 'ai' tier since this calls Gemini for query embedding
    const rateLimitResponse = await withUserRateLimit(user.id, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const validation = searchQuerySchema.safeParse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit'),
      source: searchParams.get('source'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid search query', details: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { q, limit, source } = validation.data;
    const results = await hybridSearch(q, limit, {
      kbOnly: source === 'kb',
      twOnly: source === 'tech_watch',
    });

    return NextResponse.json(results);
  } catch (error) {
    logger.error('[search] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
