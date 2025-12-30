import { NextResponse } from 'next/server';
import { getFavoriteArticles } from '@/lib/tech-watch';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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
