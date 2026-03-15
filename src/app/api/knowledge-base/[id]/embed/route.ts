import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { regenerateEmbedding } from '@/lib/knowledge-base';
import { withUserRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResponse = await withUserRateLimit(user.id, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const success = await regenerateEmbedding(id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
    }

    logger.log('[knowledge-base/embed] Regenerated embedding for:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[knowledge-base/id/embed] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
