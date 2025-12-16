import { NextRequest, NextResponse } from 'next/server';
import { getDigestByDate } from '@/lib/tech-watch';

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
            return new NextResponse('Invalid date format. Use YYYY-MM-DD', { status: 400 });
        }

        const digest = await getDigestByDate(date);

        if (!digest) {
            return new NextResponse('Digest not found', { status: 404 });
        }

        return NextResponse.json(digest);
    } catch (error) {
        console.error('Error in tech-watch/digests/[date] API:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
