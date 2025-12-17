import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateSource, deleteSource } from '@/lib/tech-watch';
import { logger } from '@/lib/logger';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

const updateSourceSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    url: z.string().url().optional().or(z.literal('')),
    enabled: z.boolean().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const validation = updateSourceSchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.issues
                .map((issue) => issue.message)
                .join(', ');
            return NextResponse.json(
                { error: 'Validation failed', details: errors },
                { status: 400 }
            );
        }

        const success = await updateSource(id, validation.data);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to update source' },
                { status: 500 }
            );
        }

        logger.log('[tech-watch/sources/id] Updated source:', id);
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('[tech-watch/sources/id] PATCH error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const success = await deleteSource(id);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to delete source' },
                { status: 500 }
            );
        }

        logger.log('[tech-watch/sources/id] Deleted source:', id);
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('[tech-watch/sources/id] DELETE error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
