import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractPromptsFromContent, discoverFromUrl, discoverAndSavePrompts } from './prompt-discovery';
import { createPrompt, getAllTags } from './prompt-library';

// 1. Define the mock function variables using vi.hoisted
const mocks = vi.hoisted(() => {
  const generateContentMock = vi.fn();
  const getGenerativeModelMock = vi.fn(() => ({
    generateContent: generateContentMock
  }));
  return { generateContentMock, getGenerativeModelMock };
});

// 2. Mock the module using these variables
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel = mocks.getGenerativeModelMock;
    }
  };
});

vi.mock('./prompt-library', () => ({
  createPrompt: vi.fn(),
  getAllTags: vi.fn(),
}));

vi.mock('./logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Global fetch mock
global.fetch = vi.fn();

describe('prompt-discovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';
    
    // Default mock implementation for generateContent
    mocks.generateContentMock.mockReset();
  });

  describe('extractPromptsFromContent', () => {
    it('should extract prompts correctly from Gemini response', async () => {
      const mockResponse = {
        response: {
          text: () => '```json\n[{"title": "Test Prompt", "content": "Hello", "category": "coding", "tags": ["test"]}]\n```',
        },
      };
      
      mocks.generateContentMock.mockResolvedValue(mockResponse);

      const result = await extractPromptsFromContent('raw content', ['existing']);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Prompt');
      expect(mocks.generateContentMock).toHaveBeenCalled();
    });

    it('should return empty array on failure', async () => {
      mocks.generateContentMock.mockRejectedValue(new Error('AI error'));

      const result = await extractPromptsFromContent('content');

      expect(result).toEqual([]);
    });
  });

  describe('discoverFromUrl', () => {
    it('should fetch content and extract prompts', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('remote content'),
      } as any);

      const mockResponse = {
        response: {
          text: () => '```json\n[{"title": "Remote Prompt", "content": "Remote", "category": "writing", "tags": []}]\n```',
        },
      };
      mocks.generateContentMock.mockResolvedValue(mockResponse);

      const result = await discoverFromUrl('http://example.com');

      expect(fetch).toHaveBeenCalledWith('http://example.com');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Remote Prompt');
    });
  });

  describe('discoverAndSavePrompts', () => {
    it('should discover and save multiple prompts as drafts', async () => {
      vi.mocked(getAllTags).mockResolvedValue(['tag1']);
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('content'),
      } as any);

      const mockResponse = {
        response: {
          text: () => '```json\n[{"title": "P1", "content": "C1", "category": "coding", "tags": ["t1"]}]\n```',
        },
      };
      mocks.generateContentMock.mockResolvedValue(mockResponse);

      vi.mocked(createPrompt).mockResolvedValue({ id: 'new-id' } as any);

      const result = await discoverAndSavePrompts('user-1');

      expect(getAllTags).toHaveBeenCalled();
      expect(createPrompt).toHaveBeenCalled();
      // Expect 2 calls because there are 2 URLs in DISCOVERY_SOURCES
      expect(result).toHaveLength(2); 
      expect(result[0].id).toBe('new-id');
    });
  });
});
