import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH, DELETE } from './route';

// Mock the tech-watch lib
vi.mock('@/lib/tech-watch', () => ({
  updateSource: vi.fn(),
  deleteSource: vi.fn(),
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    log: vi.fn(),
  },
}));

import { updateSource, deleteSource } from '@/lib/tech-watch';

describe('/api/tech-watch/sources/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (method: string, body?: unknown) => {
    return new NextRequest('http://localhost:3000/api/tech-watch/sources/source-1', {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  const createParams = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  describe('PATCH', () => {
    it('should update source with valid data', async () => {
      vi.mocked(updateSource).mockResolvedValue(true);

      const response = await PATCH(
        createRequest('PATCH', { name: 'Updated Name', enabled: false }),
        createParams('source-1')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updateSource).toHaveBeenCalledWith('source-1', {
        name: 'Updated Name',
        enabled: false,
      });
    });

    it('should update source URL', async () => {
      vi.mocked(updateSource).mockResolvedValue(true);

      const response = await PATCH(
        createRequest('PATCH', { url: 'https://new-url.com/feed' }),
        createParams('source-1')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updateSource).toHaveBeenCalledWith('source-1', {
        url: 'https://new-url.com/feed',
      });
    });

    it('should update source config', async () => {
      vi.mocked(updateSource).mockResolvedValue(true);

      const config = { apiKey: 'secret', limit: 10 };
      const response = await PATCH(
        createRequest('PATCH', { config }),
        createParams('source-1')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updateSource).toHaveBeenCalledWith('source-1', { config });
    });

    it('should return 400 for name too short', async () => {
      const response = await PATCH(
        createRequest('PATCH', { name: '' }),
        createParams('source-1')
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for name too long', async () => {
      const response = await PATCH(
        createRequest('PATCH', { name: 'x'.repeat(101) }),
        createParams('source-1')
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for invalid URL', async () => {
      const response = await PATCH(
        createRequest('PATCH', { url: 'not-a-url' }),
        createParams('source-1')
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for invalid enabled type', async () => {
      const response = await PATCH(
        createRequest('PATCH', { enabled: 'yes' }),
        createParams('source-1')
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 500 when updateSource fails', async () => {
      vi.mocked(updateSource).mockResolvedValue(false);

      const response = await PATCH(
        createRequest('PATCH', { name: 'New Name' }),
        createParams('source-1')
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update source');
    });

    it('should return 500 on error', async () => {
      vi.mocked(updateSource).mockRejectedValue(new Error('Database error'));

      const response = await PATCH(
        createRequest('PATCH', { name: 'New Name' }),
        createParams('source-1')
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('DELETE', () => {
    it('should delete source successfully', async () => {
      vi.mocked(deleteSource).mockResolvedValue(true);

      const response = await DELETE(
        createRequest('DELETE'),
        createParams('source-1')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(deleteSource).toHaveBeenCalledWith('source-1');
    });

    it('should return 500 when deleteSource fails', async () => {
      vi.mocked(deleteSource).mockResolvedValue(false);

      const response = await DELETE(
        createRequest('DELETE'),
        createParams('source-1')
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete source');
    });

    it('should return 500 on error', async () => {
      vi.mocked(deleteSource).mockRejectedValue(new Error('Database error'));

      const response = await DELETE(
        createRequest('DELETE'),
        createParams('source-1')
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
