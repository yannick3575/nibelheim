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
    const buttons = screen.getAllByRole('button');
    // Find the star button (favorites toggle)
    expect(buttons.length).toBeGreaterThan(0);
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

    // The favorites button has a Star icon
    const buttons = screen.getAllByRole('button');
    const favButton = buttons[0]; // First button is favorites

    await user.click(favButton);
    expect(defaultProps.onShowFavoritesChange).toHaveBeenCalledWith(true);
  });

  it('should toggle favorites off when already on', async () => {
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} showFavoritesOnly={true} />);

    const buttons = screen.getAllByRole('button');
    const favButton = buttons[0];

    await user.click(favButton);
    expect(defaultProps.onShowFavoritesChange).toHaveBeenCalledWith(false);
  });

  it('should show clear button when filters are active', () => {
    render(<FilterBar {...defaultProps} searchQuery="test" />);

    // Should have 2 buttons: favorites and clear
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
  });

  it('should not show clear button when no filters active', () => {
    render(<FilterBar {...defaultProps} />);

    // Should have only 1 button: favorites
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(1);
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

    const buttons = screen.getAllByRole('button');
    const clearButton = buttons[buttons.length - 1]; // Last button is clear

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

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
  });

  it('should show clear button when favorites is selected', () => {
    render(<FilterBar {...defaultProps} showFavoritesOnly={true} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
  });
});
