import 'server-only';

import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// ============================================
// CRYPTO UTILITIES
// ============================================

/**
 * Hash a token using SHA-256 (hex encoded)
 * Matches the PostgreSQL: encode(digest(token, 'sha256'), 'hex')
 */
function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

// ============================================
// TYPES
// ============================================

export interface ApiToken {
    id: string;
    user_id: string;
    name: string;
    token_prefix: string;
    scopes: string[];
    last_used_at: string | null;
    expires_at: string | null;
    created_at: string;
}

/** Returned only once at creation time */
export interface ApiTokenWithSecret extends ApiToken {
    token: string;
}

export interface AuthContext {
    userId: string;
    tokenId: string;
    scopes: string[];
}

// ============================================
// TOKEN VALIDATION
// ============================================

/**
 * Validate API token from request headers
 * Checks Authorization: Bearer <token> or x-api-key: <token>
 */
export async function validateApiToken(request: NextRequest): Promise<AuthContext | null> {
    // Extract token from headers
    const authHeader = request.headers.get('authorization');
    const apiKeyHeader = request.headers.get('x-api-key');

    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else if (apiKeyHeader) {
        token = apiKeyHeader;
    }

    if (!token) {
        return null;
    }

    // Hash the token before comparing (tokens are stored as SHA-256 hashes)
    const tokenHash = hashToken(token);

    // Validate token against database using service role client
    // We need service role because RLS policies require auth.uid()
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: apiToken, error } = await supabase
        .from('api_tokens')
        .select('id, user_id, scopes, expires_at')
        .eq('token_hash', tokenHash)
        .single();

    if (error || !apiToken) {
        return null;
    }

    // Check if token is expired
    if (apiToken.expires_at && new Date(apiToken.expires_at) < new Date()) {
        return null;
    }

    // Update last_used_at asynchronously (fire and forget)
    void supabase
        .from('api_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', apiToken.id);

    return {
        userId: apiToken.user_id,
        tokenId: apiToken.id,
        scopes: apiToken.scopes || [],
    };
}

/**
 * Check if auth context has required scope
 */
export function hasScope(auth: AuthContext, requiredScope: string): boolean {
    return auth.scopes.includes(requiredScope) || auth.scopes.includes('*');
}

// ============================================
// TOKEN MANAGEMENT (for authenticated users)
// ============================================

/**
 * Create a new API token for the current user
 *
 * IMPORTANT: The returned `token` field contains the plaintext token.
 * This is the ONLY time the token will be available - it is not stored.
 * The UI must display it once and warn the user to save it.
 */
export async function createApiToken(name: string, scopes: string[], expiresInDays?: number): Promise<ApiTokenWithSecret | null> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Generate token using database function (returns token, token_hash, token_prefix)
    const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_api_token');

    if (tokenError || !tokenData || tokenData.length === 0) {
        logger.error('[api-auth] generateApiToken failed:', tokenError);
        return null;
    }

    // The RPC returns a table, so we get the first row
    const { token, token_hash, token_prefix } = tokenData[0] as {
        token: string;
        token_hash: string;
        token_prefix: string;
    };

    // Calculate expiration
    const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    // Store only the hash, never the plaintext token
    const { data, error } = await supabase
        .from('api_tokens')
        .insert({
            user_id: user.id,
            name,
            token_hash,
            token_prefix,
            scopes,
            expires_at: expiresAt,
        })
        .select('id, user_id, name, token_prefix, scopes, last_used_at, expires_at, created_at')
        .single();

    if (error) {
        logger.error('[api-auth] createApiToken failed:', error, { name });
        return null;
    }

    // Return the token WITH the plaintext secret (only time it's available)
    return {
        ...data,
        token, // Plaintext token - display once then discard!
    };
}

/**
 * List all API tokens for the current user
 * Note: Only returns token_prefix for display, never the actual token
 */
export async function listApiTokens(): Promise<ApiToken[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('api_tokens')
        .select('id, user_id, name, token_prefix, scopes, last_used_at, expires_at, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('[api-auth] listApiTokens failed:', error);
        return [];
    }

    return data || [];
}

/**
 * Revoke (delete) an API token
 */
export async function revokeApiToken(tokenId: string): Promise<boolean> {
    const supabase = await createServerClient();

    const { error } = await supabase
        .from('api_tokens')
        .delete()
        .eq('id', tokenId);

    if (error) {
        logger.error('[api-auth] revokeApiToken failed:', error, { tokenId });
        return false;
    }

    return true;
}

// ============================================
// AUTOMATION LOGGING
// ============================================

export interface AutomationLog {
    action: string;
    resource_type: string;
    resource_id?: string;
    metadata?: Record<string, unknown>;
    success?: boolean;
    error_message?: string;
}

/**
 * Log an automation action (uses service role to bypass RLS)
 */
export async function logAutomationAction(
    auth: AuthContext,
    log: AutomationLog
): Promise<void> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase
        .from('automation_logs')
        .insert({
            user_id: auth.userId,
            token_id: auth.tokenId,
            action: log.action,
            resource_type: log.resource_type,
            resource_id: log.resource_id || null,
            metadata: log.metadata || {},
            success: log.success ?? true,
            error_message: log.error_message || null,
        });
}

/**
 * Get automation logs for the current user
 */
export async function getAutomationLogs(limit = 100): Promise<AutomationLog[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('automation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        logger.error('[api-auth] getAutomationLogs failed:', error);
        return [];
    }

    return data || [];
}
