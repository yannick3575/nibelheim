// ============================================
// WELFORD'S ONLINE ALGORITHM
// Calculates running mean, variance, min, max without storing all values
// Memory: O(1) instead of O(n)
// ============================================

export interface WelfordState {
  count: number;
  mean: number;
  m2: number; // Sum of squared differences from the mean
  min: number;
  max: number;
}

/**
 * Initialize a new Welford accumulator
 */
export function welfordInit(): WelfordState {
  return {
    count: 0,
    mean: 0,
    m2: 0,
    min: Infinity,
    max: -Infinity,
  };
}

/**
 * Update the accumulator with a new value
 * Uses Welford's online algorithm for numerical stability
 */
export function welfordUpdate(state: WelfordState, value: number): WelfordState {
  const count = state.count + 1;
  const delta = value - state.mean;
  const mean = state.mean + delta / count;
  const delta2 = value - mean;
  const m2 = state.m2 + delta * delta2;

  return {
    count,
    mean,
    m2,
    min: Math.min(state.min, value),
    max: Math.max(state.max, value),
  };
}

/**
 * Finalize and extract statistics from the accumulator
 */
export function welfordFinalize(state: WelfordState): {
  mean: number;
  variance: number;
  stdDev: number;
  min: number;
  max: number;
  count: number;
} {
  if (state.count < 2) {
    return {
      mean: state.count === 1 ? state.mean : 0,
      variance: 0,
      stdDev: 0,
      min: state.count === 1 ? state.min : 0,
      max: state.count === 1 ? state.max : 0,
      count: state.count,
    };
  }

  const variance = state.m2 / state.count;
  const stdDev = Math.sqrt(variance);

  return {
    mean: state.mean,
    variance,
    stdDev,
    min: state.min,
    max: state.max,
    count: state.count,
  };
}

// ============================================
// STREAMING HISTOGRAM
// Approximate histogram without storing all values
// Uses fixed bins based on expected range
// ============================================

export interface StreamingHistogram {
  bins: number[];
  counts: number[];
  binWidth: number;
  minBin: number;
}

/**
 * Create a streaming histogram with fixed bins
 */
export function histogramInit(
  expectedMin: number,
  expectedMax: number,
  binCount: number = 30
): StreamingHistogram {
  const range = expectedMax - expectedMin;
  const padding = range * 0.1; // 10% padding on each side
  const minBin = expectedMin - padding;
  const maxBin = expectedMax + padding;
  const binWidth = (maxBin - minBin) / binCount;

  return {
    bins: Array.from({ length: binCount }, (_, i) => minBin + i * binWidth),
    counts: new Array(binCount).fill(0),
    binWidth,
    minBin,
  };
}

/**
 * Add a value to the streaming histogram
 */
export function histogramUpdate(hist: StreamingHistogram, value: number): void {
  let binIndex = Math.floor((value - hist.minBin) / hist.binWidth);

  // Clamp to valid range
  if (binIndex < 0) binIndex = 0;
  if (binIndex >= hist.counts.length) binIndex = hist.counts.length - 1;

  hist.counts[binIndex]++;
}

/**
 * Finalize histogram for display
 */
export function histogramFinalize(hist: StreamingHistogram): {
  bins: string[];
  counts: number[];
} {
  return {
    bins: hist.bins.map(b => b.toFixed(2)),
    counts: [...hist.counts],
  };
}

// ============================================
// CONVERGENCE TRACKER
// Track running mean at regular intervals
// ============================================

export interface ConvergenceTracker {
  iterations: number[];
  values: number[];
  step: number;
  nextCapture: number;
  runningSum: number;
  count: number;
  multiplier: number;
}

/**
 * Create a convergence tracker
 */
export function convergenceInit(
  totalIterations: number,
  maxPoints: number = 100,
  multiplier: number = 1
): ConvergenceTracker {
  const step = Math.max(1, Math.floor(totalIterations / maxPoints));
  return {
    iterations: [],
    values: [],
    step,
    nextCapture: 0,
    runningSum: 0,
    count: 0,
    multiplier,
  };
}

/**
 * Update convergence tracker with new value
 */
export function convergenceUpdate(tracker: ConvergenceTracker, value: number): void {
  tracker.runningSum += value;
  tracker.count++;

  if (tracker.count >= tracker.nextCapture) {
    tracker.iterations.push(tracker.count);
    tracker.values.push((tracker.runningSum / tracker.count) * tracker.multiplier);
    tracker.nextCapture += tracker.step;
  }
}

/**
 * Finalize and ensure last point is captured
 */
export function convergenceFinalize(tracker: ConvergenceTracker): {
  iterations: number[];
  values: number[];
} {
  // Ensure we capture the final value
  if (tracker.iterations[tracker.iterations.length - 1] !== tracker.count) {
    tracker.iterations.push(tracker.count);
    tracker.values.push((tracker.runningSum / tracker.count) * tracker.multiplier);
  }

  return {
    iterations: tracker.iterations,
    values: tracker.values,
  };
}
