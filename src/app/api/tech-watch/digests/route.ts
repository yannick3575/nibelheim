import { NextResponse } from 'next/server';
import { getDigests } from '@/lib/tech-watch';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        const digests = await getDigests();
        return NextResponse.json(digests);
    } catch (error) {
        logger.error('[tech-watch/digests] GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
