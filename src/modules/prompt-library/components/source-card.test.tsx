import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourceCard } from './source-card';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { DiscoverySource } from '@/lib/prompt-library/types';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Github: () => <div data-testid="icon-github" />,
  Globe: () => <div data-testid="icon-globe" />,
  Rss: () => <div data-testid="icon-rss" />,
  MoreVertical: () => <div data-testid="icon-more-vertical" />,
  Pencil: () => <div data-testid="icon-pencil" />,
  Trash2: () => <div data-testid="icon-trash" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
  ExternalLink: () => <div data-testid="icon-external-link" />,
  AlertCircle: () => <div data-testid="icon-alert-circle" />,
  CheckCircle2: () => <div data-testid="icon-check-circle" />,
  Clock: () => <div data-testid="icon-clock" />,
  Loader2: () => <div data-testid="icon-loader" />,
}));

const mockSource: DiscoverySource = {
  id: '123',
  name: 'Test Source',
  description: 'A test source',
  url: 'https://example.com',
  source_type: 'web',
  category: 'general',
  is_enabled: true,
  priority: 1,
  last_fetched_at: new Date().toISOString(),
  last_error: null,
  fetch_count: 10,
  prompts_extracted: 5,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('SourceCard', () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onToggleEnabled = vi.fn();
  const onTriggerDiscover = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders source information correctly', () => {
    render(
      <SourceCard
        source={mockSource}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleEnabled={onToggleEnabled}
        onTriggerDiscover={onTriggerDiscover}
      />
    );

    expect(screen.getByText('Test Source')).toBeInTheDocument();
    expect(screen.getByText('A test source')).toBeInTheDocument();
    expect(screen.getByText('5 prompts')).toBeInTheDocument();
  });

  it('shows AlertDialog when delete is clicked', async () => {
    const user = userEvent.setup();

    render(
      <SourceCard
        source={mockSource}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleEnabled={onToggleEnabled}
        onTriggerDiscover={onTriggerDiscover}
      />
    );

    // Open dropdown
    const menuButton = screen.getByTestId('icon-more-vertical').closest('button');
    await user.click(menuButton!);

    // Click delete in menu
    const deleteMenuItem = await screen.findByText('Supprimer');
    await user.click(deleteMenuItem);

    // Check if dialog content appears
    await waitFor(() => {
        expect(screen.getByText('Supprimer cette source ?')).toBeInTheDocument();
        expect(screen.getByText('Cette action est irréversible. La source "Test Source" sera définitivement supprimée.')).toBeInTheDocument();
    });

    // Click confirmation in dialog
    // The dialog button has text "Supprimer".
    const dialogAction = screen.getByRole('button', { name: 'Supprimer' });
    await user.click(dialogAction);

    await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith('123');
    });
  });
});
