import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getDiscoverySource,
  updateDiscoverySource,
  deleteDiscoverySource,
} from '@/lib/prompt-discovery';
import { logger } from '@/lib/logger';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/prompt-library/sources/[id]
 * Get a single discovery source
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const source = await getDiscoverySource(id);

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json({ source });
  } catch (error) {
    logger.error('[api/prompt-library/sources/[id]] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch source' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/prompt-library/sources/[id]
 * Update a discovery source
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate URL if provided
    if (body.url) {
      try {
        new URL(body.url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    const source = await updateDiscoverySource(id, {
      name: body.name,
      description: body.description,
      url: body.url,
      source_type: body.source_type,
      category: body.category,
      is_enabled: body.is_enabled,
      priority: body.priority,
    });

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    logger.info('[api/prompt-library/sources/[id]] Updated source:', id);

    return NextResponse.json({ source });
  } catch (error) {
    logger.error('[api/prompt-library/sources/[id]] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update source' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/prompt-library/sources/[id]
 * Delete a discovery source
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await deleteDiscoverySource(id);

    if (!success) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    logger.info('[api/prompt-library/sources/[id]] Deleted source:', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[api/prompt-library/sources/[id]] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete source' },
      { status: 500 }
    );
  }
}
