import { NextResponse } from 'next/server';
import { getLatestDigest } from '@/lib/tech-watch';

export async function GET() {
    try {
        const digest = await getLatestDigest();

        if (!digest) {
            return new NextResponse('Digest not found', { status: 404 });
        }

        return NextResponse.json(digest);
    } catch (error) {
        console.error('Error in tech-watch/latest API:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
