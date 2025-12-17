import { NextResponse } from 'next/server';
import { getLatestDigest } from '@/lib/tech-watch';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        const digest = await getLatestDigest();

        if (!digest) {
            return NextResponse.json(
                { error: 'Digest not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(digest);
    } catch (error) {
        logger.error('[tech-watch/latest] GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
