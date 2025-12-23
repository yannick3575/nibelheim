import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock the tech-watch lib
vi.mock('@/lib/tech-watch', () => ({
  getDigestByDate: vi.fn(),
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    log: vi.fn(),
  },
}));

import { getDigestByDate } from '@/lib/tech-watch';

describe('GET /api/tech-watch/digests/[date]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = () => {
    return new NextRequest('http://localhost:3000/api/tech-watch/digests/2024-01-15');
  };

  const createParams = (date: string) => ({
    params: Promise.resolve({ date }),
  });

  it('should return digest for valid date', async () => {
    const mockDigest = {
      id: 'digest-1',
      user_id: 'user-123',
      period_start: '2024-01-15T00:00:00',
      period_end: '2024-01-15T23:59:59',
      summary: 'Tech news for the day',
      key_topics: ['AI', 'Security'],
      article_ids: ['article-1', 'article-2'],
      created_at: '2024-01-15T10:00:00Z',
      articles: [],
    };

    vi.mocked(getDigestByDate).mockResolvedValue(mockDigest);

    const response = await GET(createRequest(), createParams('2024-01-15'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockDigest);
    expect(getDigestByDate).toHaveBeenCalledWith('2024-01-15');
  });

  it('should return 400 for invalid date format', async () => {
    const response = await GET(createRequest(), createParams('invalid-date'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid date format. Use YYYY-MM-DD');
    expect(getDigestByDate).not.toHaveBeenCalled();
  });

  it('should return 400 for partial date', async () => {
    const response = await GET(createRequest(), createParams('2024-01'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid date format. Use YYYY-MM-DD');
  });

  it('should return 404 when digest not found', async () => {
    vi.mocked(getDigestByDate).mockResolvedValue(null);

    const response = await GET(createRequest(), createParams('2024-01-15'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Digest not found');
  });

  it('should return 500 on error', async () => {
    vi.mocked(getDigestByDate).mockRejectedValue(new Error('Database error'));

    const response = await GET(createRequest(), createParams('2024-01-15'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
