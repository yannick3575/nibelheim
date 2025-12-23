import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// Mock the tech-watch lib
vi.mock('@/lib/tech-watch', () => ({
  getSources: vi.fn(),
  createSource: vi.fn(),
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    log: vi.fn(),
  },
}));

import { getSources, createSource } from '@/lib/tech-watch';

describe('/api/tech-watch/sources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return list of sources', async () => {
      const mockSources = [
        {
          id: 'source-1',
          user_id: 'user-123',
          type: 'rss' as const,
          name: 'Hacker News',
          url: 'https://news.ycombinator.com/rss',
          config: {},
          enabled: true,
          last_fetched_at: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'source-2',
          user_id: 'user-123',
          type: 'api' as const,
          name: 'Reddit API',
          url: 'https://api.reddit.com',
          config: {},
          enabled: false,
          last_fetched_at: null,
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      vi.mocked(getSources).mockResolvedValue(mockSources);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSources);
      expect(data).toHaveLength(2);
    });

    it('should return empty array when no sources', async () => {
      vi.mocked(getSources).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should return 500 on error', async () => {
      vi.mocked(getSources).mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch sources');
    });
  });

  describe('POST', () => {
    const createRequest = (body: unknown) => {
      return new NextRequest('http://localhost:3000/api/tech-watch/sources', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    };

    it('should create a source with valid data', async () => {
      const mockSource = {
        id: 'new-source-1',
        user_id: 'user-123',
        type: 'rss' as const,
        name: 'Tech Crunch',
        url: 'https://techcrunch.com/feed/',
        config: {},
        enabled: true,
        last_fetched_at: null,
        created_at: '2024-01-15T10:00:00Z',
      };

      vi.mocked(createSource).mockResolvedValue(mockSource);

      const response = await POST(
        createRequest({
          type: 'rss',
          name: 'Tech Crunch',
          url: 'https://techcrunch.com/feed/',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSource);
      expect(createSource).toHaveBeenCalledWith({
        type: 'rss',
        name: 'Tech Crunch',
        url: 'https://techcrunch.com/feed/',
        config: undefined,
      });
    });

    it('should create a source without URL', async () => {
      const mockSource = {
        id: 'new-source-2',
        user_id: 'user-123',
        type: 'manual' as const,
        name: 'Manual Source',
        url: null,
        config: {},
        enabled: true,
        last_fetched_at: null,
        created_at: '2024-01-15T10:00:00Z',
      };

      vi.mocked(createSource).mockResolvedValue(mockSource);

      const response = await POST(
        createRequest({
          type: 'manual',
          name: 'Manual Source',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSource);
    });

    it('should return 400 for invalid type', async () => {
      const response = await POST(
        createRequest({
          type: 'invalid',
          name: 'Test Source',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContain('Type must be rss, api, or manual');
    });

    it('should return 400 for missing name', async () => {
      const response = await POST(
        createRequest({
          type: 'rss',
          name: '',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContain('Name is required');
    });

    it('should return 400 for name too long', async () => {
      const response = await POST(
        createRequest({
          type: 'rss',
          name: 'x'.repeat(101),
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContain('Name must be 100 characters or less');
    });

    it('should return 400 for invalid URL', async () => {
      const response = await POST(
        createRequest({
          type: 'rss',
          name: 'Test Source',
          url: 'not-a-valid-url',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContain('Invalid URL format');
    });

    it('should return 500 when createSource returns null', async () => {
      vi.mocked(createSource).mockResolvedValue(null);

      const response = await POST(
        createRequest({
          type: 'rss',
          name: 'Test Source',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create source');
    });

    it('should return 500 on error', async () => {
      vi.mocked(createSource).mockRejectedValue(new Error('Database error'));

      const response = await POST(
        createRequest({
          type: 'rss',
          name: 'Test Source',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
