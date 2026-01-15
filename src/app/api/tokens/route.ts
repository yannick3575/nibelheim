import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiToken, listApiTokens } from '@/lib/api-auth';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { withUserRateLimit } from '@/lib/rate-limit';

const createTokenSchema = z.object({
    name: z.string().min(1).max(100),
    scopes: z.array(z.string()).default(['tech-watch:read', 'tech-watch:write']),
    expiresInDays: z.number().positive().optional(),
});

/**
 * GET /api/tokens
 * List all API tokens for the authenticated user
 */
export async function GET() {
    try {
        // Authenticate user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Rate limiting (sensitive operations have stricter limits)
        const rateLimitResponse = await withUserRateLimit(user.id, 'sensitive');
        if (rateLimitResponse) return rateLimitResponse;

        const tokens = await listApiTokens();
        return NextResponse.json({ tokens });
    } catch (error) {
        logger.error('[tokens] GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/tokens
 * Create a new API token
 *
 * Body:
 * {
 *   "name": "Claude Chrome",
 *   "scopes": ["tech-watch:read", "tech-watch:write"],
 *   "expiresInDays": 90  // optional
 * }
 */
export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Rate limiting (sensitive operations have stricter limits)
        const rateLimitResponse = await withUserRateLimit(user.id, 'sensitive');
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json();
        const validation = createTokenSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { name, scopes, expiresInDays } = validation.data;

        const token = await createApiToken(name, scopes, expiresInDays);

        if (!token) {
            return NextResponse.json(
                { error: 'Failed to create token' },
                { status: 500 }
            );
        }

        logger.log('[tokens] Created API token:', { name, scopes, expiresInDays });

        return NextResponse.json({
            token: token.token,
            id: token.id,
            name: token.name,
            scopes: token.scopes,
            expires_at: token.expires_at,
            created_at: token.created_at,
        }, { status: 201 });
    } catch (error) {
        logger.error('[tokens] POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
