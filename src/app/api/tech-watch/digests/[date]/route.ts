import { NextRequest, NextResponse } from 'next/server';
import { getDigestByDate } from '@/lib/tech-watch';
import { logger } from '@/lib/logger';

interface RouteParams {
    params: Promise<{
        date: string;
    }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { date } = await params;

        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json(
                { error: 'Invalid date format. Use YYYY-MM-DD' },
                { status: 400 }
            );
        }

        const digest = await getDigestByDate(date);

        if (!digest) {
            return NextResponse.json(
                { error: 'Digest not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(digest);
    } catch (error) {
        logger.error('[tech-watch/digests/date] GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
