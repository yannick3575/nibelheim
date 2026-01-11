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

// Helper to create a stream from string
function createStream(content: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(content));
      controller.close();
    },
  });
}

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

  it('should return 401 when not authenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as unknown as ReturnType<typeof createClient>);

    const response = await GET(createGetRequest('https://example.com'));

    expect(response.status).toBe(401);
  });

  it('should return 400 for localhost (SSRF protection)', async () => {
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
      status: 200,
      headers: new Headers({
        'content-type': 'text/html; charset=utf-8',
        'content-length': '100',
      }),
      body: createStream('<html><head><title>Test Page</title></head><body></body></html>'),
    } as Response);

    const response = await GET(createGetRequest('https://example.com'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('Test Page');
  });

  // Security Enhancements Tests

  it('should block redirects to unsafe URLs (SSRF protection)', async () => {
    // Mock first request returning a redirect to localhost
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 302,
      headers: new Headers({
        'location': 'http://localhost:8080/admin',
      }),
      body: createStream('Redirecting...'),
    } as Response);

    const response = await GET(createGetRequest('https://example.com/redirect'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid URL');
    // Ensure fetch was called with redirect: 'manual'
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      redirect: 'manual'
    }));
  });

  it('should follow safe redirects', async () => {
    // Mock first request redirecting to another safe URL
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 301,
      headers: new Headers({
        'location': 'https://example.com/final',
      }),
      body: createStream('Redirecting...'),
    } as Response);

    // Mock second request returning content
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'text/html',
      }),
      body: createStream('<title>Final Page</title>'),
    } as Response);

    const response = await GET(createGetRequest('https://example.com/start'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('Final Page');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should reject non-text content types (DoS protection)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-type': 'application/pdf',
      }),
      body: createStream('%PDF-1.4...'),
    } as Response);

    const response = await GET(createGetRequest('https://example.com/file.pdf'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid content type');
  });

  it('should reject large content length (DoS protection)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-type': 'text/html',
        'content-length': '5000000', // 5MB
      }),
      body: createStream('...'),
    } as Response);

    const response = await GET(createGetRequest('https://example.com/huge'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Response too large');
  });

  it('should handle timeout (DoS protection)', async () => {
     // We can't easily mock the timeout triggering in the fetch mock itself without using real timers
     // but we can check if the AbortSignal was passed.

     vi.mocked(fetch).mockResolvedValue({
         ok: true,
         headers: new Headers({'content-type': 'text/html'}),
         body: createStream('<title>Ok</title>')
     } as Response);

     await GET(createGetRequest('https://example.com'));

     expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
         signal: expect.any(AbortSignal)
     }));
  });
});
