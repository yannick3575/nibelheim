## 2024-05-23 - Missing Authentication on API Routes
**Vulnerability:** The `/api/tokens` endpoint (GET and POST) lacked explicit authentication checks, relying potentially on middleware or implicit RLS which is fragile and violates defense-in-depth.
**Learning:** Middleware protection is good, but critical API endpoints managing sensitive resources (like API tokens) must have explicit authentication checks within the handler to return appropriate status codes (401 vs 200/500) and prevent accidental exposure if middleware configuration changes.
**Prevention:** Always verify `supabase.auth.getUser()` in API route handlers for protected resources.

## 2024-05-23 - Missing Authentication on Tech Watch API
**Vulnerability:** The `/api/tech-watch` endpoints (`sources` and `articles/[id]`) lacked explicit authentication checks, relying solely on Row Level Security (RLS). While RLS prevents data leakage at the database level, the API routes would attempt to execute logic without a user, leading to potential 500 errors or logic execution before database queries.
**Learning:** API routes should fail fast with 401 Unauthorized if no user session is present, rather than proceeding to execution. This provides better security semantics and prevents any pre-query logic from running unauthenticated.
**Prevention:** Add `await supabase.auth.getUser()` check at the start of every protected API route handler.
