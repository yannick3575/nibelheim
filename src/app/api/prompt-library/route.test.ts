import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

// Mock the prompt-library functions
vi.mock('@/lib/prompt-library', () => ({
  getPrompts: vi.fn(),
  createPrompt: vi.fn(),
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
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

import { getPrompts, createPrompt } from '@/lib/prompt-library';

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

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

describe('GET /api/prompt-library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest('http://localhost:3000/api/prompt-library');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return all prompts if authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    vi.mocked(getPrompts).mockResolvedValue([mockPrompt]);

    const request = new NextRequest('http://localhost:3000/api/prompt-library');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([mockPrompt]);
    expect(getPrompts).toHaveBeenCalledWith({});
  });

  it('should filter by category', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    vi.mocked(getPrompts).mockResolvedValue([mockPrompt]);

    const request = new NextRequest('http://localhost:3000/api/prompt-library?category=coding');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(getPrompts).toHaveBeenCalledWith({ category: 'coding' });
  });

  it('should filter by favorites', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    vi.mocked(getPrompts).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/prompt-library?favorites=true');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(getPrompts).toHaveBeenCalledWith({ favorites: true });
  });

  it('should filter by tags', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    vi.mocked(getPrompts).mockResolvedValue([mockPrompt]);

    const request = new NextRequest('http://localhost:3000/api/prompt-library?tags=test,example');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(getPrompts).toHaveBeenCalledWith({ tags: ['test', 'example'] });
  });

  it('should filter by search', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    vi.mocked(getPrompts).mockResolvedValue([mockPrompt]);

    const request = new NextRequest('http://localhost:3000/api/prompt-library?search=hello');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(getPrompts).toHaveBeenCalledWith({ search: 'hello' });
  });

  it('should handle multiple filters', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    vi.mocked(getPrompts).mockResolvedValue([mockPrompt]);

    const request = new NextRequest(
      'http://localhost:3000/api/prompt-library?category=coding&favorites=true&search=test'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(getPrompts).toHaveBeenCalledWith({
      category: 'coding',
      favorites: true,
      search: 'test',
    });
  });

  it('should return 500 on error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    vi.mocked(getPrompts).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/prompt-library');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

describe('POST /api/prompt-library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest('http://localhost:3000/api/prompt-library', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Prompt',
        content: 'Hello {{name}}!',
        category: 'coding',
        tags: ['test'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should create a prompt with valid data', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    vi.mocked(createPrompt).mockResolvedValue(mockPrompt);

    const request = new NextRequest('http://localhost:3000/api/prompt-library', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Prompt',
        content: 'Hello {{name}}!',
        category: 'coding',
        tags: ['test'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(mockPrompt);
  });

  it('should return 400 for missing title', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    const request = new NextRequest('http://localhost:3000/api/prompt-library', {
      method: 'POST',
      body: JSON.stringify({
        content: 'Hello!',
        category: 'coding',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('should return 400 for missing content', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    const request = new NextRequest('http://localhost:3000/api/prompt-library', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test',
        category: 'coding',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('should return 400 for invalid category', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    const request = new NextRequest('http://localhost:3000/api/prompt-library', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test',
        content: 'Hello!',
        category: 'invalid-category',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('should return 400 for content exceeding max length', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    const longContent = 'a'.repeat(50001);

    const request = new NextRequest('http://localhost:3000/api/prompt-library', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test',
        content: longContent,
        category: 'coding',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
    expect(data.details).toContain('50KB');
  });

  it('should return 400 for too many tags', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    const tooManyTags = Array.from({ length: 21 }, (_, i) => `tag${i}`);

    const request = new NextRequest('http://localhost:3000/api/prompt-library', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test',
        content: 'Hello!',
        category: 'coding',
        tags: tooManyTags,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('should return 500 when createPrompt fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    vi.mocked(createPrompt).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/prompt-library', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test',
        content: 'Hello!',
        category: 'coding',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create prompt');
  });

  it('should accept valid categories', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    const categories = ['coding', 'writing', 'analysis', 'creative', 'other'] as const;

    for (const category of categories) {
      vi.mocked(createPrompt).mockResolvedValue({ ...mockPrompt, category });

      const request = new NextRequest('http://localhost:3000/api/prompt-library', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          content: 'Hello!',
          category,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    }
  });
});
