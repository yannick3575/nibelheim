import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from './route';

// Mock the ai-inbox lib
vi.mock('@/lib/ai-inbox', () => ({
  getItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
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

import { getItem, updateItem, deleteItem } from '@/lib/ai-inbox';
import { createClient } from '@/lib/supabase/server';

describe('/api/ai-inbox/items/[id]', () => {
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

  const createRequest = (method: string, body?: unknown) => {
    return new NextRequest(
      'http://localhost:3000/api/ai-inbox/items/item-1',
      {
        method,
        body: body ? JSON.stringify(body) : undefined,
      }
    );
  };

  const createParams = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      } as unknown as ReturnType<typeof createClient>);

      const response = await GET(createRequest('GET'), createParams('item-1'));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return item when found', async () => {
      const mockItem = {
        id: 'item-1',
        user_id: 'user-123',
        title: 'Test Item',
        url: 'https://example.com',
        source_type: 'manual',
        category: 'news',
        status: 'unread',
        raw_content: 'Content here',
        ai_analysis: null,
        tags: ['test'],
        is_favorite: false,
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z',
      };

      vi.mocked(getItem).mockResolvedValue(mockItem);

      const response = await GET(createRequest('GET'), createParams('item-1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockItem);
      expect(getItem).toHaveBeenCalledWith('item-1');
    });

    it('should return 404 when item not found', async () => {
      vi.mocked(getItem).mockResolvedValue(null);

      const response = await GET(createRequest('GET'), createParams('item-1'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Item not found');
    });

    it('should return 500 on error', async () => {
      vi.mocked(getItem).mockRejectedValue(new Error('Database error'));

      const response = await GET(createRequest('GET'), createParams('item-1'));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('PATCH', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      } as unknown as ReturnType<typeof createClient>);

      const response = await PATCH(
        createRequest('PATCH', { status: 'read' }),
        createParams('item-1')
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should update item status', async () => {
      vi.mocked(updateItem).mockResolvedValue(true);

      const response = await PATCH(
        createRequest('PATCH', { status: 'read' }),
        createParams('item-1')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updateItem).toHaveBeenCalledWith('item-1', { status: 'read' });
    });

    it('should update item favorite status', async () => {
      vi.mocked(updateItem).mockResolvedValue(true);

      const response = await PATCH(
        createRequest('PATCH', { is_favorite: true }),
        createParams('item-1')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updateItem).toHaveBeenCalledWith('item-1', { is_favorite: true });
    });

    it('should update item category', async () => {
      vi.mocked(updateItem).mockResolvedValue(true);

      const response = await PATCH(
        createRequest('PATCH', { category: 'tools' }),
        createParams('item-1')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updateItem).toHaveBeenCalledWith('item-1', { category: 'tools' });
    });

    it('should update multiple fields', async () => {
      vi.mocked(updateItem).mockResolvedValue(true);

      const response = await PATCH(
        createRequest('PATCH', {
          status: 'archived',
          is_favorite: true,
          tags: ['important'],
        }),
        createParams('item-1')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updateItem).toHaveBeenCalledWith('item-1', {
        status: 'archived',
        is_favorite: true,
        tags: ['important'],
      });
    });

    it('should return 400 for empty body', async () => {
      const response = await PATCH(
        createRequest('PATCH', {}),
        createParams('item-1')
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContain('At least one field');
    });

    it('should return 400 for invalid status', async () => {
      const response = await PATCH(
        createRequest('PATCH', { status: 'invalid' }),
        createParams('item-1')
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for invalid category', async () => {
      const response = await PATCH(
        createRequest('PATCH', { category: 'invalid' }),
        createParams('item-1')
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for invalid is_favorite type', async () => {
      const response = await PATCH(
        createRequest('PATCH', { is_favorite: 'yes' }),
        createParams('item-1')
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 500 when updateItem fails', async () => {
      vi.mocked(updateItem).mockResolvedValue(false);

      const response = await PATCH(
        createRequest('PATCH', { status: 'read' }),
        createParams('item-1')
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update item');
    });

    it('should return 500 on error', async () => {
      vi.mocked(updateItem).mockRejectedValue(new Error('Database error'));

      const response = await PATCH(
        createRequest('PATCH', { status: 'read' }),
        createParams('item-1')
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('DELETE', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      } as unknown as ReturnType<typeof createClient>);

      const response = await DELETE(
        createRequest('DELETE'),
        createParams('item-1')
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should delete item successfully', async () => {
      vi.mocked(deleteItem).mockResolvedValue(true);

      const response = await DELETE(
        createRequest('DELETE'),
        createParams('item-1')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(deleteItem).toHaveBeenCalledWith('item-1');
    });

    it('should return 500 when deleteItem fails', async () => {
      vi.mocked(deleteItem).mockResolvedValue(false);

      const response = await DELETE(
        createRequest('DELETE'),
        createParams('item-1')
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete item');
    });

    it('should return 500 on error', async () => {
      vi.mocked(deleteItem).mockRejectedValue(new Error('Database error'));

      const response = await DELETE(
        createRequest('DELETE'),
        createParams('item-1')
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
