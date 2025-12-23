// ============================================
// STOCHASTIC LAB - TYPE DEFINITIONS
// Client-safe types for probabilistic simulations
// ============================================

// ============================================
// DISTRIBUTION TYPES
// ============================================

export type DistributionType = 'normal' | 'poisson' | 'exponential' | 'binomial';

export interface NormalParams {
  mean: number;      // μ - Expected value
  stdDev: number;    // σ - Standard deviation (σ² = variance)
}

export interface PoissonParams {
  lambda: number;    // λ - Rate parameter (λ > 0)
}

export interface ExponentialParams {
  lambda: number;    // λ - Rate parameter (mean = 1/λ)
}

export interface BinomialParams {
  n: number;         // Number of trials
  p: number;         // Probability of success (0 ≤ p ≤ 1)
}

export type DistributionParams =
  | { type: 'normal'; params: NormalParams }
  | { type: 'poisson'; params: PoissonParams }
  | { type: 'exponential'; params: ExponentialParams }
  | { type: 'binomial'; params: BinomialParams };

// ============================================
// SIMULATION TYPES
// ============================================

export type SimulationType = 'monte-carlo' | 'markov-chain' | 'random-walk';

export interface MonteCarloConfig {
  iterations: number;
  distribution: DistributionParams;
  // For custom estimators (e.g., π estimation)
  estimator?: 'mean' | 'pi-geometric' | 'integral';
}

export interface MarkovChainConfig {
  states: string[];
  transitionMatrix: number[][];  // P[i][j] = P(X_{n+1} = j | X_n = i)
  initialState: number;          // Index of starting state
  steps: number;
}

export interface RandomWalkConfig {
  dimensions: 1 | 2;
  steps: number;
  stepDistribution: DistributionParams;
  drift?: number;                // μ for drift term
}

export type SimulationConfig =
  | { type: 'monte-carlo'; config: MonteCarloConfig }
  | { type: 'markov-chain'; config: MarkovChainConfig }
  | { type: 'random-walk'; config: RandomWalkConfig };

// ============================================
// SIMULATION RESULTS
// ============================================

export interface Statistics {
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  confidenceInterval95: [number, number];
}

export interface HistogramData {
  bins: string[];
  counts: number[];
}

export interface ConvergenceData {
  iterations: number[];
  values: number[];
}

export interface SimulationResult {
  type: SimulationType;
  executedAt: string;
  executionTimeMs: number;
  iterations: number;
  values: number[];
  statistics: Statistics;
  histogram?: HistogramData;
  convergence?: ConvergenceData;
  // For Markov chains
  statePath?: string[];
  stateFrequencies?: Record<string, number>;
  // For random walks
  path?: number[][];
}

// ============================================
// CHAT / CONVERSATION TYPES
// ============================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface SimulationAttachment {
  config: SimulationConfig;
  result?: SimulationResult;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  simulation?: SimulationAttachment;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface CreateConversationInput {
  title?: string;
}

export interface UpdateConversationInput {
  title?: string;
  messages?: ChatMessage[];
}

// ============================================
// MODULE_DATA JSONB CONTENT SCHEMA
// ============================================

export interface StochasticLabContent {
  version: '1.0';
  type: 'conversation';
  title: string;
  messages: ChatMessage[];
}

// ============================================
// AGENT TYPES
// ============================================

export interface AgentPlanResponse {
  explanation: string;         // May contain LaTeX
  simulation?: SimulationConfig;
  reasoning?: string;
}

// ============================================
// CONSTANTS
// ============================================

export const SIMULATION_LABELS: Record<SimulationType, string> = {
  'monte-carlo': 'Monte Carlo',
  'markov-chain': 'Chaîne de Markov',
  'random-walk': 'Marche Aléatoire',
};

export const DISTRIBUTION_LABELS: Record<DistributionType, string> = {
  normal: 'Normale (Gaussienne)',
  poisson: 'Poisson',
  exponential: 'Exponentielle',
  binomial: 'Binomiale',
};

export const DISTRIBUTION_NOTATION: Record<DistributionType, string> = {
  normal: 'X ~ N(μ, σ²)',
  poisson: 'X ~ Pois(λ)',
  exponential: 'X ~ Exp(λ)',
  binomial: 'X ~ B(n, p)',
};
