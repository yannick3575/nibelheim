import { NextRequest, NextResponse } from 'next/server';
import { getItem, getSettings, updateItem } from '@/lib/ai-inbox';
import { analyzeItem, DEFAULT_USER_PROFILE } from '@/lib/ai-inbox-gemini';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { extractUrlContent } from '@/lib/scraper';
import { getYouTubeTranscript } from '@/lib/youtube';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/ai-inbox/analyze/[id]
 * Trigger AI analysis for an item
 *
 * This endpoint allows users to manually trigger or re-trigger AI analysis
 * for a specific inbox item.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify item exists and belongs to user
    const item = await getItem(id);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    logger.log('[ai-inbox/analyze] Analysis triggered for item:', id);

    // Get user settings for personalized analysis
    const settings = await getSettings();
    const userProfile = settings?.profile || DEFAULT_USER_PROFILE;

    // ATTEMPT CONTENT EXTRACTION: 
    // If URL exists but no raw_content, try to extract it before analysis
    let currentItem = { ...item };
    if (item.url && !item.raw_content) {
      let extracted: string | null = null;

      const isYouTube = item.url.includes('youtube.com') || item.url.includes('youtu.be');

      if (isYouTube) {
        extracted = await getYouTubeTranscript(item.url);
      }

      if (!extracted) {
        extracted = await extractUrlContent(item.url);
      }

      if (extracted) {
        const updateSuccess = await updateItem(id, { raw_content: extracted });
        if (updateSuccess) {
          currentItem.raw_content = extracted;
        }
      }
    }

    // Run Gemini analysis
    logger.log(`[ai-inbox/analyze][${id}] Starting Gemini analysis`);
    const analysis = await analyzeItem(currentItem, userProfile);

    if (!analysis) {
      logger.error(`[ai-inbox/analyze][${id}] Gemini analysis failed`);
      return NextResponse.json(
        { error: "L'analyse AI a échoué (timeout ou erreur). Veuillez réessayer." },
        { status: 500 }
      );
    }

    // Update item with analysis results
    const success = await updateItem(id, { ai_analysis: analysis });

    if (!success) {
      logger.error(`[ai-inbox/analyze][${id}] Failed to save analysis to database`);
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde des résultats.' },
        { status: 500 }
      );
    }

    logger.log(`[ai-inbox/analyze][${id}] Analysis completed successfully`);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    logger.error(`[ai-inbox/analyze] POST error:`, error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
