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

describe('VariableDialog UX', () => {
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

  it('should trigger copy when pressing Enter in an input', async () => {
    render(<VariableDialog {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('Entrez la valeur pour name...');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });

    // Simulate Enter key press inside a form
    fireEvent.submit(nameInput);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('Hello Alice, your code is {{code}}.');
      expect(toast.success).toHaveBeenCalledWith('Prompt copié avec les variables remplies');
    });
  });

  // Note: Testing autoFocus in jsdom/happy-dom is tricky as the attribute might not be reflected in the DOM
  // or the focus management is not fully simulated.
  // We rely on the code implementation correctness for autoFocus.
  // The 'Enter to submit' test below verifies the form structure which is the main part of this UX improvement.
});
