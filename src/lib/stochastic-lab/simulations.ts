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
  DistributionParams,
} from './types';

import {
  normalSample,
  poissonSample,
  exponentialSample,
  binomialSample,
  uniformSample,
} from './distributions';

import {
  welfordInit,
  welfordUpdate,
  welfordFinalize,
  histogramInit,
  histogramUpdate,
  histogramFinalize,
  convergenceInit,
  convergenceUpdate,
  convergenceFinalize,
} from './welford';

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
// MONTE CARLO SIMULATION (Welford-optimized)
// ============================================

function runMonteCarlo(config: MonteCarloConfig): SimulationResult {
  const { iterations, distribution, estimator = 'mean' } = config;

  const sampler = getSampler(distribution);
  const isPiEstimation = estimator === 'pi-geometric';
  const multiplier = isPiEstimation ? 4 : 1;

  // Initialize streaming statistics (Welford algorithm for numerical stability)
  let welford = welfordInit();
  const convergence = convergenceInit(iterations, 100, multiplier);

  // Estimate expected range for histogram
  let expectedMin = 0;
  let expectedMax = 1;
  if (!isPiEstimation) {
    if (distribution.type === 'normal') {
      expectedMin = distribution.params.mean - 4 * distribution.params.stdDev;
      expectedMax = distribution.params.mean + 4 * distribution.params.stdDev;
    } else if (distribution.type === 'exponential') {
      expectedMin = 0;
      expectedMax = 5 / distribution.params.lambda;
    } else if (distribution.type === 'poisson') {
      expectedMin = 0;
      expectedMax = distribution.params.lambda + 4 * Math.sqrt(distribution.params.lambda);
    } else if (distribution.type === 'binomial') {
      expectedMin = 0;
      expectedMax = distribution.params.n;
    }
  }
  const histogram = histogramInit(expectedMin, expectedMax, 30);

  // Store subset of values for visualization (max 10000)
  const sampleRate = Math.max(1, Math.floor(iterations / 10000));
  const sampledValues: number[] = [];

  // Run simulation with streaming updates
  for (let i = 0; i < iterations; i++) {
    let value: number;

    if (isPiEstimation) {
      // Special case: estimate π using geometric method
      const x = uniformSample();
      const y = uniformSample();
      value = x * x + y * y <= 1 ? 1 : 0;
    } else {
      value = sampler();
    }

    // Update streaming statistics (O(1) memory, numerically stable)
    welford = welfordUpdate(welford, value);
    histogramUpdate(histogram, value);
    convergenceUpdate(convergence, value);

    // Sample for visualization
    if (i % sampleRate === 0) {
      sampledValues.push(value);
    }
  }

  // Finalize statistics
  const stats = welfordFinalize(welford);
  const histData = histogramFinalize(histogram);
  const convData = convergenceFinalize(convergence);

  // Adjust for π estimation
  const finalMean = isPiEstimation ? stats.mean * 4 : stats.mean;
  const standardError = stats.stdDev / Math.sqrt(stats.count);
  const marginOfError = 1.96 * standardError * multiplier;

  const statistics: Statistics = {
    mean: finalMean,
    median: finalMean, // Approximation - exact median requires sorting all values
    stdDev: stats.stdDev * (isPiEstimation ? 4 : 1),
    variance: stats.variance * (isPiEstimation ? 16 : 1),
    min: isPiEstimation ? 0 : stats.min,
    max: isPiEstimation ? 4 : stats.max * (isPiEstimation ? 4 : 1),
    confidenceInterval95: [finalMean - marginOfError, finalMean + marginOfError],
  };

  return {
    type: 'monte-carlo',
    executedAt: '',
    executionTimeMs: 0,
    iterations,
    values: sampledValues,
    statistics,
    histogram: histData,
    convergence: convData,
  };
}

// ============================================
// MARKOV CHAIN SIMULATION (Welford-optimized)
// ============================================

function runMarkovChain(config: MarkovChainConfig): SimulationResult {
  const { states, transitionMatrix, initialState, steps } = config;

  // Validate transition matrix
  validateTransitionMatrix(transitionMatrix, states.length);

  // Track state frequencies incrementally
  const stateFrequencies: Record<string, number> = {};
  for (const state of states) {
    stateFrequencies[state] = 0;
  }

  // Store path (limited for large simulations)
  const maxPathLength = Math.min(steps, 10000);
  const sampleRate = Math.max(1, Math.floor(steps / maxPathLength));
  const sampledPath: string[] = [];
  const sampledIndices: number[] = [];

  let currentState = initialState;
  let welford = welfordInit();

  // Convergence: track proportion in first state
  const convergence = convergenceInit(steps, 100, 1);
  let countInFirst = 0;

  for (let i = 0; i < steps; i++) {
    // Update state frequency
    stateFrequencies[states[currentState]]++;

    // Track for convergence
    if (currentState === 0) countInFirst++;
    convergenceUpdate(convergence, countInFirst / (i + 1));

    // Update Welford stats on state index
    welford = welfordUpdate(welford, currentState);

    // Sample for visualization
    if (i % sampleRate === 0) {
      sampledPath.push(states[currentState]);
      sampledIndices.push(currentState);
    }

    // Transition to next state
    const rand = Math.random();
    let cumulative = 0;
    for (let j = 0; j < states.length; j++) {
      cumulative += transitionMatrix[currentState][j];
      if (rand < cumulative) {
        currentState = j;
        break;
      }
    }
  }

  // Normalize frequencies
  for (const state of states) {
    stateFrequencies[state] /= steps;
  }

  const stats = welfordFinalize(welford);

  const statistics: Statistics = {
    mean: stats.mean,
    median: stats.mean,
    stdDev: stats.stdDev,
    variance: stats.variance,
    min: stats.min,
    max: stats.max,
    confidenceInterval95: [
      stats.mean - 1.96 * stats.stdDev / Math.sqrt(stats.count),
      stats.mean + 1.96 * stats.stdDev / Math.sqrt(stats.count),
    ],
  };

  return {
    type: 'markov-chain',
    executedAt: '',
    executionTimeMs: 0,
    iterations: steps,
    values: sampledIndices,
    statistics,
    statePath: sampledPath,
    stateFrequencies,
    convergence: convergenceFinalize(convergence),
  };
}

// ============================================
// RANDOM WALK SIMULATION (Welford-optimized)
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
  // Limit path storage
  const maxPathLength = Math.min(steps, 10000);
  const sampleRate = Math.max(1, Math.floor(steps / maxPathLength));

  const path: number[][] = [[0]];
  const sampledValues: number[] = [0];

  let position = 0;
  let welford = welfordInit();
  welford = welfordUpdate(welford, 0);

  const convergence = convergenceInit(steps, 100, 1);
  convergenceUpdate(convergence, 0);

  for (let i = 1; i < steps; i++) {
    const step = sampler() + drift;
    position += step;

    welford = welfordUpdate(welford, position);
    convergenceUpdate(convergence, position);

    if (i % sampleRate === 0) {
      sampledValues.push(position);
      path.push([position]);
    }
  }

  const stats = welfordFinalize(welford);

  const statistics: Statistics = {
    mean: stats.mean,
    median: stats.mean,
    stdDev: stats.stdDev,
    variance: stats.variance,
    min: stats.min,
    max: stats.max,
    confidenceInterval95: [
      stats.mean - 1.96 * stats.stdDev / Math.sqrt(stats.count),
      stats.mean + 1.96 * stats.stdDev / Math.sqrt(stats.count),
    ],
  };

  return {
    type: 'random-walk',
    executedAt: '',
    executionTimeMs: 0,
    iterations: steps,
    values: sampledValues,
    statistics,
    path,
    convergence: convergenceFinalize(convergence),
  };
}

function runRandomWalk2D(
  steps: number,
  sampler: () => number,
  drift: number
): SimulationResult {
  const maxPathLength = Math.min(steps, 10000);
  const sampleRate = Math.max(1, Math.floor(steps / maxPathLength));

  const path: number[][] = [[0, 0]];
  const sampledDistances: number[] = [0];

  let x = 0;
  let y = 0;
  let welford = welfordInit();
  welford = welfordUpdate(welford, 0);

  const convergence = convergenceInit(steps, 100, 1);
  convergenceUpdate(convergence, 0);

  for (let i = 1; i < steps; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const stepSize = Math.abs(sampler()) + drift;

    x += stepSize * Math.cos(angle);
    y += stepSize * Math.sin(angle);

    const distance = Math.sqrt(x * x + y * y);
    welford = welfordUpdate(welford, distance);
    convergenceUpdate(convergence, distance);

    if (i % sampleRate === 0) {
      sampledDistances.push(distance);
      path.push([x, y]);
    }
  }

  const stats = welfordFinalize(welford);

  const statistics: Statistics = {
    mean: stats.mean,
    median: stats.mean,
    stdDev: stats.stdDev,
    variance: stats.variance,
    min: stats.min,
    max: stats.max,
    confidenceInterval95: [
      stats.mean - 1.96 * stats.stdDev / Math.sqrt(stats.count),
      stats.mean + 1.96 * stats.stdDev / Math.sqrt(stats.count),
    ],
  };

  return {
    type: 'random-walk',
    executedAt: '',
    executionTimeMs: 0,
    iterations: steps,
    values: sampledDistances,
    statistics,
    path,
    convergence: convergenceFinalize(convergence),
  };
}

// ============================================
// NOTE: Statistical utilities have been replaced by Welford algorithm
// from ./welford.ts for numerical stability and O(1) memory usage.
// ============================================

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
