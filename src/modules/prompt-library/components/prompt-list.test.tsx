
import { render, screen } from '@testing-library/react';
import { PromptList } from './prompt-list';
import type { Prompt } from '@/lib/prompt-library/types';
import { vi } from 'vitest';

// Mock child components to avoid testing their implementation details
vi.mock('./prompt-card', () => ({
  PromptCard: ({ prompt }: { prompt: Prompt }) => (
    <div data-testid="prompt-card">{prompt.title}</div>
  ),
}));

vi.mock('./prompt-list-item', () => ({
  PromptListItem: ({ prompt }: { prompt: Prompt }) => (
    <div data-testid="prompt-list-item">{prompt.title}</div>
  ),
}));

const mockPrompt: Prompt = {
  id: '1',
  user_id: 'user-1',
  title: 'Test Prompt',
  content: 'Test content',
  category: 'coding',
  tags: ['test'],
  is_favorite: false,
  is_automated: false,
  status: 'published',
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
};

describe('PromptList', () => {
  const mockOnDelete = vi.fn();
  const mockOnUpdate = vi.fn();

  it('renders cards view correctly', () => {
    render(
      <PromptList
        prompts={[mockPrompt]}
        viewMode="cards"
        onDelete={mockOnDelete}
        onUpdate={mockOnUpdate}
      />
    );
    expect(screen.getByTestId('prompt-card')).toBeInTheDocument();
    expect(screen.queryByTestId('prompt-list-item')).not.toBeInTheDocument();
  });

  it('renders list view correctly', () => {
    render(
      <PromptList
        prompts={[mockPrompt]}
        viewMode="list"
        onDelete={mockOnDelete}
        onUpdate={mockOnUpdate}
      />
    );
    expect(screen.getByTestId('prompt-list-item')).toBeInTheDocument();
    expect(screen.queryByTestId('prompt-card')).not.toBeInTheDocument();
  });

  it('renders multiple items', () => {
    const prompts = [
      mockPrompt,
      { ...mockPrompt, id: '2', title: 'Test Prompt 2' },
    ];
    render(
      <PromptList
        prompts={prompts}
        viewMode="cards"
        onDelete={mockOnDelete}
        onUpdate={mockOnUpdate}
      />
    );
    expect(screen.getAllByTestId('prompt-card')).toHaveLength(2);
  });
});
