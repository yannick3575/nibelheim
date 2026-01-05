import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('GET /api/ai-inbox/parse-url', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Security Test 1: Authentication
  it('should prevent unauthenticated access', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest('http://localhost:3000/api/ai-inbox/parse-url?url=https://example.com');
    const response = await GET(request);

    // Expecting 401 Unauthorized
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  // Security Test 2: SSRF - Localhost Access
  it('should prevent access to localhost', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

    // Mock fetch (should not be called ideally, but if it is, we'll know)
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<title>Internal Service</title>'),
    });

    const request = new NextRequest('http://localhost:3000/api/ai-inbox/parse-url?url=http://localhost:8080/secret');
    const response = await GET(request);

    // Expecting 400 Bad Request (Forbidden URL)
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid or forbidden URL');

    // Check that fetch was NOT called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // Security Test 3: SSRF - Metadata Service
  it('should prevent access to cloud metadata IP', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

    const request = new NextRequest('http://localhost:3000/api/ai-inbox/parse-url?url=http://169.254.169.254/latest/meta-data/');
    const response = await GET(request);

    // Expecting 400 Bad Request
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid or forbidden URL');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  // Functional Test: Valid URL
  it('should allow valid external URLs', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<title>Example Domain</title>'),
    });

    const request = new NextRequest('http://localhost:3000/api/ai-inbox/parse-url?url=https://example.com');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.title).toBe('Example Domain');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.any(Object)
    );
  });
});
