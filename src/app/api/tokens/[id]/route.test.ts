import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from './route';
import { NextRequest } from 'next/server';

// Mock the api-auth functions
vi.mock('@/lib/api-auth', () => ({
  revokeApiToken: vi.fn(),
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Supabase
const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

import { revokeApiToken } from '@/lib/api-auth';

describe('DELETE /api/tokens/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest('http://localhost:3000/api/tokens/test-token-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-token-id' });

    const response = await DELETE(request, { params });

    // This is expected to fail initially (it will return 200 or 500)
    // We assert 401 because that's what we WANT
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Unauthorized');

    // Ensure the sensitive function was NOT called
    expect(revokeApiToken).not.toHaveBeenCalled();
  });
});
