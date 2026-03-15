/**
 * Embedding Service
 *
 * Generates 768-dimensional embeddings using Gemini gemini-embedding-001.
 * Uses the REST API directly (SDK v0.24.1 doesn't support outputDimensionality).
 * Used by Knowledge Base (at save time) and backfill scripts.
 */

import 'server-only';

import { logger } from '@/lib/logger';

// ============================================================
// CONFIGURATION
// ============================================================

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;
const MAX_INPUT_CHARS = 32000; // ~8K tokens
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export type EmbeddingTaskType = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';

export interface EmbeddingResult {
  embedding: number[];
}

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Generate a single embedding vector for the given text.
 * Calls the Gemini REST API directly to support outputDimensionality.
 *
 * @param text - Raw text to embed (truncated at MAX_INPUT_CHARS)
 * @param taskType - 'RETRIEVAL_DOCUMENT' when indexing, 'RETRIEVAL_QUERY' when searching
 */
export async function generateEmbedding(
  text: string,
  taskType: EmbeddingTaskType = 'RETRIEVAL_DOCUMENT'
): Promise<EmbeddingResult | null> {
  if (!text || text.trim().length === 0) {
    logger.warn('[embeddings] generateEmbedding called with empty text');
    return null;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.error('[embeddings] GEMINI_API_KEY is not configured');
    return null;
  }

  const truncatedText = text.slice(0, MAX_INPUT_CHARS);

  try {
    const url = `${GEMINI_API_BASE}/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text: truncatedText }] },
        taskType,
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[embeddings] API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const embedding = data?.embedding?.values;

    if (!embedding || !Array.isArray(embedding)) {
      logger.error('[embeddings] Unexpected response structure:', data);
      return null;
    }

    return { embedding };
  } catch (error) {
    logger.error('[embeddings] generateEmbedding failed:', error, {
      taskType,
      textLength: text.length,
    });
    return null;
  }
}

/**
 * Generate embeddings for a batch of texts.
 * Processes sequentially with delays to avoid rate limits.
 *
 * @param texts - Array of texts to embed
 * @param batchSize - Number to process concurrently (default 5)
 * @param delayMs - Delay between batches in ms (default 1000)
 */
export async function generateEmbeddingBatch(
  texts: string[],
  batchSize = 5,
  delayMs = 1000
): Promise<(EmbeddingResult | null)[]> {
  const results: (EmbeddingResult | null)[] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((text) => generateEmbedding(text, 'RETRIEVAL_DOCUMENT'))
    );
    results.push(...batchResults);

    // Delay between batches (skip after last)
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Prepare text for embedding from a KB entry.
 */
export function prepareKBEntryText(title: string, content: string): string {
  return `${title}\n\n${content}`.slice(0, MAX_INPUT_CHARS);
}

/**
 * Prepare text for embedding from a Tech Watch article.
 */
export function prepareTechWatchText(
  title: string,
  summary?: string | null,
  content?: string | null
): string {
  const body = summary ?? content ?? '';
  return `${title}\n\n${body}`.slice(0, MAX_INPUT_CHARS);
}
