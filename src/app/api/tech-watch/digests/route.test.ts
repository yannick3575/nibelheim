import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock the tech-watch lib
vi.mock('@/lib/tech-watch', () => ({
  getDigests: vi.fn(),
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    log: vi.fn(),
  },
}));

import { getDigests } from '@/lib/tech-watch';

describe('GET /api/tech-watch/digests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return list of digests', async () => {
    const mockDigests = [
      {
        id: 'digest-1',
        date: '2024-01-15',
        article_count: 2,
      },
      {
        id: 'digest-2',
        date: '2024-01-14',
        article_count: 1,
      },
    ];

    vi.mocked(getDigests).mockResolvedValue(mockDigests);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockDigests);
    expect(data).toHaveLength(2);
  });

  it('should return empty array when no digests', async () => {
    vi.mocked(getDigests).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it('should return 500 on error', async () => {
    vi.mocked(getDigests).mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
