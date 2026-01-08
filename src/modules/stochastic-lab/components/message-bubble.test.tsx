import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBubble } from './message-bubble';
import { vi, describe, it, expect } from 'vitest';
import type { ChatMessage } from '@/lib/stochastic-lab/types';

// Mock react-katex
vi.mock('react-katex', () => ({
  InlineMath: ({ math }: { math: string }) => <span data-testid="inline-math">{math}</span>,
  BlockMath: ({ math }: { math: string }) => <div data-testid="block-math">{math}</div>,
}));

// Mock css import
vi.mock('katex/dist/katex.min.css', () => ({}));

// Mock SimulationResult component since we don't need to test it here
vi.mock('./simulation-result', () => ({
  SimulationResult: () => <div data-testid="simulation-result">Result</div>,
}));

describe('MessageBubble', () => {
  const mockMessage: ChatMessage = {
    id: '1',
    role: 'assistant',
    content: 'Hello world',
    timestamp: new Date().toISOString(),
  };

  it('renders content correctly', () => {
    render(<MessageBubble message={mockMessage} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders simulation button when pending', () => {
    const messageWithSim: ChatMessage = {
      ...mockMessage,
      simulation: {
        status: 'pending',
        config: {
            type: 'monte-carlo',
            config: {
                iterations: 100,
                distribution: { type: 'normal', params: { mean: 0, stdDev: 1 } }
            }
        },
      }
    };

    const onRun = vi.fn();
    render(<MessageBubble message={messageWithSim} onRunSimulation={onRun} />);

    // Using regex to match text because it might change (that's what we are improving)
    // But for now it's "Lancer la simulation"
    const button = screen.getByRole('button', { name: /lancer la simulation/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onRun).toHaveBeenCalledWith(messageWithSim.id, messageWithSim.simulation!.config);
  });

  it('shows loading state when simulation is running', () => {
    const messageWithSim: ChatMessage = {
      ...mockMessage,
      simulation: {
        status: 'pending', // Button is shown when status is pending
        config: {
            type: 'monte-carlo',
            config: {
                iterations: 100,
                distribution: { type: 'normal', params: { mean: 0, stdDev: 1 } }
            }
        },
      }
    };

    const onRun = vi.fn();
    // When isSimulationRunning is true, the button text changes to "En cours..."
    render(<MessageBubble message={messageWithSim} onRunSimulation={onRun} isSimulationRunning={true} />);

    expect(screen.getByText('En cours...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
