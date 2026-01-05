import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ArticleCard } from '@/modules/tech-watch/components/article-card';
import type { Article } from '@/lib/tech-watch';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock MarkdownRenderer
vi.mock('@/components/markdown-renderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div data-testid="markdown-content">{content}</div>,
}));

describe('ArticleCard', () => {
  const mockArticle: Article = {
    id: 'test-id-123',
    title: 'Test Article Title',
    url: 'https://example.com/article',
    source: 'hacker_news',
    summary: 'This is a **test** summary.',
    published_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    read: false,
    is_favorite: false,
    tags: ['tech', 'ai'],
    score: 100,
  };

  const defaultProps = {
    article: mockArticle,
    onToggleRead: vi.fn(),
    onToggleFavorite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render article title', () => {
    render(<ArticleCard {...defaultProps} />);
    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
  });

  it('should render markdown summary', () => {
    render(<ArticleCard {...defaultProps} />);
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('This is a **test** summary.');
  });

  it('should render source and tags', () => {
    render(<ArticleCard {...defaultProps} />);
    expect(screen.getByText('hacker news')).toBeInTheDocument(); // capitalized by css but text is consistent
    expect(screen.getByText('tech')).toBeInTheDocument();
    expect(screen.getByText('ai')).toBeInTheDocument();
  });

  it('should show read/unread toggle button', () => {
    render(<ArticleCard {...defaultProps} />);
    // Updated to use getByRole which checks aria-label
    const button = screen.getByRole('button', { name: 'Marquer comme lu' });
    expect(button).toBeInTheDocument();
  });

  it('should show favorite toggle button', () => {
    render(<ArticleCard {...defaultProps} />);
    // Updated to use getByRole which checks aria-label
    const button = screen.getByRole('button', { name: 'Ajouter aux favoris' });
    expect(button).toBeInTheDocument();
  });

  it('should toggle favorite on click', async () => {
    render(<ArticleCard {...defaultProps} />);
    const button = screen.getByRole('button', { name: 'Ajouter aux favoris' });

    fireEvent.click(button);

    // Optimistic update should happen (we can't easily check optimistic state in test without more setup,
    // but we can check if the handler was called)
    await waitFor(() => {
      expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('test-id-123', true);
    });
  });

  it('should toggle read status on click', async () => {
    render(<ArticleCard {...defaultProps} />);
    const button = screen.getByRole('button', { name: 'Marquer comme lu' });

    fireEvent.click(button);

    await waitFor(() => {
      expect(defaultProps.onToggleRead).toHaveBeenCalledWith('test-id-123', true);
    });
  });
});
