/**
 * Embedding Backfill Script
 *
 * Generates embeddings for all Tech Watch articles that don't have one yet.
 * Run with: npx tsx scripts/embed-backfill/run.ts
 *
 * Environment variables required:
 *   - GEMINI_API_KEY
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - USER_ID (the user whose articles to backfill)
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================
// CONFIG
// ============================================================

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;
const MAX_INPUT_CHARS = 32000;
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES_MS = 2000;
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ============================================================
// HELPERS
// ============================================================

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

async function generateEmbedding(
  apiKey: string,
  text: string
): Promise<number[] | null> {
  try {
    const truncated = text.slice(0, MAX_INPUT_CHARS);
    const url = `${GEMINI_API_BASE}/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text: truncated }] },
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  API error ${response.status}:`, errorText.slice(0, 200));
      return null;
    }

    const data = await response.json();
    const embedding = data?.embedding?.values;

    if (!embedding || !Array.isArray(embedding)) {
      console.error(`  Unexpected response structure`);
      return null;
    }

    return embedding;
  } catch (error) {
    console.error(`  Embedding generation failed:`, error);
    return null;
  }
}

function prepareTechWatchText(title: string, summary?: string | null, content?: string | null): string {
  const body = summary ?? content ?? '';
  return `${title}\n\n${body}`.slice(0, MAX_INPUT_CHARS);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('=== Tech Watch Embedding Backfill ===\n');

  const supabaseUrl = getEnvOrThrow('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseKey = getEnvOrThrow('SUPABASE_SERVICE_ROLE_KEY');
  const geminiApiKey = getEnvOrThrow('GEMINI_API_KEY');
  const userId = getEnvOrThrow('USER_ID');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all articles without embeddings for this user
  const { data: articles, error } = await supabase
    .from('tech_watch_articles')
    .select('id, title, summary, content')
    .eq('user_id', userId)
    .is('embedding', null)
    .order('collected_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch articles:', error);
    process.exit(1);
  }

  if (!articles || articles.length === 0) {
    console.log('No articles need embeddings. Done!');
    return;
  }

  console.log(`Found ${articles.length} articles without embeddings.\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(articles.length / BATCH_SIZE);

    console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} articles):`);

    const promises = batch.map(async (article) => {
      const text = prepareTechWatchText(article.title, article.summary, article.content);
      const embedding = await generateEmbedding(geminiApiKey, text);

      if (!embedding) {
        console.log(`  ✗ ${article.title.slice(0, 60)}...`);
        failed++;
        return;
      }

      const { error: updateError } = await supabase
        .from('tech_watch_articles')
        .update({ embedding })
        .eq('id', article.id);

      if (updateError) {
        console.error(`  ✗ DB update failed for ${article.id}:`, updateError.message);
        failed++;
      } else {
        console.log(`  ✓ ${article.title.slice(0, 60)}...`);
        success++;
      }
    });

    await Promise.all(promises);

    // Delay between batches to respect rate limits
    if (i + BATCH_SIZE < articles.length) {
      console.log(`  Waiting ${DELAY_BETWEEN_BATCHES_MS}ms...\n`);
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${articles.length}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
