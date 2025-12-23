// ============================================
// STOCHASTIC LAB - DISTRIBUTION SAMPLERS
// Pure functions for generating random variates
// ============================================

/**
 * Generate a sample from Normal distribution N(μ, σ²)
 * Uses Box-Muller transform for exact sampling
 *
 * @param mean - μ, the expected value
 * @param stdDev - σ, the standard deviation (NOT variance)
 * @returns A single sample from N(mean, stdDev²)
 */
export function normalSample(mean: number = 0, stdDev: number = 1): number {
  // Box-Muller transform generates two independent N(0,1) samples
  // We use only one for simplicity
  const u1 = Math.random();
  const u2 = Math.random();

  // Avoid log(0)
  const safeU1 = Math.max(u1, 1e-10);

  const z0 = Math.sqrt(-2 * Math.log(safeU1)) * Math.cos(2 * Math.PI * u2);
  return mean + stdDev * z0;
}

/**
 * Generate a sample from Exponential distribution Exp(λ)
 * Uses inverse transform sampling: X = -ln(U)/λ
 *
 * @param lambda - λ, the rate parameter (mean = 1/λ)
 * @returns A single sample from Exp(lambda)
 */
export function exponentialSample(lambda: number = 1): number {
  if (lambda <= 0) {
    throw new Error('Lambda must be positive for exponential distribution');
  }

  const u = Math.random();
  // Avoid log(0)
  const safeU = Math.max(u, 1e-10);

  return -Math.log(safeU) / lambda;
}

/**
 * Generate a sample from Poisson distribution Pois(λ)
 * Uses Knuth's algorithm for small λ, or normal approximation for large λ
 *
 * @param lambda - λ, the rate parameter (mean = variance = λ)
 * @returns A single sample from Pois(lambda)
 */
export function poissonSample(lambda: number = 1): number {
  if (lambda <= 0) {
    throw new Error('Lambda must be positive for Poisson distribution');
  }

  // For large λ, use normal approximation (CLT)
  if (lambda > 30) {
    const sample = normalSample(lambda, Math.sqrt(lambda));
    return Math.max(0, Math.round(sample));
  }

  // Knuth's algorithm for small λ
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;

  do {
    k++;
    p *= Math.random();
  } while (p > L);

  return k - 1;
}

/**
 * Generate a sample from Binomial distribution B(n, p)
 * Direct simulation: sum of n Bernoulli(p) trials
 *
 * @param n - Number of trials
 * @param p - Probability of success in each trial (0 ≤ p ≤ 1)
 * @returns A single sample from B(n, p)
 */
export function binomialSample(n: number = 10, p: number = 0.5): number {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error('n must be a non-negative integer');
  }
  if (p < 0 || p > 1) {
    throw new Error('p must be between 0 and 1');
  }

  // For large n, use normal approximation
  if (n > 100 && n * p > 10 && n * (1 - p) > 10) {
    const mean = n * p;
    const stdDev = Math.sqrt(n * p * (1 - p));
    const sample = normalSample(mean, stdDev);
    return Math.max(0, Math.min(n, Math.round(sample)));
  }

  // Direct simulation
  let successes = 0;
  for (let i = 0; i < n; i++) {
    if (Math.random() < p) {
      successes++;
    }
  }
  return successes;
}

/**
 * Generate multiple samples from a distribution
 *
 * @param sampler - Function that generates a single sample
 * @param count - Number of samples to generate
 * @returns Array of samples
 */
export function generateSamples(
  sampler: () => number,
  count: number
): number[] {
  const samples: number[] = new Array(count);
  for (let i = 0; i < count; i++) {
    samples[i] = sampler();
  }
  return samples;
}

/**
 * Uniform sample on [0, 1]
 */
export function uniformSample(): number {
  return Math.random();
}

/**
 * Uniform sample on [a, b]
 */
export function uniformRangeSample(a: number, b: number): number {
  return a + Math.random() * (b - a);
}
