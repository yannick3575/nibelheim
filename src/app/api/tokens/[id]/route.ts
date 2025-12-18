import { NextRequest, NextResponse } from 'next/server';
import { revokeApiToken } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

/**
 * DELETE /api/tokens/[id]
 * Revoke an API token
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const success = await revokeApiToken(id);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to revoke token' },
                { status: 500 }
            );
        }

        logger.log('[tokens/id] Revoked API token:', id);

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('[tokens/id] DELETE error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
