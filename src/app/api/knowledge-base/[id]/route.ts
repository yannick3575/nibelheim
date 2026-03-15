import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getKBEntry, updateKBEntry, deleteKBEntry } from '@/lib/knowledge-base';
import { withUserRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateEntrySchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    content: z.string().max(100000).optional(),
    source_url: z.string().url().nullable().optional(),
    source_title: z.string().max(300).nullable().optional(),
    code_language: z.string().max(50).nullable().optional(),
    category: z.enum(['general', 'engineering', 'research', 'reference', 'personal']).optional(),
    tags: z.array(z.string().min(1).max(50).trim()).max(20).optional(),
    is_favorite: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const entry = await getKBEntry(id);
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(entry);
  } catch (error) {
    logger.error('[knowledge-base/id] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResponse = await withUserRateLimit(user.id, 'default');
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = updateEntrySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const entry = await updateKBEntry(id, validation.data);
    if (!entry) return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });

    logger.log('[knowledge-base/id] Updated entry:', id);
    return NextResponse.json(entry);
  } catch (error) {
    logger.error('[knowledge-base/id] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResponse = await withUserRateLimit(user.id, 'default');
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;

    // Verify entry exists before deleting
    const entry = await getKBEntry(id);
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const success = await deleteKBEntry(id);
    if (!success) return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });

    logger.log('[knowledge-base/id] Deleted entry:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[knowledge-base/id] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
