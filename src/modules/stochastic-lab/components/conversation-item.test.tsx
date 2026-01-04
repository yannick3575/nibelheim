import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationItem } from './conversation-item';
import { describe, it, expect, vi } from 'vitest';
import type { Conversation } from '@/lib/stochastic-lab/types';

describe('ConversationItem', () => {
  const mockConversation: Conversation = {
    id: '123',
    user_id: 'user1',
    title: 'Test Conversation',
    messages: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('renders conversation title', () => {
    render(
      <ConversationItem
        conversation={mockConversation}
        isSelected={false}
        onSelect={vi.fn()}
        onDeleteClick={vi.fn()}
      />
    );

    expect(screen.getByText('Test Conversation')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const handleSelect = vi.fn();
    render(
      <ConversationItem
        conversation={mockConversation}
        isSelected={false}
        onSelect={handleSelect}
        onDeleteClick={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Test Conversation'));
    expect(handleSelect).toHaveBeenCalledWith('123');
  });

  it('calls onDeleteClick when trash icon is clicked', () => {
    const handleDeleteClick = vi.fn();
    const handleSelect = vi.fn();
    render(
      <ConversationItem
        conversation={mockConversation}
        isSelected={false}
        onSelect={handleSelect}
        onDeleteClick={handleDeleteClick}
      />
    );

    const deleteButton = screen.getByLabelText('Supprimer la conversation');
    fireEvent.click(deleteButton);

    expect(handleDeleteClick).toHaveBeenCalledWith('123');
    // Should NOT call select when deleting
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('applies selected styles when isSelected is true', () => {
    const { container } = render(
      <ConversationItem
        conversation={mockConversation}
        isSelected={true}
        onSelect={vi.fn()}
        onDeleteClick={vi.fn()}
      />
    );

    // Check if the card (first child) has the selected class
    expect(container.firstChild).toHaveClass('border-aurora-violet/50');
  });
});
