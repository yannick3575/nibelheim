import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from './admin';

const BYPASS_USER_ID = '3bc03a0f-2ed9-493f-ab6f-4d7fc9409de6';
const BYPASS_USER_EMAIL = 'bypass@nibelheim.local';

export async function createClient() {
    // Auth bypass: return admin client with a patched getUser()
    // so all existing route code works without changes.
    if (process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true') {
        const admin = createAdminClient();
        const originalAuth = admin.auth;
        admin.auth = new Proxy(originalAuth, {
            get(target, prop) {
                if (prop === 'getUser') {
                    return async () => ({
                        data: {
                            user: {
                                id: BYPASS_USER_ID,
                                email: BYPASS_USER_EMAIL,
                                aud: 'authenticated',
                                role: 'authenticated',
                                app_metadata: {},
                                user_metadata: {},
                                created_at: '',
                            },
                        },
                        error: null,
                    });
                }
                return Reflect.get(target, prop);
            },
        }) as typeof originalAuth;
        return admin;
    }

    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
}
