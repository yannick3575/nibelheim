import { NextRequest, NextResponse } from 'next/server';
import { updateSource, deleteSource } from '@/lib/tech-watch';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const success = await updateSource(id, body);

        if (!success) {
            return new NextResponse('Failed to update source', { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in tech-watch/sources/[id] PATCH:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const success = await deleteSource(id);

        if (!success) {
            return new NextResponse('Failed to delete source', { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in tech-watch/sources/[id] DELETE:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
