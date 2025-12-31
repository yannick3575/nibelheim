import { NextResponse } from 'next/server';
import { getLatestDigest } from '@/lib/tech-watch';
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

        const digest = await getLatestDigest();

        if (!digest) {
            return NextResponse.json(
                { error: 'Digest not found' },
                { status: 404 }
            );
        }

        const response = NextResponse.json(digest);
        // Cache for 5 minutes, allow stale for 1 hour while revalidating
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
        return response;
    } catch (error) {
        logger.error('[tech-watch/latest] GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
