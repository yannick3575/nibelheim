import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getArticle, toggleArticleRead } from '@/lib/tech-watch';
import { logger } from '@/lib/logger';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

const updateArticleSchema = z.object({
    read: z.boolean({ error: 'read must be a boolean' }),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const article = await getArticle(id);

        if (!article) {
            return NextResponse.json(
                { error: 'Article not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(article);
    } catch (error) {
        logger.error('[tech-watch/articles/id] GET error:', error);
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

        const validation = updateArticleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { read } = validation.data;
        const success = await toggleArticleRead(id, read);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to update article' },
                { status: 500 }
            );
        }

        logger.log('[tech-watch/articles/id] Updated article read status:', id, read);
        return NextResponse.json({ success: true, read });
    } catch (error) {
        logger.error('[tech-watch/articles/id] PATCH error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
