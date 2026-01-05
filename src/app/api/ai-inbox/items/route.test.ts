import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// Mock the ai-inbox lib
vi.mock('@/lib/ai-inbox', () => ({
  getItems: vi.fn(),
  createItem: vi.fn(),
  getSettings: vi.fn(),
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

// Mock AI + scraping helpers to avoid network
vi.mock('@/lib/ai-inbox-gemini', () => ({
  analyzeItem: vi.fn(),
  DEFAULT_USER_PROFILE: {
    current_stack: [],
    current_projects: [],
    interests: [],
    skill_level: 'intermediate',
  },
}));
vi.mock('@/lib/scraper', () => ({
  extractUrlContent: vi.fn(),
}));
vi.mock('@/lib/youtube', () => ({
  getYouTubeTranscript: vi.fn(),
}));

import { getItems, createItem, getSettings } from '@/lib/ai-inbox';
import { analyzeItem } from '@/lib/ai-inbox-gemini';
import { extractUrlContent } from '@/lib/scraper';
import { getYouTubeTranscript } from '@/lib/youtube';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

describe('/api/ai-inbox/items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const supabaseWriter = {
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    };

    // Default mock for authenticated user
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: 'user-123' } } }),
      },
    } as unknown as ReturnType<typeof createClient>);
    vi.mocked(createAdminClient).mockReturnValue(
      supabaseWriter as unknown as ReturnType<typeof createAdminClient>
    );

    vi.mocked(analyzeItem).mockResolvedValue({
      summary: 'Summary',
      actionability: 3,
      complexity: 2,
      project_ideas: [],
      relevance_to_profile: 'Rel',
      suggested_category: 'news',
      suggested_tags: [],
    });
    vi.mocked(extractUrlContent).mockResolvedValue(null);
    vi.mocked(getYouTubeTranscript).mockResolvedValue(null);

    vi.mocked(getSettings).mockResolvedValue(null);
  });

  describe('GET', () => {
    const createGetRequest = (params: Record<string, string> = {}) => {
      const url = new URL('http://localhost:3000/api/ai-inbox/items');
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      return new NextRequest(url);
    };

    it('should return 401 when not authenticated', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      } as unknown as ReturnType<typeof createClient>);

      const response = await GET(createGetRequest());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return list of items', async () => {
      const mockItems = [
        {
          id: 'item-1',
          user_id: 'user-123',
          title: 'Test Item',
          url: 'https://example.com',
          source_type: 'manual',
          category: 'news',
          status: 'unread',
          raw_content: null,
          ai_analysis: null,
          tags: [],
          is_favorite: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(getItems).mockResolvedValue(mockItems);

      const response = await GET(createGetRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockItems);
      expect(getItems).toHaveBeenCalledWith({});
    });

    it('should pass filters to getItems', async () => {
      vi.mocked(getItems).mockResolvedValue([]);

      const response = await GET(
        createGetRequest({
          status: 'unread',
          category: 'tools',
          source_type: 'youtube',
          favorite: 'true',
          limit: '10',
          offset: '5',
        })
      );

      expect(response.status).toBe(200);
      expect(getItems).toHaveBeenCalledWith({
        status: 'unread',
        category: 'tools',
        source_type: 'youtube',
        favorite: true,
        limit: 10,
        offset: 5,
      });
    });

    it('should ignore invalid filter values', async () => {
      vi.mocked(getItems).mockResolvedValue([]);

      const response = await GET(
        createGetRequest({
          status: 'invalid',
          category: 'invalid',
          limit: '-5',
          offset: 'abc',
        })
      );

      expect(response.status).toBe(200);
      expect(getItems).toHaveBeenCalledWith({});
    });

    it('should return 500 on error', async () => {
      vi.mocked(getItems).mockRejectedValue(new Error('Database error'));

      const response = await GET(createGetRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch items');
    });
  });

  describe('POST', () => {
    const createPostRequest = (body: unknown) => {
      return new NextRequest('http://localhost:3000/api/ai-inbox/items', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    };

    it('should return 401 when not authenticated', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      } as unknown as ReturnType<typeof createClient>);

      const response = await POST(createPostRequest({ title: 'Test' }));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should create an item with valid data', async () => {
      const mockItem = {
        id: 'new-item-1',
        user_id: 'user-123',
        title: 'New Item',
        url: 'https://example.com/article',
        source_type: 'manual',
        category: 'news',
        status: 'unread',
        raw_content: null,
        ai_analysis: null,
        tags: [],
        is_favorite: false,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      vi.mocked(createItem).mockResolvedValue(mockItem);

      const response = await POST(
        createPostRequest({
          title: 'New Item',
          url: 'https://example.com/article',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockItem);
      expect(createItem).toHaveBeenCalledWith({
        title: 'New Item',
        url: 'https://example.com/article',
        source_type: undefined,
        category: undefined,
        raw_content: undefined,
        tags: undefined,
      });
    });

    it('should create an item with all fields', async () => {
      const mockItem = {
        id: 'new-item-2',
        user_id: 'user-123',
        title: 'Full Item',
        url: 'https://youtube.com/watch?v=123',
        source_type: 'youtube',
        category: 'tutorials',
        status: 'unread',
        raw_content: 'Some content',
        ai_analysis: null,
        tags: ['ai', 'tutorial'],
        is_favorite: false,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      vi.mocked(createItem).mockResolvedValue(mockItem);

      const response = await POST(
        createPostRequest({
          title: 'Full Item',
          url: 'https://youtube.com/watch?v=123',
          source_type: 'youtube',
          category: 'tutorials',
          raw_content: 'Some content',
          tags: ['ai', 'tutorial'],
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockItem);
    });

    it('should return 400 for missing title', async () => {
      const response = await POST(createPostRequest({}));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for empty title', async () => {
      const response = await POST(createPostRequest({ title: '' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContain('Title is required');
    });

    it('should return 400 for title too long', async () => {
      const response = await POST(
        createPostRequest({ title: 'x'.repeat(501) })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContain('Title must be 500 characters or less');
    });

    it('should return 400 for invalid URL', async () => {
      const response = await POST(
        createPostRequest({
          title: 'Test',
          url: 'not-a-valid-url',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContain('Invalid URL format');
    });

    it('should return 400 for invalid source_type', async () => {
      const response = await POST(
        createPostRequest({
          title: 'Test',
          source_type: 'invalid',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for invalid category', async () => {
      const response = await POST(
        createPostRequest({
          title: 'Test',
          category: 'invalid',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 500 when createItem returns null', async () => {
      vi.mocked(createItem).mockResolvedValue(null);

      const response = await POST(createPostRequest({ title: 'Test' }));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to create item');
    });

    it('should return 500 on error', async () => {
      vi.mocked(createItem).mockRejectedValue(new Error('Database error'));

      const response = await POST(createPostRequest({ title: 'Test' }));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
