import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/tokens/route';

// Mock dependencies
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: mockGetUser,
        },
        from: mockFrom,
    })),
}));

vi.mock('@/lib/api-auth', () => ({
    listApiTokens: vi.fn().mockResolvedValue([]),
    createApiToken: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
    logger: {
        error: vi.fn(),
        log: vi.fn(),
    },
}));

// Mock rate limiting (always allow in tests)
vi.mock('@/lib/rate-limit', () => ({
    withUserRateLimit: vi.fn().mockResolvedValue(null),
}));

describe('/api/tokens', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET should return 401 if user is not authenticated', async () => {
        // Setup mock to return null user
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

        // Call GET
        const response = await GET();

        // Assertions
        expect(response.status).toBe(401);

        const data = await response.json();
        expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('GET should return 200 with tokens if user is authenticated', async () => {
        // Setup mock to return valid user
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

        // Call GET
        const response = await GET();

        // Assertions
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({ tokens: [] });
    });
});
