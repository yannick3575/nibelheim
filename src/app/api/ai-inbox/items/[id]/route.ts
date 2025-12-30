import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getItem, updateItem, deleteItem } from '@/lib/ai-inbox';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Schema for updating an inbox item
 */
const updateItemSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(500, 'Title must be 500 characters or less')
      .optional(),
    category: z
      .enum(['tools', 'prompts', 'tutorials', 'news', 'inspiration'], {
        message:
          'Category must be tools, prompts, tutorials, news, or inspiration',
      })
      .optional(),
    status: z
      .enum(['unread', 'read', 'archived'], {
        message: 'Status must be unread, read, or archived',
      })
      .optional(),
    is_favorite: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.category !== undefined ||
      data.status !== undefined ||
      data.is_favorite !== undefined ||
      data.tags !== undefined,
    {
      message: 'At least one field must be provided for update',
    }
  );

/**
 * GET /api/ai-inbox/items/[id]
 * Get a single item by ID
 */
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
    const item = await getItem(id);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    logger.error('[ai-inbox/items/id] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai-inbox/items/[id]
 * Update an item
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const validation = updateItemSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues
        .map((issue) => issue.message)
        .join(', ');
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const success = await updateItem(id, validation.data);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update item' },
        { status: 500 }
      );
    }

    logger.log('[ai-inbox/items/id] Updated item:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[ai-inbox/items/id] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai-inbox/items/[id]
 * Delete an item
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const success = await deleteItem(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete item' },
        { status: 500 }
      );
    }

    logger.log('[ai-inbox/items/id] Deleted item:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[ai-inbox/items/id] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
