import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { discoverAndSavePrompts } from '@/lib/prompt-discovery';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info(`[api/prompt-library/discover] Starting discovery for user ${user.id}`);
    
    const discovered = await discoverAndSavePrompts(user.id);

    return NextResponse.json({ 
      success: true, 
      count: discovered.length,
      prompts: discovered 
    });
  } catch (error) {
    logger.error('[api/prompt-library/discover] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to discover prompts',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
