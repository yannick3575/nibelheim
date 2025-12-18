import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateApiToken, hasScope, logAutomationAction } from '@/lib/api-auth';
import { createArticle, getArticlesForUser } from '@/lib/tech-watch-automation';
import { logger } from '@/lib/logger';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createArticleSchema = z.object({
    title: z.string().min(1).max(500),
    url: z.string().url(),
    source: z.string().min(1).max(100),
    content: z.string().optional(),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional(),
    published_at: z.string().datetime().optional(),
});

const querySchema = z.object({
    limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).optional(),
    offset: z.string().transform(val => parseInt(val)).pipe(z.number().min(0)).optional(),
    unreadOnly: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
}).partial();

// ============================================
// ENDPOINTS
// ============================================

/**
 * GET /api/automation/tech-watch/articles
 * List articles for the authenticated user (via API token)
 *
 * Query params:
 * - limit: number (default 50, max 100)
 * - offset: number (default 0)
 * - unreadOnly: boolean (default false)
 *
 * Headers:
 * - Authorization: Bearer <token>
 * OR
 * - x-api-key: <token>
 */
export async function GET(request: NextRequest) {
    try {
        // Validate API token
        const auth = await validateApiToken(request);
        if (!auth || !hasScope(auth, 'tech-watch:read')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse query params
        const { searchParams } = new URL(request.url);
        const queryParams: Record<string, string> = {};
        const limitParam = searchParams.get('limit');
        const offsetParam = searchParams.get('offset');
        const unreadOnlyParam = searchParams.get('unreadOnly');

        if (limitParam) queryParams.limit = limitParam;
        if (offsetParam) queryParams.offset = offsetParam;
        if (unreadOnlyParam) queryParams.unreadOnly = unreadOnlyParam;

        const queryValidation = querySchema.safeParse(queryParams);

        if (!queryValidation.success) {
            return NextResponse.json(
                { error: 'Invalid query parameters', details: queryValidation.error.issues },
                { status: 400 }
            );
        }

        const { limit, offset, unreadOnly } = queryValidation.data;

        // Fetch articles
        const articles = await getArticlesForUser(auth.userId, {
            limit,
            offset,
            unreadOnly,
        });

        // Log the action
        await logAutomationAction(auth, {
            action: 'article.list',
            resource_type: 'article',
            metadata: { limit, offset, unreadOnly, count: articles.length },
        });

        return NextResponse.json({
            articles,
            count: articles.length,
            limit: limit || 50,
            offset: offset || 0,
        });
    } catch (error) {
        logger.error('[automation/tech-watch/articles] GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/automation/tech-watch/articles
 * Create a new article via API token
 *
 * Body:
 * {
 *   "title": "Article Title",
 *   "url": "https://example.com/article",
 *   "source": "Example Blog",
 *   "content": "Full article content...",  // optional
 *   "summary": "Brief summary...",  // optional
 *   "tags": ["ai", "ml"],  // optional
 *   "published_at": "2025-12-18T10:00:00Z"  // optional
 * }
 *
 * Headers:
 * - Authorization: Bearer <token>
 * OR
 * - x-api-key: <token>
 */
export async function POST(request: NextRequest) {
    try {
        // Validate API token
        const auth = await validateApiToken(request);
        if (!auth || !hasScope(auth, 'tech-watch:write')) {
            return NextResponse.json(
                { error: 'Unauthorized - tech-watch:write scope required' },
                { status: 401 }
            );
        }

        // Parse and validate body
        const body = await request.json();
        const validation = createArticleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request body', details: validation.error.issues },
                { status: 400 }
            );
        }

        const input = validation.data;

        // Create article
        const article = await createArticle(auth.userId, input);

        if (!article) {
            await logAutomationAction(auth, {
                action: 'article.create',
                resource_type: 'article',
                metadata: { url: input.url, title: input.title },
                success: false,
                error_message: 'Failed to create article',
            });

            return NextResponse.json(
                { error: 'Failed to create article' },
                { status: 500 }
            );
        }

        // Log success
        await logAutomationAction(auth, {
            action: 'article.create',
            resource_type: 'article',
            resource_id: article.id,
            metadata: {
                url: article.url,
                title: article.title,
                source: article.source,
            },
        });

        logger.log('[automation/tech-watch/articles] Created article:', {
            id: article.id,
            title: article.title,
            userId: auth.userId,
        });

        return NextResponse.json({ article }, { status: 201 });
    } catch (error) {
        logger.error('[automation/tech-watch/articles] POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
