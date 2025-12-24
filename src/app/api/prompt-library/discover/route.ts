import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { discoverAndSavePrompts } from '@/lib/prompt-discovery';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional: specify source IDs to discover from
    const body = await request.json().catch(() => ({}));
    const sourceIds = body.sourceIds as string[] | undefined;

    logger.info(`[api/prompt-library/discover] Starting discovery for user ${user.id}`, {
      sourceIds: sourceIds?.length ?? 'all',
    });

    const { savedPrompts, errors } = await discoverAndSavePrompts(user.id, sourceIds);

    return NextResponse.json({
      success: true,
      count: savedPrompts.length,
      prompts: savedPrompts,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.error('[api/prompt-library/discover] Error:', error);
    return NextResponse.json({
      error: 'Failed to discover prompts',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
