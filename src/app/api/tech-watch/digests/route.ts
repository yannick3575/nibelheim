import { NextResponse } from 'next/server';
import { getDigests } from '@/lib/tech-watch';
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

        const digests = await getDigests();
        const response = NextResponse.json(digests);
        // Cache for 5 minutes, allow stale for 1 hour while revalidating
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
        return response;
    } catch (error) {
        logger.error('[tech-watch/digests] GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
