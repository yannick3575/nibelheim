import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/automation/health
 * Diagnostic endpoint to check automation system health
 *
 * This endpoint requires authentication.
 */
export async function GET() {
    // 1. Authentication Check
    const supabaseAuth = await createClient();
    const {
        data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const diagnostics = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        checks: {} as Record<string, { status: 'ok' | 'error', message?: string, details?: unknown }>,
    };

    // Check 1: Environment variables
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        diagnostics.checks.env_variables = {
            status: supabaseUrl && serviceRoleKey ? 'ok' : 'error',
            message: !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL missing' :
                     !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY missing' :
                     'All required environment variables present',
            details: {
                NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? '✓ Present' : '✗ Missing',
                SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey ? '✓ Present' : '✗ Missing',
            }
        };
    } catch (error) {
        diagnostics.checks.env_variables = {
            status: 'error',
            message: 'Failed to check environment variables',
            details: error instanceof Error ? error.message : String(error),
        };
    }

    // Check 2: Supabase connection
    try {
        const supabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Simple query to test connection
        const { error: connectionError } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);

        diagnostics.checks.supabase_connection = {
            status: connectionError ? 'error' : 'ok',
            message: connectionError ? `Connection failed: ${connectionError.message}` : 'Successfully connected to Supabase',
            details: connectionError ? {
                code: connectionError.code,
                details: connectionError.details,
                hint: connectionError.hint,
            } : undefined,
        };
    } catch (error) {
        diagnostics.checks.supabase_connection = {
            status: 'error',
            message: 'Exception while connecting to Supabase',
            details: error instanceof Error ? error.message : String(error),
        };
    }

    // Check 3: API tokens table exists
    try {
        const supabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error: tableError } = await supabase
            .from('api_tokens')
            .select('count')
            .limit(1);

        diagnostics.checks.api_tokens_table = {
            status: tableError ? 'error' : 'ok',
            message: tableError ? `Table check failed: ${tableError.message}` : 'api_tokens table exists and is accessible',
            details: tableError ? {
                code: tableError.code,
                details: tableError.details,
                hint: tableError.hint,
            } : { row_count: data?.length || 0 },
        };
    } catch (error) {
        diagnostics.checks.api_tokens_table = {
            status: 'error',
            message: 'Exception while checking api_tokens table',
            details: error instanceof Error ? error.message : String(error),
        };
    }

    // Check 4: Tech watch articles table
    try {
        const supabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error: tableError } = await supabase
            .from('tech_watch_articles')
            .select('count')
            .limit(1);

        diagnostics.checks.tech_watch_articles_table = {
            status: tableError ? 'error' : 'ok',
            message: tableError ? `Table check failed: ${tableError.message}` : 'tech_watch_articles table exists and is accessible',
            details: tableError ? {
                code: tableError.code,
                details: tableError.details,
                hint: tableError.hint,
            } : { row_count: data?.length || 0 },
        };
    } catch (error) {
        diagnostics.checks.tech_watch_articles_table = {
            status: 'error',
            message: 'Exception while checking tech_watch_articles table',
            details: error instanceof Error ? error.message : String(error),
        };
    }

    // Check 5: Automation logs table
    try {
        const supabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error: tableError } = await supabase
            .from('automation_logs')
            .select('count')
            .limit(1);

        diagnostics.checks.automation_logs_table = {
            status: tableError ? 'error' : 'ok',
            message: tableError ? `Table check failed: ${tableError.message}` : 'automation_logs table exists and is accessible',
            details: tableError ? {
                code: tableError.code,
                details: tableError.details,
                hint: tableError.hint,
            } : { row_count: data?.length || 0 },
        };
    } catch (error) {
        diagnostics.checks.automation_logs_table = {
            status: 'error',
            message: 'Exception while checking automation_logs table',
            details: error instanceof Error ? error.message : String(error),
        };
    }

    // Check 6: Test token validation flow (without actual token)
    try {
        const supabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Try to query with a fake token to see if the query works
        const { error: queryError } = await supabase
            .from('api_tokens')
            .select('id, user_id, scopes, expires_at')
            .eq('token', 'fake-test-token-for-diagnostics')
            .single();

        // We expect this to fail with "no rows" error, which is good
        // Any other error indicates a problem
        const isExpectedError = queryError?.code === 'PGRST116'; // No rows found

        diagnostics.checks.token_validation_query = {
            status: (isExpectedError || !queryError) ? 'ok' : 'error',
            message: isExpectedError ? 'Token validation query structure is correct' :
                     !queryError ? 'Query executed successfully' :
                     `Unexpected query error: ${queryError.message}`,
            details: queryError && !isExpectedError ? {
                code: queryError.code,
                details: queryError.details,
                hint: queryError.hint,
            } : undefined,
        };
    } catch (error) {
        diagnostics.checks.token_validation_query = {
            status: 'error',
            message: 'Exception during token validation query test',
            details: error instanceof Error ? error.message : String(error),
        };
    }

    // Overall health status
    const allChecks = Object.values(diagnostics.checks);
    const failedChecks = allChecks.filter(c => c.status === 'error');
    const overallStatus = failedChecks.length === 0 ? 'healthy' : 'unhealthy';

    // Determine HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : 503;

    return NextResponse.json({
        status: overallStatus,
        message: overallStatus === 'healthy'
            ? 'All systems operational'
            : `${failedChecks.length} check(s) failed`,
        ...diagnostics,
    }, { status: statusCode });
}
