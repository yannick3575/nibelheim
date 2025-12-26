## 2024-05-23 - Missing Authentication on API Routes
**Vulnerability:** The `/api/tokens` endpoint (GET and POST) lacked explicit authentication checks, relying potentially on middleware or implicit RLS which is fragile and violates defense-in-depth.
**Learning:** Middleware protection is good, but critical API endpoints managing sensitive resources (like API tokens) must have explicit authentication checks within the handler to return appropriate status codes (401 vs 200/500) and prevent accidental exposure if middleware configuration changes.
**Prevention:** Always verify `supabase.auth.getUser()` in API route handlers for protected resources.
