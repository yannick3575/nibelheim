import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAllDiscoverySources,
  createDiscoverySource,
} from '@/lib/prompt-discovery';
import { logger } from '@/lib/logger';

/**
 * GET /api/prompt-library/sources
 * List all discovery sources
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sources = await getAllDiscoverySources();

    return NextResponse.json({ sources });
  } catch (error) {
    logger.error('[api/prompt-library/sources] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prompt-library/sources
 * Create a new discovery source
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const source = await createDiscoverySource({
      name: body.name,
      description: body.description,
      url: body.url,
      source_type: body.source_type,
      category: body.category,
      priority: body.priority,
    });

    if (!source) {
      return NextResponse.json(
        { error: 'Failed to create source' },
        { status: 500 }
      );
    }

    logger.info('[api/prompt-library/sources] Created source:', source.id);

    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    logger.error('[api/prompt-library/sources] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create source' },
      { status: 500 }
    );
  }
}
