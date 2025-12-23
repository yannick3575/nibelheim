import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getConversation,
  updateConversation,
  deleteConversation,
} from '@/lib/stochastic-lab';
import type { UpdateConversationInput } from '@/lib/stochastic-lab/types';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Simplified schema - deep validation happens on the frontend
const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
        timestamp: z.string(),
        simulation: z.any().optional(),
      })
    )
    .optional(),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const conversation = await getConversation(id);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    logger.error('[stochastic-lab] GET conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = updateConversationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const conversation = await updateConversation(id, validation.data as UpdateConversationInput);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Failed to update conversation' },
        { status: 500 }
      );
    }

    logger.log('[stochastic-lab] Updated conversation:', id);
    return NextResponse.json(conversation);
  } catch (error) {
    logger.error('[stochastic-lab] PATCH conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const success = await deleteConversation(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      );
    }

    logger.log('[stochastic-lab] Deleted conversation:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[stochastic-lab] DELETE conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
