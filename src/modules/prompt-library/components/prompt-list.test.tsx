import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PromptList } from './prompt-list';
import type { Prompt } from '@/lib/prompt-library/types';

// Mock child components to isolate PromptList testing
vi.mock('./prompt-card', () => ({
  PromptCard: ({ prompt }: { prompt: Prompt }) => <div data-testid="prompt-card">{prompt.title}</div>
}));

vi.mock('./prompt-list-item', () => ({
  PromptListItem: ({ prompt }: { prompt: Prompt }) => <div data-testid="prompt-list-item">{prompt.title}</div>
}));

const mockPrompts: Prompt[] = [
  {
    id: '1',
    title: 'Prompt 1',
    content: 'Content 1',
    category: 'writing',
    tags: ['tag1'],
    status: 'published',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    is_favorite: false,
    user_id: 'user1',
    is_automated: false,
  },
  {
    id: '2',
    title: 'Prompt 2',
    content: 'Content 2',
    category: 'coding',
    tags: ['tag2'],
    status: 'draft',
    created_at: '2023-01-02',
    updated_at: '2023-01-02',
    is_favorite: true,
    user_id: 'user1',
    is_automated: true,
  },
];

describe('PromptList', () => {
  it('renders cards view correctly', () => {
    render(
      <PromptList
        prompts={mockPrompts}
        viewMode="cards"
        onDelete={() => {}}
        onUpdate={() => {}}
      />
    );

    expect(screen.getAllByTestId('prompt-card')).toHaveLength(2);
    expect(screen.queryByTestId('prompt-list-item')).not.toBeInTheDocument();
    expect(screen.getByText('Prompt 1')).toBeInTheDocument();
    expect(screen.getByText('Prompt 2')).toBeInTheDocument();
  });

  it('renders list view correctly', () => {
    render(
      <PromptList
        prompts={mockPrompts}
        viewMode="list"
        onDelete={() => {}}
        onUpdate={() => {}}
      />
    );

    expect(screen.getAllByTestId('prompt-list-item')).toHaveLength(2);
    expect(screen.queryByTestId('prompt-card')).not.toBeInTheDocument();
    expect(screen.getByText('Prompt 1')).toBeInTheDocument();
    expect(screen.getByText('Prompt 2')).toBeInTheDocument();
  });

  it('renders empty list correctly', () => {
    render(
      <PromptList
        prompts={[]}
        viewMode="cards"
        onDelete={() => {}}
        onUpdate={() => {}}
      />
    );

    expect(screen.queryByTestId('prompt-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('prompt-list-item')).not.toBeInTheDocument();
  });
});
