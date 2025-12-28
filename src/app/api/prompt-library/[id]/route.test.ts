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

// Mock Supabase
const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
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

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

describe('GET /api/prompt-library/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123');
    const params = Promise.resolve({ id: 'test-id-123' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return prompt if authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    vi.mocked(getPrompt).mockResolvedValue(mockPrompt);

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123');
    const params = Promise.resolve({ id: 'test-id-123' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockPrompt);
  });

  it('should return 404 if prompt not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    vi.mocked(getPrompt).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/prompt-library/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await GET(request, { params });

    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/prompt-library/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' }),
    });
    const params = Promise.resolve({ id: 'test-id-123' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should update prompt if authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    const updatedPrompt = { ...mockPrompt, title: 'Updated Title' };
    vi.mocked(updatePrompt).mockResolvedValue(updatedPrompt);

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' }),
    });
    const params = Promise.resolve({ id: 'test-id-123' });
    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(updatedPrompt);
  });
});

describe('DELETE /api/prompt-library/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id-123' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should delete prompt if authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    vi.mocked(deletePrompt).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/prompt-library/test-id-123', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id-123' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
