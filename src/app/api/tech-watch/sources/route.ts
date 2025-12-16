import { NextRequest, NextResponse } from 'next/server';
import { getSources, createSource } from '@/lib/tech-watch';

export async function GET() {
    try {
        const sources = await getSources();
        return NextResponse.json(sources);
    } catch (error) {
        console.error('Error in tech-watch/sources GET:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.name || !body.type) {
            return new NextResponse('Missing required fields: name, type', { status: 400 });
        }

        const source = await createSource({
            type: body.type,
            name: body.name,
            url: body.url,
            config: body.config
        });

        if (!source) {
            return new NextResponse('Failed to create source', { status: 500 });
        }

        return NextResponse.json(source);
    } catch (error) {
        console.error('Error in tech-watch/sources POST:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
