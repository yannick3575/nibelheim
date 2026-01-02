import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from './filter-bar';

describe('FilterBar', () => {
  const defaultProps = {
    selectedCategory: 'all' as const,
    onCategoryChange: vi.fn(),
    showFavoritesOnly: false,
    onShowFavoritesChange: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Rechercher dans les prompts...')).toBeInTheDocument();
  });

  it('should render category select', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should render favorites toggle button', () => {
    render(<FilterBar {...defaultProps} />);
    // Check by accessible name instead of just 'button'
    expect(screen.getByRole('button', { name: "Afficher les favoris uniquement" })).toBeInTheDocument();
  });

  it('should call onSearchChange when typing in search', async () => {
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Rechercher dans les prompts...');
    await user.type(searchInput, 'test');

    expect(defaultProps.onSearchChange).toHaveBeenCalled();
  });

  it('should call onShowFavoritesChange when clicking favorites button', async () => {
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} />);

    // Use accessible name
    const favButton = screen.getByRole('button', { name: "Afficher les favoris uniquement" });

    await user.click(favButton);
    expect(defaultProps.onShowFavoritesChange).toHaveBeenCalledWith(true);
  });

  it('should toggle favorites off when already on', async () => {
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} showFavoritesOnly={true} />);

    // Label changes when active
    const favButton = screen.getByRole('button', { name: "Afficher tout" });

    await user.click(favButton);
    expect(defaultProps.onShowFavoritesChange).toHaveBeenCalledWith(false);
  });

  it('should show clear button when filters are active', () => {
    render(<FilterBar {...defaultProps} searchQuery="test" />);

    // Check by accessible name
    expect(screen.getByRole('button', { name: "Effacer les filtres" })).toBeInTheDocument();
  });

  it('should not show clear button when no filters active', () => {
    render(<FilterBar {...defaultProps} />);

    expect(screen.queryByRole('button', { name: "Effacer les filtres" })).not.toBeInTheDocument();
  });

  it('should clear all filters when clicking clear button', async () => {
    const user = userEvent.setup();
    render(
      <FilterBar
        {...defaultProps}
        selectedCategory="coding"
        showFavoritesOnly={true}
        searchQuery="test"
      />
    );

    const clearButton = screen.getByRole('button', { name: "Effacer les filtres" });

    await user.click(clearButton);

    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith('all');
    expect(defaultProps.onShowFavoritesChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('');
  });

  it('should display current search value', () => {
    render(<FilterBar {...defaultProps} searchQuery="hello world" />);

    const searchInput = screen.getByPlaceholderText('Rechercher dans les prompts...');
    expect(searchInput).toHaveValue('hello world');
  });

  it('should show clear button when category is selected', () => {
    render(<FilterBar {...defaultProps} selectedCategory="coding" />);

    expect(screen.getByRole('button', { name: "Effacer les filtres" })).toBeInTheDocument();
  });

  it('should show clear button when favorites is selected', () => {
    render(<FilterBar {...defaultProps} showFavoritesOnly={true} />);

    expect(screen.getByRole('button', { name: "Effacer les filtres" })).toBeInTheDocument();
  });
});
