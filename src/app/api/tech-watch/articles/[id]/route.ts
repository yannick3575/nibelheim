import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getArticle, toggleArticleRead, toggleArticleFavorite } from '@/lib/tech-watch';
import { logger } from '@/lib/logger';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

const updateArticleSchema = z.object({
    read: z.boolean().optional(),
    is_favorite: z.boolean().optional(),
}).refine(data => data.read !== undefined || data.is_favorite !== undefined, {
    message: 'At least one field (read or is_favorite) must be provided',
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

        const { read, is_favorite } = validation.data;
        const result: { success: boolean; read?: boolean; is_favorite?: boolean } = { success: true };

        // Update read status if provided
        if (read !== undefined) {
            const success = await toggleArticleRead(id, read);
            if (!success) {
                return NextResponse.json(
                    { error: 'Failed to update article read status' },
                    { status: 500 }
                );
            }
            result.read = read;
            logger.log('[tech-watch/articles/id] Updated article read status:', id, read);
        }

        // Update favorite status if provided
        if (is_favorite !== undefined) {
            const success = await toggleArticleFavorite(id, is_favorite);
            if (!success) {
                return NextResponse.json(
                    { error: 'Failed to update article favorite status' },
                    { status: 500 }
                );
            }
            result.is_favorite = is_favorite;
            logger.log('[tech-watch/articles/id] Updated article favorite status:', id, is_favorite);
        }

        return NextResponse.json(result);
    } catch (error) {
        logger.error('[tech-watch/articles/id] PATCH error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
