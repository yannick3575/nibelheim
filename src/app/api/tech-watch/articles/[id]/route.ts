import { NextRequest, NextResponse } from 'next/server';
import { getArticle, toggleArticleRead } from '@/lib/tech-watch';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const article = await getArticle(id);

        if (!article) {
            return new NextResponse('Article not found', { status: 404 });
        }

        return NextResponse.json(article);
    } catch (error) {
        console.error('Error in tech-watch/articles/[id] GET:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        if (typeof body.read !== 'boolean') {
            return new NextResponse('Missing or invalid "read" field', { status: 400 });
        }

        const success = await toggleArticleRead(id, body.read);

        if (!success) {
            return new NextResponse('Failed to update article', { status: 500 });
        }

        return NextResponse.json({ success: true, read: body.read });
    } catch (error) {
        console.error('Error in tech-watch/articles/[id] PATCH:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
