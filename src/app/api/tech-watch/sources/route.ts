import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSources, createSource } from '@/lib/tech-watch';
import { logger } from '@/lib/logger';

/**
 * Schema for creating a new source
 */
const createSourceSchema = z.object({
    type: z.enum(['rss', 'api', 'manual'], {
        message: 'Type must be rss, api, or manual',
    }),
    name: z
        .string()
        .min(1, 'Name is required')
        .max(100, 'Name must be 100 characters or less'),
    url: z.string().url('Invalid URL format').optional().or(z.literal('')),
    config: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
    try {
        const sources = await getSources();
        return NextResponse.json(sources);
    } catch (error) {
        logger.error('[tech-watch/sources] GET error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sources' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input with Zod
        const validation = createSourceSchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.issues
                .map((issue) => issue.message)
                .join(', ');
            return NextResponse.json(
                { error: 'Validation failed', details: errors },
                { status: 400 }
            );
        }

        const { type, name, url, config } = validation.data;

        const source = await createSource({
            type,
            name,
            url: url || undefined,
            config,
        });

        if (!source) {
            return NextResponse.json(
                { error: 'Failed to create source' },
                { status: 500 }
            );
        }

        logger.log('[tech-watch/sources] Created source:', source.id);
        return NextResponse.json(source);
    } catch (error) {
        logger.error('[tech-watch/sources] POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
