// ============================================
// STOCHASTIC LAB - SIMULATION ENGINES
// Client-side execution for Monte Carlo, Markov Chains, Random Walks
// ============================================

import {
  SimulationConfig,
  SimulationResult,
  MonteCarloConfig,
  MarkovChainConfig,
  RandomWalkConfig,
  Statistics,
  HistogramData,
  ConvergenceData,
  DistributionParams,
} from './types';

import {
  normalSample,
  poissonSample,
  exponentialSample,
  binomialSample,
  uniformSample,
} from './distributions';

// ============================================
// MAIN DISPATCHER
// ============================================

export function executeSimulation(config: SimulationConfig): SimulationResult {
  const startTime = performance.now();

  let result: SimulationResult;

  switch (config.type) {
    case 'monte-carlo':
      result = runMonteCarlo(config.config);
      break;
    case 'markov-chain':
      result = runMarkovChain(config.config);
      break;
    case 'random-walk':
      result = runRandomWalk(config.config);
      break;
    default:
      throw new Error(`Unknown simulation type: ${(config as SimulationConfig).type}`);
  }

  result.executionTimeMs = performance.now() - startTime;
  result.executedAt = new Date().toISOString();

  return result;
}

// ============================================
// MONTE CARLO SIMULATION
// ============================================

function runMonteCarlo(config: MonteCarloConfig): SimulationResult {
  const { iterations, distribution, estimator = 'mean' } = config;

  // Generate samples based on distribution
  const values: number[] = [];
  const sampler = getSampler(distribution);

  for (let i = 0; i < iterations; i++) {
    if (estimator === 'pi-geometric') {
      // Special case: estimate π using geometric method
      // Point in unit square, check if inside quarter circle
      const x = uniformSample();
      const y = uniformSample();
      values.push(x * x + y * y <= 1 ? 1 : 0);
    } else {
      values.push(sampler());
    }
  }

  // Calculate statistics
  const statistics = calculateStatistics(values);

  // For π estimation, adjust the mean
  if (estimator === 'pi-geometric') {
    // π ≈ 4 * (points inside circle / total points)
    statistics.mean = statistics.mean * 4;
    // Adjust confidence interval
    statistics.confidenceInterval95 = [
      statistics.confidenceInterval95[0] * 4,
      statistics.confidenceInterval95[1] * 4,
    ];
  }

  // Generate histogram
  const histogram = createHistogram(values, 30);

  // Generate convergence data (running mean)
  const convergence = calculateConvergence(values, estimator === 'pi-geometric' ? 4 : 1);

  return {
    type: 'monte-carlo',
    executedAt: '',
    executionTimeMs: 0,
    iterations,
    values,
    statistics,
    histogram,
    convergence,
  };
}

// ============================================
// MARKOV CHAIN SIMULATION
// ============================================

function runMarkovChain(config: MarkovChainConfig): SimulationResult {
  const { states, transitionMatrix, initialState, steps } = config;

  // Validate transition matrix
  validateTransitionMatrix(transitionMatrix, states.length);

  // Run the chain
  const stateIndices: number[] = [initialState];
  const statePath: string[] = [states[initialState]];

  let currentState = initialState;

  for (let i = 1; i < steps; i++) {
    // Sample next state based on transition probabilities
    const rand = Math.random();
    let cumulative = 0;
    let nextState = currentState;

    for (let j = 0; j < states.length; j++) {
      cumulative += transitionMatrix[currentState][j];
      if (rand < cumulative) {
        nextState = j;
        break;
      }
    }

    stateIndices.push(nextState);
    statePath.push(states[nextState]);
    currentState = nextState;
  }

  // Calculate state frequencies
  const stateFrequencies: Record<string, number> = {};
  for (const state of states) {
    stateFrequencies[state] = 0;
  }
  for (const state of statePath) {
    stateFrequencies[state]++;
  }
  // Normalize to proportions
  for (const state of states) {
    stateFrequencies[state] /= steps;
  }

  // Convert state indices to numbers for statistics
  const values = stateIndices;
  const statistics = calculateStatistics(values);

  // Convergence: track proportion of time in each state
  const convergence = calculateMarkovConvergence(statePath, states);

  return {
    type: 'markov-chain',
    executedAt: '',
    executionTimeMs: 0,
    iterations: steps,
    values,
    statistics,
    statePath,
    stateFrequencies,
    convergence,
  };
}

// ============================================
// RANDOM WALK SIMULATION
// ============================================

function runRandomWalk(config: RandomWalkConfig): SimulationResult {
  const { dimensions, steps, stepDistribution, drift = 0 } = config;

  const sampler = getSampler(stepDistribution);

  if (dimensions === 1) {
    return runRandomWalk1D(steps, sampler, drift);
  } else {
    return runRandomWalk2D(steps, sampler, drift);
  }
}

function runRandomWalk1D(
  steps: number,
  sampler: () => number,
  drift: number
): SimulationResult {
  const path: number[][] = [[0]];
  const values: number[] = [0];

  let position = 0;

  for (let i = 1; i < steps; i++) {
    const step = sampler() + drift;
    position += step;
    values.push(position);
    path.push([position]);
  }

  const statistics = calculateStatistics(values);
  const convergence: ConvergenceData = {
    iterations: values.map((_, i) => i),
    values: values,
  };

  return {
    type: 'random-walk',
    executedAt: '',
    executionTimeMs: 0,
    iterations: steps,
    values,
    statistics,
    path,
    convergence,
  };
}

function runRandomWalk2D(
  steps: number,
  sampler: () => number,
  drift: number
): SimulationResult {
  const path: number[][] = [[0, 0]];
  const distances: number[] = [0];

  let x = 0;
  let y = 0;

  for (let i = 1; i < steps; i++) {
    // Random direction
    const angle = Math.random() * 2 * Math.PI;
    const stepSize = Math.abs(sampler()) + drift;

    x += stepSize * Math.cos(angle);
    y += stepSize * Math.sin(angle);

    path.push([x, y]);
    distances.push(Math.sqrt(x * x + y * y));
  }

  const statistics = calculateStatistics(distances);
  const convergence: ConvergenceData = {
    iterations: distances.map((_, i) => i),
    values: distances,
  };

  return {
    type: 'random-walk',
    executedAt: '',
    executionTimeMs: 0,
    iterations: steps,
    values: distances,
    statistics,
    path,
    convergence,
  };
}

// ============================================
// STATISTICAL UTILITIES
// ============================================

function calculateStatistics(values: number[]): Statistics {
  const n = values.length;
  if (n === 0) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      variance: 0,
      min: 0,
      max: 0,
      confidenceInterval95: [0, 0],
    };
  }

  // Mean
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  // Variance and standard deviation
  const squaredDiffs = values.map(x => (x - mean) ** 2);
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(variance);

  // Median
  const sorted = [...values].sort((a, b) => a - b);
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  // Min and max
  const min = sorted[0];
  const max = sorted[n - 1];

  // 95% confidence interval (assuming normal distribution)
  // CI = mean ± 1.96 * (stdDev / sqrt(n))
  const standardError = stdDev / Math.sqrt(n);
  const marginOfError = 1.96 * standardError;
  const confidenceInterval95: [number, number] = [
    mean - marginOfError,
    mean + marginOfError,
  ];

  return {
    mean,
    median,
    stdDev,
    variance,
    min,
    max,
    confidenceInterval95,
  };
}

function createHistogram(values: number[], binCount: number = 30): HistogramData {
  if (values.length === 0) {
    return { bins: [], counts: [] };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  // Handle case where all values are the same
  if (min === max) {
    return {
      bins: [min.toFixed(2)],
      counts: [values.length],
    };
  }

  const binWidth = (max - min) / binCount;
  const counts = new Array(binCount).fill(0);
  const bins: string[] = [];

  // Create bin labels
  for (let i = 0; i < binCount; i++) {
    const binStart = min + i * binWidth;
    bins.push(binStart.toFixed(2));
  }

  // Count values in each bin
  for (const value of values) {
    let binIndex = Math.floor((value - min) / binWidth);
    // Handle edge case where value === max
    if (binIndex >= binCount) {
      binIndex = binCount - 1;
    }
    counts[binIndex]++;
  }

  return { bins, counts };
}

function calculateConvergence(
  values: number[],
  multiplier: number = 1
): ConvergenceData {
  const iterations: number[] = [];
  const runningMeans: number[] = [];

  let sum = 0;
  const step = Math.max(1, Math.floor(values.length / 100)); // Max 100 points

  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i % step === 0 || i === values.length - 1) {
      iterations.push(i + 1);
      runningMeans.push((sum / (i + 1)) * multiplier);
    }
  }

  return { iterations, values: runningMeans };
}

function calculateMarkovConvergence(
  statePath: string[],
  states: string[]
): ConvergenceData {
  // Track proportion in first state over time
  const iterations: number[] = [];
  const proportions: number[] = [];

  let countInFirst = 0;
  const step = Math.max(1, Math.floor(statePath.length / 100));

  for (let i = 0; i < statePath.length; i++) {
    if (statePath[i] === states[0]) {
      countInFirst++;
    }
    if (i % step === 0 || i === statePath.length - 1) {
      iterations.push(i + 1);
      proportions.push(countInFirst / (i + 1));
    }
  }

  return { iterations, values: proportions };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getSampler(distribution: DistributionParams): () => number {
  switch (distribution.type) {
    case 'normal':
      return () => normalSample(distribution.params.mean, distribution.params.stdDev);
    case 'poisson':
      return () => poissonSample(distribution.params.lambda);
    case 'exponential':
      return () => exponentialSample(distribution.params.lambda);
    case 'binomial':
      return () => binomialSample(distribution.params.n, distribution.params.p);
    default:
      return () => normalSample(0, 1);
  }
}

function validateTransitionMatrix(matrix: number[][], stateCount: number): void {
  if (matrix.length !== stateCount) {
    throw new Error(`Transition matrix must have ${stateCount} rows`);
  }

  for (let i = 0; i < stateCount; i++) {
    if (matrix[i].length !== stateCount) {
      throw new Error(`Row ${i} must have ${stateCount} columns`);
    }

    const rowSum = matrix[i].reduce((a, b) => a + b, 0);
    if (Math.abs(rowSum - 1) > 0.001) {
      throw new Error(`Row ${i} probabilities must sum to 1 (got ${rowSum})`);
    }
  }
}
