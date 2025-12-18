import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateApiToken, hasScope, logAutomationAction } from '@/lib/api-auth';
import { updateSourceForUser, deleteSourceForUser } from '@/lib/tech-watch-automation';
import { logger } from '@/lib/logger';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

const updateSourceSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    url: z.string().url().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    enabled: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
});

// ============================================
// ENDPOINTS
// ============================================

/**
 * PATCH /api/automation/tech-watch/sources/[id]
 * Update a source via API token
 *
 * Body:
 * {
 *   "name": "Updated Name",  // optional
 *   "url": "https://new-url.com",  // optional
 *   "config": { "key": "value" },  // optional
 *   "enabled": false  // optional
 * }
 *
 * Headers:
 * - Authorization: Bearer <token>
 * OR
 * - x-api-key: <token>
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

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
        const validation = updateSourceSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request body', details: validation.error.issues },
                { status: 400 }
            );
        }

        const updates = validation.data;

        // Update source
        const success = await updateSourceForUser(auth.userId, id, updates);

        if (!success) {
            await logAutomationAction(auth, {
                action: 'source.update',
                resource_type: 'source',
                resource_id: id,
                metadata: updates,
                success: false,
                error_message: 'Failed to update source',
            });

            return NextResponse.json(
                { error: 'Failed to update source' },
                { status: 500 }
            );
        }

        // Log success
        await logAutomationAction(auth, {
            action: 'source.update',
            resource_type: 'source',
            resource_id: id,
            metadata: updates,
        });

        logger.log('[automation/tech-watch/sources/id] Updated source:', {
            id,
            updates,
            userId: auth.userId,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('[automation/tech-watch/sources/id] PATCH error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/automation/tech-watch/sources/[id]
 * Delete a source via API token
 *
 * Headers:
 * - Authorization: Bearer <token>
 * OR
 * - x-api-key: <token>
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Validate API token
        const auth = await validateApiToken(request);
        if (!auth || !hasScope(auth, 'tech-watch:write')) {
            return NextResponse.json(
                { error: 'Unauthorized - tech-watch:write scope required' },
                { status: 401 }
            );
        }

        // Delete source
        const success = await deleteSourceForUser(auth.userId, id);

        if (!success) {
            await logAutomationAction(auth, {
                action: 'source.delete',
                resource_type: 'source',
                resource_id: id,
                success: false,
                error_message: 'Failed to delete source',
            });

            return NextResponse.json(
                { error: 'Failed to delete source' },
                { status: 500 }
            );
        }

        // Log success
        await logAutomationAction(auth, {
            action: 'source.delete',
            resource_type: 'source',
            resource_id: id,
        });

        logger.log('[automation/tech-watch/sources/id] Deleted source:', {
            id,
            userId: auth.userId,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('[automation/tech-watch/sources/id] DELETE error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
