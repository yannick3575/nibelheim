import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Use vi.hoisted to ensure the mock function is available before vi.mock calls
const { mockGetUser } = vi.hoisted(() => {
  return {
    mockGetUser: vi.fn(),
  };
});

// Mock both supabase clients
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [{ count: 5 }],
            error: null,
          })),
          // for the token validation query: select(...).eq(...).single()
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ error: { code: 'PGRST116' } })),
          })),
        })),
      })),
    })),
  };
});

vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: vi.fn(() => ({
      auth: {
        getUser: mockGetUser,
      },
    })),
  };
});

// Mock rate limiting (always allow in tests)
vi.mock('@/lib/rate-limit', () => ({
  withRateLimit: vi.fn().mockResolvedValue(null),
}));

import { NextRequest } from 'next/server';

describe('GET /api/automation/health', () => {
  const createRequest = () => new NextRequest('http://localhost:3000/api/automation/health');

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  });

  it('should return 401 if unauthorized', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return health status if authorized', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user' } } });

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.checks.env_variables.status).toBe('ok');
    expect(data.checks.supabase_connection.status).toBe('ok');
  });
});
