import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreatePromptDialog } from './create-prompt-dialog';
import type { Prompt } from '@/lib/prompt-library/types';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { toast } from 'sonner';

describe('CreatePromptDialog', () => {
  const mockCreatedPrompt: Prompt = {
    id: 'new-id-123',
    user_id: 'user-123',
    title: 'New Prompt',
    content: 'New content',
    category: 'coding',
    tags: ['test'],
    is_favorite: false,
    is_automated: false,
    status: 'published',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onPromptCreated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('should render dialog title', () => {
    render(<CreatePromptDialog {...defaultProps} />);
    expect(screen.getByText('Nouveau prompt')).toBeInTheDocument();
  });

  it('should render form fields', () => {
    render(<CreatePromptDialog {...defaultProps} />);

    expect(screen.getByLabelText('Titre *')).toBeInTheDocument();
    expect(screen.getByLabelText('Contenu *')).toBeInTheDocument();
    // Select component uses a different structure, check by text instead
    expect(screen.getByText('Catégorie')).toBeInTheDocument();
    expect(screen.getByLabelText('Tags (séparés par des virgules)')).toBeInTheDocument();
  });

  it('should render cancel and create buttons', () => {
    render(<CreatePromptDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /créer/i })).toBeInTheDocument();
  });

  it('should have required attributes on inputs', () => {
    render(<CreatePromptDialog {...defaultProps} />);

    const titleInput = screen.getByLabelText('Titre *');
    const contentInput = screen.getByLabelText('Contenu *');

    expect(titleInput).toBeRequired();
    expect(contentInput).toBeRequired();
  });


  it('should create prompt with valid data', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCreatedPrompt),
    });

    render(<CreatePromptDialog {...defaultProps} />);

    const titleInput = screen.getByLabelText('Titre *');
    const contentInput = screen.getByLabelText('Contenu *');
    const tagsInput = screen.getByLabelText('Tags (séparés par des virgules)');

    await user.type(titleInput, 'New Prompt');
    await user.type(contentInput, 'New content');
    await user.type(tagsInput, 'test, example');

    const createButton = screen.getByRole('button', { name: /créer/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/prompt-library',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"title":"New Prompt"'),
        })
      );
    });
  });

  it('should call onPromptCreated after successful creation', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCreatedPrompt),
    });

    render(<CreatePromptDialog {...defaultProps} />);

    const titleInput = screen.getByLabelText('Titre *');
    const contentInput = screen.getByLabelText('Contenu *');

    await user.type(titleInput, 'New Prompt');
    await user.type(contentInput, 'New content');

    const createButton = screen.getByRole('button', { name: /créer/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(defaultProps.onPromptCreated).toHaveBeenCalledWith(mockCreatedPrompt);
      expect(toast.success).toHaveBeenCalledWith('Prompt créé avec succès');
    });
  });

  it('should show loading state while creating', async () => {
    const user = userEvent.setup();
    // Create a promise that doesn't resolve immediately
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockFetch.mockReturnValueOnce(pendingPromise);

    render(<CreatePromptDialog {...defaultProps} />);

    const titleInput = screen.getByLabelText('Titre *');
    const contentInput = screen.getByLabelText('Contenu *');

    await user.type(titleInput, 'New Prompt');
    await user.type(contentInput, 'New content');

    const createButton = screen.getByRole('button', { name: /créer/i });
    await user.click(createButton);

    // Should show loading state
    expect(screen.getByText('Création...')).toBeInTheDocument();

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve(mockCreatedPrompt),
    });
  });

  it('should show error toast on API error', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ details: 'Validation failed' }),
    });

    render(<CreatePromptDialog {...defaultProps} />);

    const titleInput = screen.getByLabelText('Titre *');
    const contentInput = screen.getByLabelText('Contenu *');

    await user.type(titleInput, 'New Prompt');
    await user.type(contentInput, 'New content');

    const createButton = screen.getByRole('button', { name: /créer/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Validation failed');
    });
  });

  it('should reset form after successful creation', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCreatedPrompt),
    });

    render(<CreatePromptDialog {...defaultProps} />);

    const titleInput = screen.getByLabelText('Titre *');
    const contentInput = screen.getByLabelText('Contenu *');

    await user.type(titleInput, 'New Prompt');
    await user.type(contentInput, 'New content');

    const createButton = screen.getByRole('button', { name: /créer/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(titleInput).toHaveValue('');
      expect(contentInput).toHaveValue('');
    });
  });

  it('should call onOpenChange when clicking cancel', async () => {
    const user = userEvent.setup();
    render(<CreatePromptDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /annuler/i });
    await user.click(cancelButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should not render when open is false', () => {
    render(<CreatePromptDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Nouveau prompt')).not.toBeInTheDocument();
  });

  it('should parse tags correctly', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCreatedPrompt),
    });

    render(<CreatePromptDialog {...defaultProps} />);

    const titleInput = screen.getByLabelText('Titre *');
    const contentInput = screen.getByLabelText('Contenu *');
    const tagsInput = screen.getByLabelText('Tags (séparés par des virgules)');

    await user.type(titleInput, 'Test');
    await user.type(contentInput, 'Content');
    await user.type(tagsInput, '  Tag1 , TAG2,  tag3  ');

    const createButton = screen.getByRole('button', { name: /créer/i });
    await user.click(createButton);

    await waitFor(() => {
      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  it('should filter out empty tags', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCreatedPrompt),
    });

    render(<CreatePromptDialog {...defaultProps} />);

    const titleInput = screen.getByLabelText('Titre *');
    const contentInput = screen.getByLabelText('Contenu *');
    const tagsInput = screen.getByLabelText('Tags (séparés par des virgules)');

    await user.type(titleInput, 'Test');
    await user.type(contentInput, 'Content');
    await user.type(tagsInput, 'tag1, , , tag2');

    const createButton = screen.getByRole('button', { name: /créer/i });
    await user.click(createButton);

    await waitFor(() => {
      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.tags).toEqual(['tag1', 'tag2']);
    });
  });

  it('should trim title and content', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCreatedPrompt),
    });

    render(<CreatePromptDialog {...defaultProps} />);

    const titleInput = screen.getByLabelText('Titre *');
    const contentInput = screen.getByLabelText('Contenu *');

    await user.type(titleInput, '  Trimmed Title  ');
    await user.type(contentInput, '  Trimmed Content  ');

    const createButton = screen.getByRole('button', { name: /créer/i });
    await user.click(createButton);

    await waitFor(() => {
      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.title).toBe('Trimmed Title');
      expect(body.content).toBe('Trimmed Content');
    });
  });
});
