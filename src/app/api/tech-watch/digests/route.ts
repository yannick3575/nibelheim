import { NextResponse } from 'next/server';
import { getDigests } from '@/lib/tech-watch';

export async function GET() {
    try {
        const digests = await getDigests();
        return NextResponse.json(digests);
    } catch (error) {
        console.error('Error in tech-watch/digests API:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
