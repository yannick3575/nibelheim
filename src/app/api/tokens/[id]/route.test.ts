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

// Mock rate limiting (always allow in tests)
vi.mock('@/lib/rate-limit', () => ({
  withUserRateLimit: vi.fn().mockResolvedValue(null),
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

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Unauthorized');

    expect(revokeApiToken).not.toHaveBeenCalled();
  });

  it('should return 404 if token does not exist or does not belong to user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    // Simulate that revokeApiToken returns false (indicating nothing was deleted)
    // This assumes we update revokeApiToken to return false if no rows are deleted
    vi.mocked(revokeApiToken).mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/api/tokens/non-existent-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'non-existent-id' });

    const response = await DELETE(request, { params });

    // CURRENT BEHAVIOR: 500
    // DESIRED BEHAVIOR: 404
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Token not found');
  });

  it('should return 200 if token was successfully revoked', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    vi.mocked(revokeApiToken).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/tokens/valid-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'valid-id' });

    const response = await DELETE(request, { params });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
