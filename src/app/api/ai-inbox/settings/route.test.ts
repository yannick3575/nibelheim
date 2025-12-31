import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT } from './route';

// Mock the ai-inbox lib
vi.mock('@/lib/ai-inbox', () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
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

import { getSettings, updateSettings } from '@/lib/ai-inbox';
import { createClient } from '@/lib/supabase/server';

describe('/api/ai-inbox/settings', () => {
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

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      } as unknown as ReturnType<typeof createClient>);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return settings', async () => {
      const mockSettings = {
        id: 'settings-1',
        user_id: 'user-123',
        profile: {
          current_stack: ['Next.js', 'Supabase'],
          current_projects: ['Nibelheim'],
          skill_level: 'intermediate',
          interests: ['AI', 'automation'],
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(getSettings).mockResolvedValue(mockSettings);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSettings);
      expect(getSettings).toHaveBeenCalled();
    });

    it('should return 500 when getSettings returns null', async () => {
      vi.mocked(getSettings).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to get settings');
    });

    it('should return 500 on error', async () => {
      vi.mocked(getSettings).mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('PUT', () => {
    const createRequest = (body: unknown) => {
      return new NextRequest('http://localhost:3000/api/ai-inbox/settings', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    };

    it('should return 401 when not authenticated', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      } as unknown as ReturnType<typeof createClient>);

      const response = await PUT(
        createRequest({
          profile: {
            current_stack: [],
            current_projects: [],
            skill_level: 'beginner',
            interests: [],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should update settings with valid profile', async () => {
      vi.mocked(updateSettings).mockResolvedValue(true);

      const profile = {
        current_stack: ['React', 'TypeScript'],
        current_projects: ['Project A'],
        skill_level: 'advanced' as const,
        interests: ['AI', 'ML'],
      };

      const response = await PUT(createRequest({ profile }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updateSettings).toHaveBeenCalledWith(profile);
    });

    it('should use defaults for missing profile fields', async () => {
      vi.mocked(updateSettings).mockResolvedValue(true);

      const response = await PUT(createRequest({ profile: {} }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updateSettings).toHaveBeenCalledWith({
        current_stack: [],
        current_projects: [],
        skill_level: 'intermediate',
        interests: [],
      });
    });

    it('should return 400 for missing profile', async () => {
      const response = await PUT(createRequest({}));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for invalid skill_level', async () => {
      const response = await PUT(
        createRequest({
          profile: {
            current_stack: [],
            current_projects: [],
            skill_level: 'expert',
            interests: [],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContain('Skill level must be');
    });

    it('should return 400 for invalid current_stack type', async () => {
      const response = await PUT(
        createRequest({
          profile: {
            current_stack: 'not an array',
            current_projects: [],
            skill_level: 'beginner',
            interests: [],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 500 when updateSettings fails', async () => {
      vi.mocked(updateSettings).mockResolvedValue(false);

      const response = await PUT(
        createRequest({
          profile: {
            current_stack: [],
            current_projects: [],
            skill_level: 'beginner',
            interests: [],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update settings');
    });

    it('should return 500 on error', async () => {
      vi.mocked(updateSettings).mockRejectedValue(new Error('Database error'));

      const response = await PUT(
        createRequest({
          profile: {
            current_stack: [],
            current_projects: [],
            skill_level: 'beginner',
            interests: [],
          },
        })
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
