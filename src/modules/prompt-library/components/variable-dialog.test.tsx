import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VariableDialog } from './variable-dialog';
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

import { toast } from 'sonner';

describe('VariableDialog', () => {
  const mockPrompt: Prompt = {
    id: 'test-id-123',
    user_id: 'user-123',
    title: 'Test Prompt',
    content: 'Hello {{name}}, your code is {{code}}.',
    category: 'coding',
    tags: [],
    is_favorite: false,
    is_automated: false,
    status: 'published',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    prompt: mockPrompt,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockClear();
  });

  it('should render dialog title', () => {
    render(<VariableDialog {...defaultProps} />);
    expect(screen.getByText('Remplir les variables')).toBeInTheDocument();
  });

  it('should render input for each variable', () => {
    render(<VariableDialog {...defaultProps} />);

    expect(screen.getByLabelText('{{name}}')).toBeInTheDocument();
    expect(screen.getByLabelText('{{code}}')).toBeInTheDocument();
  });

  it('should show placeholder for variable inputs', () => {
    render(<VariableDialog {...defaultProps} />);

    expect(screen.getByPlaceholderText('Entrez la valeur pour name...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Entrez la valeur pour code...')).toBeInTheDocument();
  });

  it('should show preview with original content', () => {
    render(<VariableDialog {...defaultProps} />);

    expect(screen.getByText('Aperçu')).toBeInTheDocument();
    expect(screen.getByText('Hello {{name}}, your code is {{code}}.')).toBeInTheDocument();
  });

  it('should update preview when typing values', async () => {
    render(<VariableDialog {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('Entrez la valeur pour name...');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });

    await waitFor(() => {
      expect(screen.getByText(/Hello Alice, your code is \{\{code\}\}\./)).toBeInTheDocument();
    });
  });

  it('should update preview with all values', async () => {
    render(<VariableDialog {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('Entrez la valeur pour name...');
    const codeInput = screen.getByPlaceholderText('Entrez la valeur pour code...');

    fireEvent.change(nameInput, { target: { value: 'Bob' } });
    fireEvent.change(codeInput, { target: { value: 'ABC123' } });

    await waitFor(() => {
      expect(screen.getByText('Hello Bob, your code is ABC123.')).toBeInTheDocument();
    });
  });

  it('should copy filled content when clicking copy button', async () => {
    render(<VariableDialog {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('Entrez la valeur pour name...');
    const codeInput = screen.getByPlaceholderText('Entrez la valeur pour code...');

    fireEvent.change(nameInput, { target: { value: 'Charlie' } });
    fireEvent.change(codeInput, { target: { value: 'XYZ789' } });

    const copyButton = screen.getByRole('button', { name: /copier/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('Hello Charlie, your code is XYZ789.');
      expect(toast.success).toHaveBeenCalledWith('Prompt copié avec les variables remplies');
    });
  });

  it('should not render when open is false', () => {
    render(<VariableDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Remplir les variables')).not.toBeInTheDocument();
  });

  it('should handle single variable', () => {
    const singleVarPrompt = {
      ...mockPrompt,
      content: 'The answer is {{answer}}.',
    };

    render(<VariableDialog {...defaultProps} prompt={singleVarPrompt} />);

    expect(screen.getByLabelText('{{answer}}')).toBeInTheDocument();
    expect(screen.queryByLabelText('{{name}}')).not.toBeInTheDocument();
  });

  it('should handle $ characters in input values', async () => {
    render(<VariableDialog {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('Entrez la valeur pour name...');
    fireEvent.change(nameInput, { target: { value: '$100' } });

    const copyButton = screen.getByRole('button', { name: /copier/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('Hello $100, your code is {{code}}.');
    });
  });

  it('should render cancel button', () => {
    render(<VariableDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
  });

  it('should render copy button', () => {
    render(<VariableDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: /copier/i })).toBeInTheDocument();
  });
});
