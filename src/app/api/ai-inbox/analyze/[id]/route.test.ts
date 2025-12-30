import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock the ai-inbox lib
vi.mock('@/lib/ai-inbox', () => ({
  getItem: vi.fn(),
}));

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

import { getItem } from '@/lib/ai-inbox';
import { createClient } from '@/lib/supabase/server';

describe('/api/ai-inbox/analyze/[id]', () => {
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

  const createRequest = () => {
    return new NextRequest(
      'http://localhost:3000/api/ai-inbox/analyze/item-1',
      {
        method: 'POST',
      }
    );
  };

  const createParams = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  describe('POST', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      } as unknown as ReturnType<typeof createClient>);

      const response = await POST(createRequest(), createParams('item-1'));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return success for existing item', async () => {
      const mockItem = {
        id: 'item-1',
        user_id: 'user-123',
        title: 'Test Item',
        url: 'https://example.com',
        source_type: 'manual',
        category: 'news',
        status: 'unread',
        raw_content: 'Content to analyze',
        ai_analysis: null,
        tags: [],
        is_favorite: false,
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z',
      };

      vi.mocked(getItem).mockResolvedValue(mockItem);

      const response = await POST(createRequest(), createParams('item-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Analysis queued');
      expect(getItem).toHaveBeenCalledWith('item-1');
    });

    it('should return 404 when item not found', async () => {
      vi.mocked(getItem).mockResolvedValue(null);

      const response = await POST(createRequest(), createParams('item-1'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Item not found');
    });

    it('should return 500 on error', async () => {
      vi.mocked(getItem).mockRejectedValue(new Error('Database error'));

      const response = await POST(createRequest(), createParams('item-1'));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
