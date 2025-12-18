import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH } from './route';

// Mock the tech-watch lib
vi.mock('@/lib/tech-watch', () => ({
  getArticle: vi.fn(),
  toggleArticleRead: vi.fn(),
  toggleArticleFavorite: vi.fn(),
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    log: vi.fn(),
  },
}));

import { getArticle, toggleArticleRead, toggleArticleFavorite } from '@/lib/tech-watch';

describe('/api/tech-watch/articles/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (method: string, body?: unknown) => {
    return new NextRequest('http://localhost:3000/api/tech-watch/articles/article-1', {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  const createParams = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  describe('GET', () => {
    it('should return article when found', async () => {
      const mockArticle = {
        id: 'article-1',
        title: 'Test Article',
        url: 'https://example.com/article',
        summary: 'Article summary',
        source_id: 'source-1',
        read: false,
        created_at: '2024-01-15T10:00:00Z',
      };

      vi.mocked(getArticle).mockResolvedValue(mockArticle);

      const response = await GET(createRequest('GET'), createParams('article-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockArticle);
      expect(getArticle).toHaveBeenCalledWith('article-1');
    });

    it('should return 404 when article not found', async () => {
      vi.mocked(getArticle).mockResolvedValue(null);

      const response = await GET(createRequest('GET'), createParams('article-1'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Article not found');
    });

    it('should return 500 on error', async () => {
      vi.mocked(getArticle).mockRejectedValue(new Error('Database error'));

      const response = await GET(createRequest('GET'), createParams('article-1'));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('PATCH', () => {
    it('should toggle read status to true', async () => {
      vi.mocked(toggleArticleRead).mockResolvedValue(true);

      const response = await PATCH(
        createRequest('PATCH', { read: true }),
        createParams('article-1')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.read).toBe(true);
      expect(toggleArticleRead).toHaveBeenCalledWith('article-1', true);
    });

    it('should toggle read status to false', async () => {
      vi.mocked(toggleArticleRead).mockResolvedValue(true);

      const response = await PATCH(
        createRequest('PATCH', { read: false }),
        createParams('article-1')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.read).toBe(false);
      expect(toggleArticleRead).toHaveBeenCalledWith('article-1', false);
    });

    it('should return 400 for missing read field', async () => {
      const response = await PATCH(
        createRequest('PATCH', {}),
        createParams('article-1')
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should return 400 for invalid read type', async () => {
      const response = await PATCH(
        createRequest('PATCH', { read: 'yes' }),
        createParams('article-1')
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
      expect(data.details).toContain('expected boolean');
    });

    it('should return 400 for null read value', async () => {
      const response = await PATCH(
        createRequest('PATCH', { read: null }),
        createParams('article-1')
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should return 500 when toggleArticleRead fails', async () => {
      vi.mocked(toggleArticleRead).mockResolvedValue(false);

      const response = await PATCH(
        createRequest('PATCH', { read: true }),
        createParams('article-1')
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update article read status');
    });

    it('should return 500 on error', async () => {
      vi.mocked(toggleArticleRead).mockRejectedValue(new Error('Database error'));

      const response = await PATCH(
        createRequest('PATCH', { read: true }),
        createParams('article-1')
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should toggle favorite status to true', async () => {
      vi.mocked(toggleArticleFavorite).mockResolvedValue(true);

      const response = await PATCH(
        createRequest('PATCH', { is_favorite: true }),
        createParams('article-1')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.is_favorite).toBe(true);
      expect(toggleArticleFavorite).toHaveBeenCalledWith('article-1', true);
    });

    it('should toggle favorite status to false', async () => {
      vi.mocked(toggleArticleFavorite).mockResolvedValue(true);

      const response = await PATCH(
        createRequest('PATCH', { is_favorite: false }),
        createParams('article-1')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.is_favorite).toBe(false);
      expect(toggleArticleFavorite).toHaveBeenCalledWith('article-1', false);
    });

    it('should handle both read and is_favorite updates simultaneously', async () => {
      vi.mocked(toggleArticleRead).mockResolvedValue(true);
      vi.mocked(toggleArticleFavorite).mockResolvedValue(true);

      const response = await PATCH(
        createRequest('PATCH', { read: true, is_favorite: true }),
        createParams('article-1')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.read).toBe(true);
      expect(data.is_favorite).toBe(true);
      expect(toggleArticleRead).toHaveBeenCalledWith('article-1', true);
      expect(toggleArticleFavorite).toHaveBeenCalledWith('article-1', true);
    });

    it('should return 500 when toggleArticleFavorite fails', async () => {
      vi.mocked(toggleArticleFavorite).mockResolvedValue(false);

      const response = await PATCH(
        createRequest('PATCH', { is_favorite: true }),
        createParams('article-1')
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update article favorite status');
    });

    it('should return 400 when neither read nor is_favorite is provided', async () => {
      const response = await PATCH(
        createRequest('PATCH', {}),
        createParams('article-1')
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });
  });
});
