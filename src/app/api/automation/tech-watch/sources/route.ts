import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateApiToken, hasScope, logAutomationAction } from '@/lib/api-auth';
import { createSourceForUser, getSourcesForUser } from '@/lib/tech-watch-automation';
import { logger } from '@/lib/logger';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createSourceSchema = z.object({
    type: z.enum(['rss', 'api', 'manual']),
    name: z.string().min(1).max(200),
    url: z.string().url().optional(),
    config: z.record(z.unknown()).optional(),
});

// ============================================
// ENDPOINTS
// ============================================

/**
 * GET /api/automation/tech-watch/sources
 * List sources for the authenticated user (via API token)
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

        // Fetch sources
        const sources = await getSourcesForUser(auth.userId);

        // Log the action
        await logAutomationAction(auth, {
            action: 'source.list',
            resource_type: 'source',
            metadata: { count: sources.length },
        });

        return NextResponse.json({
            sources,
            count: sources.length,
        });
    } catch (error) {
        logger.error('[automation/tech-watch/sources] GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/automation/tech-watch/sources
 * Create a new source via API token
 *
 * Body:
 * {
 *   "type": "rss" | "api" | "manual",
 *   "name": "Source Name",
 *   "url": "https://example.com/feed.xml",  // optional
 *   "config": { "key": "value" }  // optional
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
        const validation = createSourceSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request body', details: validation.error.issues },
                { status: 400 }
            );
        }

        const input = validation.data;

        // Create source
        const source = await createSourceForUser(auth.userId, input);

        if (!source) {
            await logAutomationAction(auth, {
                action: 'source.create',
                resource_type: 'source',
                metadata: { name: input.name, url: input.url },
                success: false,
                error_message: 'Failed to create source',
            });

            return NextResponse.json(
                { error: 'Failed to create source' },
                { status: 500 }
            );
        }

        // Log success
        await logAutomationAction(auth, {
            action: 'source.create',
            resource_type: 'source',
            resource_id: source.id,
            metadata: {
                name: source.name,
                url: source.url,
                type: source.type,
            },
        });

        logger.log('[automation/tech-watch/sources] Created source:', {
            id: source.id,
            name: source.name,
            userId: auth.userId,
        });

        return NextResponse.json({ source }, { status: 201 });
    } catch (error) {
        logger.error('[automation/tech-watch/sources] POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
