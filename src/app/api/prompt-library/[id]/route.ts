import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrompt, updatePrompt, deletePrompt } from '@/lib/prompt-library';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { withUserRateLimit } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const updatePromptSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(1).max(50000, 'Content too long (max 50KB)').optional(),
    category: z.enum(['coding', 'writing', 'analysis', 'creative', 'other']).optional(),
    tags: z
      .array(z.string().min(1).max(50, 'Tag too long').trim())
      .max(20, 'Too many tags (max 20)')
      .optional(),
    is_favorite: z.boolean().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const prompt = await getPrompt(id);

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    return NextResponse.json(prompt);
  } catch (error) {
    logger.error('[prompt-library/id] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResponse = await withUserRateLimit(user.id, 'default');
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = updatePromptSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const prompt = await updatePrompt(id, validation.data);

    if (!prompt) {
      return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
    }

    logger.log('[prompt-library/id] Updated prompt:', id);
    return NextResponse.json(prompt);
  } catch (error) {
    logger.error('[prompt-library/id] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResponse = await withUserRateLimit(user.id, 'default');
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const success = await deletePrompt(id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 });
    }

    logger.log('[prompt-library/id] Deleted prompt:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[prompt-library/id] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
