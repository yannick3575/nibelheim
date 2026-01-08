import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InboxHeader } from './inbox-header';

describe('InboxHeader', () => {
  it('renders correctly', () => {
    const onRefresh = vi.fn();
    const onAddItem = vi.fn();
    const onOpenSettings = vi.fn();

    render(
      <InboxHeader
        loading={false}
        onRefresh={onRefresh}
        onAddItem={onAddItem}
        onOpenSettings={onOpenSettings}
      />
    );

    expect(screen.getByText('AI Inbox')).toBeInTheDocument();
    expect(screen.getByText(/Votre flux de contenus tech/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Actualiser/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ajouter/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Profil/ })).toBeInTheDocument();
  });

  it('calls handlers when buttons are clicked', () => {
    const onRefresh = vi.fn();
    const onAddItem = vi.fn();
    const onOpenSettings = vi.fn();

    render(
      <InboxHeader
        loading={false}
        onRefresh={onRefresh}
        onAddItem={onAddItem}
        onOpenSettings={onOpenSettings}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Actualiser/ }));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Ajouter/ }));
    expect(onAddItem).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Profil/ }));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on refresh button', () => {
    const onRefresh = vi.fn();
    const onAddItem = vi.fn();
    const onOpenSettings = vi.fn();

    render(
      <InboxHeader
        loading={true}
        onRefresh={onRefresh}
        onAddItem={onAddItem}
        onOpenSettings={onOpenSettings}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /Actualiser/ });
    expect(refreshButton.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
