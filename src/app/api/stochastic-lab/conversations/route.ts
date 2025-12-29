import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getConversations, createConversation } from '@/lib/stochastic-lab';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await getConversations();

    const response = NextResponse.json(conversations);
    response.headers.set(
      'Cache-Control',
      'private, s-maxage=60, stale-while-revalidate=300'
    );
    return response;
  } catch (error) {
    logger.error('[stochastic-lab] GET conversations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createConversationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const conversation = await createConversation(validation.data);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    logger.log('[stochastic-lab] Created conversation:', conversation.id);
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    logger.error('[stochastic-lab] POST conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
