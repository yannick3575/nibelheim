import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    log: vi.fn(),
  },
}));

// Mock supabase server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

// Mock fetch global
global.fetch = vi.fn();

describe('/api/ai-inbox/parse-url', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for authenticated user
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: 'user-123' } } }),
      },
    } as unknown as ReturnType<typeof createClient>);
  });

  const createGetRequest = (urlParam: string) => {
    const url = new URL('http://localhost:3000/api/ai-inbox/parse-url');
    if (urlParam) {
      url.searchParams.set('url', urlParam);
    }
    return new NextRequest(url);
  };

  it('should return 400 if URL is missing', async () => {
    const response = await GET(createGetRequest(''));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('URL is required');
  });

  // This test confirms the current vulnerability: it works WITHOUT authentication check in the code
  // BUT we will soon add authentication, so this test is expected to fail or need updating after fix.
  // For now, let's test how it SHOULD behave after our fix (expect 401).
  it('should return 401 when not authenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as unknown as ReturnType<typeof createClient>);

    const response = await GET(createGetRequest('https://example.com'));

    // Currently, this will fail because the endpoint is PUBLIC (returns 200 or 500 depending on fetch).
    // After our fix, it should return 401.
    // For reproduction purposes, let's verify what happens NOW.
    // Since we haven't fixed it yet, we expect this check to FAIL if we assert 401.
    // So to demonstrate the vulnerability, we can check if it proceeds to call fetch even without user.

    // However, to keep the test suite clean for the final PR, I will write the test assuming the fix is applied.
    // But since I need to verify the fix, I will run this test AFTER the fix.

    // Let's assert 401 here. It will fail now, which is good.
    if (response.status !== 401) {
       console.log("VULNERABILITY CONFIRMED: Endpoint is accessible without authentication!");
    }

    // We expect 401
    expect(response.status).toBe(401);
  });

  it('should return 400 for localhost (SSRF protection)', async () => {
    // This tests the SSRF protection we are about to add
    const response = await GET(createGetRequest('http://localhost:3000/secret'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid URL');
  });

  it('should return 400 for private IP (SSRF protection)', async () => {
    const response = await GET(createGetRequest('http://192.168.1.1/admin'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid URL');
  });

  it('should extract title from valid external URL', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<html><head><title>Test Page</title></head><body></body></html>'),
    } as Response);

    const response = await GET(createGetRequest('https://example.com'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('Test Page');
  });
});
