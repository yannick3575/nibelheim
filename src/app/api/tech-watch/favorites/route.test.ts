import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock the tech-watch lib
vi.mock('@/lib/tech-watch', () => ({
  getFavoriteArticles: vi.fn(),
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    log: vi.fn(),
  },
}));

import { getFavoriteArticles } from '@/lib/tech-watch';

describe('/api/tech-watch/favorites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return empty array when no favorites exist', async () => {
      vi.mocked(getFavoriteArticles).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
      expect(getFavoriteArticles).toHaveBeenCalledTimes(1);
    });

    it('should return list of favorite articles', async () => {
      const mockFavorites = [
        {
          id: 'article-1',
          user_id: 'user-1',
          title: 'Favorite Article 1',
          url: 'https://example.com/article1',
          source: 'hacker_news',
          content: 'Content 1',
          summary: 'Summary 1',
          tags: ['typescript', 'nextjs'],
          published_at: '2024-01-15T10:00:00Z',
          collected_at: '2024-01-15T11:00:00Z',
          read: false,
          is_favorite: true,
        },
        {
          id: 'article-2',
          user_id: 'user-1',
          title: 'Favorite Article 2',
          url: 'https://example.com/article2',
          source: 'hacker_news',
          content: 'Content 2',
          summary: 'Summary 2',
          tags: ['react', 'performance'],
          published_at: '2024-01-14T10:00:00Z',
          collected_at: '2024-01-14T11:00:00Z',
          read: true,
          is_favorite: true,
        },
      ];

      vi.mocked(getFavoriteArticles).mockResolvedValue(mockFavorites);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockFavorites);
      expect(data).toHaveLength(2);
      expect(data[0].is_favorite).toBe(true);
      expect(data[1].is_favorite).toBe(true);
      expect(getFavoriteArticles).toHaveBeenCalledTimes(1);
    });

    it('should return 500 on error', async () => {
      vi.mocked(getFavoriteArticles).mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
