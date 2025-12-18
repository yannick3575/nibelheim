import { NextResponse } from 'next/server';
import { getFavoriteArticles } from '@/lib/tech-watch';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        const articles = await getFavoriteArticles();
        return NextResponse.json(articles);
    } catch (error) {
        logger.error('[tech-watch/favorites] GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
