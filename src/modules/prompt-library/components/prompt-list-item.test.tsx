import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromptListItem } from './prompt-list-item';
import type { Prompt } from '@/lib/prompt-library/types';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock clipboard API
const mockWriteText = vi.fn();
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: mockWriteText },
  writable: true,
  configurable: true,
});

// Mock window.confirm - No longer needed as we use AlertDialog, but keeping for safety if reused
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { toast } from 'sonner';

describe('PromptListItem', () => {
  const mockPrompt: Prompt = {
    id: 'test-id-123',
    user_id: 'user-123',
    title: 'Test Prompt Title',
    content: 'This is test content without variables.',
    category: 'coding',
    tags: ['test', 'example'],
    is_favorite: false,
    is_automated: false,
    status: 'published',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockPromptWithVariables: Prompt = {
    ...mockPrompt,
    content: 'Hello {{name}}, your code is {{code}}.',
  };

  const defaultProps = {
    prompt: mockPrompt,
    onDelete: vi.fn(),
    onUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockConfirm.mockReset();
    mockWriteText.mockClear();
  });

  it('should render prompt title', () => {
    render(<PromptListItem {...defaultProps} />);
    expect(screen.getByText('Test Prompt Title')).toBeInTheDocument();
  });

  it('should render category badge', () => {
    render(<PromptListItem {...defaultProps} />);
    expect(screen.getByText('coding')).toBeInTheDocument();
  });

  it('should render tags (up to 2)', () => {
    render(<PromptListItem {...defaultProps} />);
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('example')).toBeInTheDocument();
  });

  it('should show +N when more than 2 tags', () => {
    const promptWithManyTags = {
      ...mockPrompt,
      tags: ['tag1', 'tag2', 'tag3', 'tag4'],
    };
    render(<PromptListItem {...defaultProps} prompt={promptWithManyTags} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('should copy content to clipboard when clicking copy (no variables)', async () => {
    render(<PromptListItem {...defaultProps} />);

    // Find the copy button using accessible name
    const copyButton = screen.getByLabelText('Copier');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(mockPrompt.content);
      expect(toast.success).toHaveBeenCalledWith('Copié dans le presse-papier');
    });
  });

  it('should toggle favorite on click', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...mockPrompt, is_favorite: true }),
    });

    render(<PromptListItem {...defaultProps} />);

    // Find the favorite button using accessible name
    const favoriteButton = screen.getByLabelText('Ajouter aux favoris');
    fireEvent.click(favoriteButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/prompt-library/${mockPrompt.id}`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ is_favorite: true }),
        })
      );
    });
  });

  it('should show success toast on favorite toggle', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...mockPrompt, is_favorite: true }),
    });

    render(<PromptListItem {...defaultProps} />);

    const favoriteButton = screen.getByLabelText('Ajouter aux favoris');
    fireEvent.click(favoriteButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Ajouté aux favoris');
    });
  });

  it('should show error toast on favorite toggle failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    render(<PromptListItem {...defaultProps} />);

    const favoriteButton = screen.getByLabelText('Ajouter aux favoris');
    fireEvent.click(favoriteButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erreur lors de la mise à jour');
    });
  });

  it('should show favorite star filled when is_favorite is true', () => {
    render(<PromptListItem {...defaultProps} prompt={{ ...mockPrompt, is_favorite: true }} />);
    // Since we can't easily query by class, we check if the label changed
    expect(screen.getByLabelText('Retirer des favoris')).toBeInTheDocument();
  });

  it('should show variables icon for prompts with variables', () => {
    render(<PromptListItem {...defaultProps} prompt={mockPromptWithVariables} />);
    const bracesIcon = document.querySelector('svg.lucide-braces');
    expect(bracesIcon).toBeInTheDocument();
  });
});
