import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromptCard } from './prompt-card';
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

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { toast } from 'sonner';

describe('PromptCard', () => {
  const mockPrompt: Prompt = {
    id: 'test-id-123',
    user_id: 'user-123',
    title: 'Test Prompt Title',
    content: 'This is test content without variables.',
    category: 'coding',
    tags: ['test', 'example', 'demo'],
    is_favorite: false,
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
    render(<PromptCard {...defaultProps} />);
    expect(screen.getByText('Test Prompt Title')).toBeInTheDocument();
  });

  it('should render prompt content', () => {
    render(<PromptCard {...defaultProps} />);
    expect(screen.getByText('This is test content without variables.')).toBeInTheDocument();
  });

  it('should render category badge', () => {
    render(<PromptCard {...defaultProps} />);
    expect(screen.getByText('coding')).toBeInTheDocument();
  });

  it('should render tags (up to 3)', () => {
    render(<PromptCard {...defaultProps} />);
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('example')).toBeInTheDocument();
    expect(screen.getByText('demo')).toBeInTheDocument();
  });

  it('should show +N when more than 3 tags', () => {
    const promptWithManyTags = {
      ...mockPrompt,
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
    };
    render(<PromptCard {...defaultProps} prompt={promptWithManyTags} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('should show copy button for prompt without variables', () => {
    render(<PromptCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /copier/i })).toBeInTheDocument();
  });

  it('should show "Remplir & copier" for prompt with variables', () => {
    render(<PromptCard {...defaultProps} prompt={mockPromptWithVariables} />);
    expect(screen.getByRole('button', { name: /remplir & copier/i })).toBeInTheDocument();
  });

  it('should copy content to clipboard when clicking copy (no variables)', async () => {
    render(<PromptCard {...defaultProps} />);

    const copyButton = screen.getByRole('button', { name: /copier/i });
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

    render(<PromptCard {...defaultProps} />);

    // Find the favorite button by looking for the star icon's parent button
    const starIcon = document.querySelector('svg.lucide-star');
    const favoriteButton = starIcon?.closest('button');

    if (favoriteButton) {
      fireEvent.click(favoriteButton);
    }

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

  it('should revert favorite on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    render(<PromptCard {...defaultProps} />);

    const starIcon = document.querySelector('svg.lucide-star');
    const favoriteButton = starIcon?.closest('button');

    if (favoriteButton) {
      fireEvent.click(favoriteButton);
    }

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erreur lors de la mise à jour');
    });
  });

  it('should show favorite star filled when is_favorite is true', () => {
    render(<PromptCard {...defaultProps} prompt={{ ...mockPrompt, is_favorite: true }} />);
    const starIcon = document.querySelector('svg.lucide-star.fill-yellow-500');
    expect(starIcon).toBeInTheDocument();
  });

  it('should show variables icon for prompts with variables', () => {
    render(<PromptCard {...defaultProps} prompt={mockPromptWithVariables} />);
    const bracesIcon = document.querySelector('svg.lucide-braces');
    expect(bracesIcon).toBeInTheDocument();
  });

  it('should not show variables icon for prompts without variables', () => {
    render(<PromptCard {...defaultProps} />);
    const titleArea = screen.getByText('Test Prompt Title').closest('div');
    const bracesIcon = titleArea?.querySelector('svg.lucide-braces');
    expect(bracesIcon).not.toBeInTheDocument();
  });
});
