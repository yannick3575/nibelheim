import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPrompts,
  getPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  togglePromptFavorite,
  getAllTags,
} from './index';

// Create mock query builder with chainable methods and thenable support
const createMockQueryBuilder = () => {
  // Default result that can be overridden per test
  let queryResult = { data: null, error: null };

  const builder: Record<string, ReturnType<typeof vi.fn>> & {
    then: (resolve: (value: { data: unknown; error: unknown }) => void) => Promise<void>;
    _setResult: (result: { data: unknown; error: unknown }) => void;
  } = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    contains: vi.fn(() => builder),
    textSearch: vi.fn(() => builder),
    order: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    // Make the builder thenable for `await query` pattern
    then: (resolve) => Promise.resolve(queryResult).then(resolve),
    // Helper to set the result for thenable resolution
    _setResult: (result) => {
      queryResult = result;
    },
  };
  return builder;
};

// Mock Supabase client
const mockQueryBuilder = createMockQueryBuilder();
const mockSupabase = {
  from: vi.fn(() => mockQueryBuilder),
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe('prompt-library CRUD functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock query builder
    Object.values(mockQueryBuilder).forEach((fn) => {
      if (typeof fn.mockClear === 'function') fn.mockClear();
      if (typeof fn.mockReturnValue === 'function') fn.mockReturnValue(mockQueryBuilder);
    });
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: null });
  });

  describe('getPrompts', () => {
    it('should return prompts without filters', async () => {
      const mockPrompts = [
        { id: '1', title: 'Prompt 1', content: 'Content 1' },
        { id: '2', title: 'Prompt 2', content: 'Content 2' },
      ];

      // Use thenable pattern - set result for await query
      mockQueryBuilder._setResult({ data: mockPrompts, error: null });

      const result = await getPrompts();

      expect(mockSupabase.from).toHaveBeenCalledWith('prompt_library_prompts');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('updated_at', { ascending: false });
      // Default status filter is applied
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'published');
      expect(result).toEqual(mockPrompts);
    });

    it('should apply category filter', async () => {
      mockQueryBuilder._setResult({ data: [], error: null });

      await getPrompts({ category: 'coding' });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('category', 'coding');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'published');
    });

    it('should apply favorites filter', async () => {
      mockQueryBuilder._setResult({ data: [], error: null });

      await getPrompts({ favorites: true });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_favorite', true);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'published');
    });

    it('should apply tags filter', async () => {
      mockQueryBuilder._setResult({ data: [], error: null });

      await getPrompts({ tags: ['test', 'example'] });

      expect(mockQueryBuilder.contains).toHaveBeenCalledWith('tags', ['test', 'example']);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'published');
    });

    it('should apply search filter', async () => {
      mockQueryBuilder._setResult({ data: [], error: null });

      await getPrompts({ search: 'hello world' });

      expect(mockQueryBuilder.textSearch).toHaveBeenCalledWith('search_vector', 'hello world', {
        type: 'websearch',
        config: 'english',
      });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'published');
    });

    it('should return empty array on error', async () => {
      mockQueryBuilder._setResult({ data: null, error: new Error('DB error') });

      const result = await getPrompts();

      expect(result).toEqual([]);
    });

    it('should return empty array when data is null', async () => {
      mockQueryBuilder._setResult({ data: null, error: null });

      const result = await getPrompts();

      expect(result).toEqual([]);
    });
  });

  describe('getPrompt', () => {
    it('should return prompt by id', async () => {
      const mockPrompt = { id: 'prompt-1', title: 'Test', content: 'Content' };
      mockQueryBuilder.single.mockResolvedValue({ data: mockPrompt, error: null });

      const result = await getPrompt('prompt-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('prompt_library_prompts');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'prompt-1');
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(mockPrompt);
    });

    it('should return null on error', async () => {
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: new Error('Not found') });

      const result = await getPrompt('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('createPrompt', () => {
    it('should create prompt for authenticated user', async () => {
      const mockUser = { id: 'user-123' };
      const mockPrompt = {
        id: 'new-prompt',
        user_id: 'user-123',
        title: 'New Prompt',
        content: 'New content',
        category: 'coding',
        tags: ['test'],
        is_favorite: false,
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockQueryBuilder.single.mockResolvedValue({ data: mockPrompt, error: null });

      const result = await createPrompt({
        title: '  New Prompt  ',
        content: '  New content  ',
        category: 'coding',
        tags: ['test'],
      });

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        title: 'New Prompt',
        content: 'New content',
        category: 'coding',
        tags: ['test'],
        is_favorite: false,
        source_url: undefined,
        is_automated: false,
        status: 'published',
      });
      expect(result).toEqual(mockPrompt);
    });

    it('should return null when user not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await createPrompt({
        title: 'Test',
        content: 'Content',
        category: 'coding',
      });

      expect(result).toBeNull();
      expect(mockQueryBuilder.insert).not.toHaveBeenCalled();
    });

    it('should return null on insert error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: new Error('Insert failed') });

      const result = await createPrompt({
        title: 'Test',
        content: 'Content',
        category: 'coding',
      });

      expect(result).toBeNull();
    });

    it('should handle default values', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
      mockQueryBuilder.single.mockResolvedValue({ data: {}, error: null });

      await createPrompt({
        title: 'Test',
        content: 'Content',
        category: 'coding',
      });

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: [],
          is_favorite: false,
        })
      );
    });
  });

  describe('updatePrompt', () => {
    it('should update prompt with all fields', async () => {
      const mockUpdated = { id: 'prompt-1', title: 'Updated', content: 'New content' };
      mockQueryBuilder.single.mockResolvedValue({ data: mockUpdated, error: null });

      const result = await updatePrompt('prompt-1', {
        title: '  Updated  ',
        content: '  New content  ',
        category: 'writing',
        tags: ['new', 'tags'],
        is_favorite: true,
      });

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        title: 'Updated',
        content: 'New content',
        category: 'writing',
        tags: ['new', 'tags'],
        is_favorite: true,
      });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'prompt-1');
      expect(result).toEqual(mockUpdated);
    });

    it('should update only provided fields', async () => {
      mockQueryBuilder.single.mockResolvedValue({ data: {}, error: null });

      await updatePrompt('prompt-1', { is_favorite: true });

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        is_favorite: true,
      });
    });

    it('should return null on error', async () => {
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: new Error('Update failed') });

      const result = await updatePrompt('prompt-1', { title: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('deletePrompt', () => {
    it('should delete prompt successfully', async () => {
      mockQueryBuilder.eq.mockResolvedValue({ data: null, error: null });

      const result = await deletePrompt('prompt-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('prompt_library_prompts');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'prompt-1');
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockQueryBuilder.eq.mockResolvedValue({ data: null, error: new Error('Delete failed') });

      const result = await deletePrompt('prompt-1');

      expect(result).toBe(false);
    });
  });

  describe('togglePromptFavorite', () => {
    it('should toggle favorite to true', async () => {
      mockQueryBuilder.eq.mockResolvedValue({ data: null, error: null });

      const result = await togglePromptFavorite('prompt-1', true);

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ is_favorite: true });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'prompt-1');
      expect(result).toBe(true);
    });

    it('should toggle favorite to false', async () => {
      mockQueryBuilder.eq.mockResolvedValue({ data: null, error: null });

      const result = await togglePromptFavorite('prompt-1', false);

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ is_favorite: false });
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockQueryBuilder.eq.mockResolvedValue({ data: null, error: new Error('Toggle failed') });

      const result = await togglePromptFavorite('prompt-1', true);

      expect(result).toBe(false);
    });
  });

  describe('getAllTags', () => {
    it('should return all unique tags sorted', async () => {
      const mockData = [
        { tags: ['react', 'typescript'] },
        { tags: ['nodejs', 'react'] },
        { tags: ['python'] },
      ];
      mockQueryBuilder.select.mockResolvedValue({ data: mockData, error: null });

      const result = await getAllTags();

      expect(mockSupabase.from).toHaveBeenCalledWith('prompt_library_prompts');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('tags');
      expect(result).toEqual(['nodejs', 'python', 'react', 'typescript']);
    });

    it('should handle prompts with null tags', async () => {
      const mockData = [
        { tags: ['react'] },
        { tags: null },
        { tags: ['nodejs'] },
      ];
      mockQueryBuilder.select.mockResolvedValue({ data: mockData, error: null });

      const result = await getAllTags();

      expect(result).toEqual(['nodejs', 'react']);
    });

    it('should return empty array on error', async () => {
      mockQueryBuilder.select.mockResolvedValue({ data: null, error: new Error('Fetch failed') });

      const result = await getAllTags();

      expect(result).toEqual([]);
    });

    it('should return empty array when no data', async () => {
      mockQueryBuilder.select.mockResolvedValue({ data: null, error: null });

      const result = await getAllTags();

      expect(result).toEqual([]);
    });

    it('should return empty array when all tags are empty', async () => {
      const mockData = [{ tags: [] }, { tags: [] }];
      mockQueryBuilder.select.mockResolvedValue({ data: mockData, error: null });

      const result = await getAllTags();

      expect(result).toEqual([]);
    });
  });
});
