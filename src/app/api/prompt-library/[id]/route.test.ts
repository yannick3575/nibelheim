import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from './route';
import { NextRequest } from 'next/server';

// Mock the prompt-library functions
vi.mock('@/lib/prompt-library', () => ({
  getPrompt: vi.fn(),
  updatePrompt: vi.fn(),
  deletePrompt: vi.fn(),
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

import { getPrompt, updatePrompt, deletePrompt } from '@/lib/prompt-library';

const mockPrompt = {
  id: 'test-id-123',
  user_id: 'user-123',
  title: 'Test Prompt',
  content: 'Hello {{name}}!',
  category: 'coding' as const,
  tags: ['test', 'example'],
  is_favorite: false,
  is_automated: false,
  status: 'published' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const createRouteParams = (id: string) => ({
  params: Promise.resolve({ id }),
});

describe('GET /api/prompt-library/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a prompt by id', async () => {
    vi.mocked(getPrompt).mockResolvedValue(mockPrompt);

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123');
    const response = await GET(request, createRouteParams('test-id-123'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockPrompt);
    expect(getPrompt).toHaveBeenCalledWith('test-id-123');
  });

  it('should return 404 for non-existent prompt', async () => {
    vi.mocked(getPrompt).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/prompt-library/non-existent');
    const response = await GET(request, createRouteParams('non-existent'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Prompt not found');
  });

  it('should return 500 on error', async () => {
    vi.mocked(getPrompt).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id');
    const response = await GET(request, createRouteParams('test-id'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

describe('PATCH /api/prompt-library/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update prompt title', async () => {
    const updatedPrompt = { ...mockPrompt, title: 'Updated Title' };
    vi.mocked(updatePrompt).mockResolvedValue(updatedPrompt);

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' }),
    });

    const response = await PATCH(request, createRouteParams('test-id-123'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('Updated Title');
    expect(updatePrompt).toHaveBeenCalledWith('test-id-123', { title: 'Updated Title' });
  });

  it('should update prompt content', async () => {
    const updatedPrompt = { ...mockPrompt, content: 'New content' };
    vi.mocked(updatePrompt).mockResolvedValue(updatedPrompt);

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'New content' }),
    });

    const response = await PATCH(request, createRouteParams('test-id-123'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.content).toBe('New content');
  });

  it('should update is_favorite', async () => {
    const updatedPrompt = { ...mockPrompt, is_favorite: true };
    vi.mocked(updatePrompt).mockResolvedValue(updatedPrompt);

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123', {
      method: 'PATCH',
      body: JSON.stringify({ is_favorite: true }),
    });

    const response = await PATCH(request, createRouteParams('test-id-123'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.is_favorite).toBe(true);
  });

  it('should update multiple fields', async () => {
    const updatedPrompt = { ...mockPrompt, title: 'New', category: 'writing' as const };
    vi.mocked(updatePrompt).mockResolvedValue(updatedPrompt);

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123', {
      method: 'PATCH',
      body: JSON.stringify({
        title: 'New',
        category: 'writing',
        tags: ['updated'],
      }),
    });

    const response = await PATCH(request, createRouteParams('test-id-123'));

    expect(response.status).toBe(200);
    expect(updatePrompt).toHaveBeenCalledWith('test-id-123', {
      title: 'New',
      category: 'writing',
      tags: ['updated'],
    });
  });

  it('should return 400 for empty body', async () => {
    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });

    const response = await PATCH(request, createRouteParams('test-id-123'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
    expect(data.details).toBe('At least one field must be provided');
  });

  it('should return 400 for invalid category', async () => {
    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123', {
      method: 'PATCH',
      body: JSON.stringify({ category: 'invalid' }),
    });

    const response = await PATCH(request, createRouteParams('test-id-123'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('should return 400 for content exceeding max length', async () => {
    const longContent = 'a'.repeat(50001);

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123', {
      method: 'PATCH',
      body: JSON.stringify({ content: longContent }),
    });

    const response = await PATCH(request, createRouteParams('test-id-123'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('should return 400 for too many tags', async () => {
    const tooManyTags = Array.from({ length: 21 }, (_, i) => `tag${i}`);

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123', {
      method: 'PATCH',
      body: JSON.stringify({ tags: tooManyTags }),
    });

    const response = await PATCH(request, createRouteParams('test-id-123'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('should return 400 for tag exceeding max length', async () => {
    const longTag = 'a'.repeat(51);

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123', {
      method: 'PATCH',
      body: JSON.stringify({ tags: [longTag] }),
    });

    const response = await PATCH(request, createRouteParams('test-id-123'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('should return 500 when updatePrompt fails', async () => {
    vi.mocked(updatePrompt).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    });

    const response = await PATCH(request, createRouteParams('test-id-123'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update prompt');
  });
});

describe('DELETE /api/prompt-library/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete a prompt', async () => {
    vi.mocked(deletePrompt).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, createRouteParams('test-id-123'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(deletePrompt).toHaveBeenCalledWith('test-id-123');
  });

  it('should return 500 when deletePrompt fails', async () => {
    vi.mocked(deletePrompt).mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, createRouteParams('test-id-123'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to delete prompt');
  });

  it('should return 500 on error', async () => {
    vi.mocked(deletePrompt).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id', {
      method: 'DELETE',
    });

    const response = await DELETE(request, createRouteParams('test-id'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
