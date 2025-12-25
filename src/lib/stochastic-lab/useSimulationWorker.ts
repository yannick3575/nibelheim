'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import type { SimulationConfig, SimulationResult } from './types';
import type { WorkerRequest, WorkerResponse } from './simulation.worker';

interface SimulationState {
  isRunning: boolean;
  progress: number;
  result: SimulationResult | null;
  error: string | null;
}

interface UseSimulationWorkerReturn {
  runSimulation: (config: SimulationConfig) => Promise<SimulationResult>;
  cancelSimulation: () => void;
  state: SimulationState;
}

/**
 * Hook to run simulations in a Web Worker
 * Keeps the main thread responsive during heavy computations
 */
export function useSimulationWorker(): UseSimulationWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const resolveRef = useRef<((result: SimulationResult) => void) | null>(null);
  const rejectRef = useRef<((error: Error) => void) | null>(null);
  const currentRequestId = useRef<string | null>(null);

  const [state, setState] = useState<SimulationState>({
    isRunning: false,
    progress: 0,
    result: null,
    error: null,
  });

  // Initialize worker on mount
  useEffect(() => {
    // Create worker using URL constructor (works with Next.js/webpack)
    workerRef.current = new Worker(
      new URL('./simulation.worker.ts', import.meta.url)
    );

    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { id, result, error, progress } = event.data;

      // Ignore messages from old requests
      if (id !== currentRequestId.current) return;

      if (progress !== undefined && !result && !error) {
        // Progress update
        setState(prev => ({ ...prev, progress }));
        return;
      }

      if (error) {
        setState({
          isRunning: false,
          progress: 0,
          result: null,
          error,
        });
        rejectRef.current?.(new Error(error));
      } else if (result) {
        setState({
          isRunning: false,
          progress: 100,
          result,
          error: null,
        });
        resolveRef.current?.(result);
      }

      // Cleanup refs
      resolveRef.current = null;
      rejectRef.current = null;
      currentRequestId.current = null;
    };

    workerRef.current.onerror = (error) => {
      setState({
        isRunning: false,
        progress: 0,
        result: null,
        error: error.message,
      });
      rejectRef.current?.(new Error(error.message));
      resolveRef.current = null;
      rejectRef.current = null;
      currentRequestId.current = null;
    };

    // Cleanup on unmount
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const runSimulation = useCallback((config: SimulationConfig): Promise<SimulationResult> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      // Cancel any existing simulation
      if (currentRequestId.current) {
        rejectRef.current?.(new Error('Simulation cancelled'));
      }

      const requestId = crypto.randomUUID();
      currentRequestId.current = requestId;
      resolveRef.current = resolve;
      rejectRef.current = reject;

      setState({
        isRunning: true,
        progress: 0,
        result: null,
        error: null,
      });

      const request: WorkerRequest = { id: requestId, config };
      workerRef.current.postMessage(request);
    });
  }, []);

  const cancelSimulation = useCallback(() => {
    if (currentRequestId.current && workerRef.current) {
      // Terminate and recreate worker to cancel
      workerRef.current.terminate();

      workerRef.current = new Worker(
        new URL('./simulation.worker.ts', import.meta.url)
      );

      rejectRef.current?.(new Error('Simulation cancelled'));
      resolveRef.current = null;
      rejectRef.current = null;
      currentRequestId.current = null;

      setState({
        isRunning: false,
        progress: 0,
        result: null,
        error: 'Cancelled',
      });
    }
  }, []);

  return {
    runSimulation,
    cancelSimulation,
    state,
  };
}
