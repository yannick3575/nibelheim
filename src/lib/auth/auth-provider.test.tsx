import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth-provider';
import { createClient } from '@/lib/supabase/client';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock the Supabase client module
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

// Component to test the hook
function TestComponent() {
  const { signInWithMagicLink, isLoading } = useAuth();
  return (
    <div>
      <button onClick={() => signInWithMagicLink('test@example.com')}>
        Sign In
      </button>
      {isLoading && <span data-testid="loading">Loading...</span>}
    </div>
  );
}

describe('AuthProvider', () => {
  const signInWithOtpMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockReturnValue({
      auth: {
        signInWithOtp: signInWithOtpMock.mockResolvedValue({ error: null }),
      },
    });
  });

  it('calls signInWithOtp when signInWithMagicLink is called', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const button = screen.getByText('Sign In');
    await user.click(button);

    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: 'test@example.com',
    });
  });
});
