import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock the tech-watch lib
vi.mock('@/lib/tech-watch', () => ({
  getLatestDigest: vi.fn(),
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    log: vi.fn(),
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

import { getLatestDigest } from '@/lib/tech-watch';

describe('GET /api/tech-watch/latest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return latest digest when found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    const mockDigest = {
      id: 'digest-1',
      user_id: 'user-123',
      period_start: '2024-01-15T00:00:00',
      period_end: '2024-01-15T23:59:59',
      summary: 'Tech news summary',
      key_topics: ['AI', 'Security'],
      article_ids: ['article-1', 'article-2'],
      created_at: '2024-01-15T10:00:00Z',
      articles: [],
    };

    vi.mocked(getLatestDigest).mockResolvedValue(mockDigest);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockDigest);
    expect(getLatestDigest).toHaveBeenCalledTimes(1);
  });

  it('should return 404 when no digest found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    vi.mocked(getLatestDigest).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Digest not found');
  });

  it('should return 500 on error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    vi.mocked(getLatestDigest).mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
