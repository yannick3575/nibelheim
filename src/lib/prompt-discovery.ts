import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPrompt, getAllTags } from './prompt-library';
import type { PromptCategory, DiscoverySource } from './prompt-library/types';
import { logger } from './logger';

// ============================================
// CONFIGURATION
// ============================================

const GEMINI_MODEL = 'gemini-3-flash-preview';

// ============================================
// AI PROMPT
// ============================================

const EXTRACTION_SYSTEM_PROMPT = `
You are an expert prompt engineer and data extractor.
Your task is to analyze the provided content and extract high-quality AI prompts.

For each prompt found, you must provide:
1. A concise and descriptive title.
2. The exact content of the prompt.
3. A category from this list: coding, writing, analysis, creative, other.
4. A set of relevant tags (use existing tags if provided).

Return the results as a JSON array of objects with the following structure:
[
  {
    "title": "...",
    "content": "...",
    "category": "...",
    "tags": ["...", "..."]
  }
]

Only return high-quality prompts. If the content contains many prompts, select the 5 most interesting ones.
`;

// ============================================
// DISCOVERY SOURCE MANAGEMENT
// ============================================

/**
 * Get all enabled discovery sources, ordered by priority
 */
export async function getDiscoverySources(): Promise<DiscoverySource[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_discovery_sources')
    .select('*')
    .eq('is_enabled', true)
    .order('priority', { ascending: false });

  if (error) {
    logger.error('[prompt-discovery] Failed to fetch sources:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all discovery sources (including disabled)
 */
export async function getAllDiscoverySources(): Promise<DiscoverySource[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_discovery_sources')
    .select('*')
    .order('priority', { ascending: false });

  if (error) {
    logger.error('[prompt-discovery] Failed to fetch all sources:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single discovery source by ID
 */
export async function getDiscoverySource(id: string): Promise<DiscoverySource | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_discovery_sources')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('[prompt-discovery] Failed to fetch source:', error, { sourceId: id });
    return null;
  }

  return data;
}

/**
 * Create a new discovery source
 * Uses admin client to bypass RLS (sources are admin-managed)
 */
export async function createDiscoverySource(input: {
  name: string;
  description?: string;
  url: string;
  source_type?: string;
  category?: string;
  priority?: number;
}): Promise<DiscoverySource | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('prompt_discovery_sources')
    .insert({
      name: input.name,
      description: input.description,
      url: input.url,
      source_type: input.source_type || 'github_raw',
      category: input.category || 'general',
      priority: input.priority || 0,
    })
    .select()
    .single();

  if (error) {
    logger.error('[prompt-discovery] Failed to create source:', error, { name: input.name });
    return null;
  }

  return data;
}

/**
 * Update a discovery source
 * Uses admin client to bypass RLS (sources are admin-managed)
 */
export async function updateDiscoverySource(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    url: string;
    source_type: string;
    category: string;
    is_enabled: boolean;
    priority: number;
  }>
): Promise<DiscoverySource | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('prompt_discovery_sources')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('[prompt-discovery] Failed to update source:', error, { sourceId: id });
    return null;
  }

  return data;
}

/**
 * Delete a discovery source
 * Uses admin client to bypass RLS (sources are admin-managed)
 */
export async function deleteDiscoverySource(id: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('prompt_discovery_sources')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('[prompt-discovery] Failed to delete source:', error, { sourceId: id });
    return false;
  }

  return true;
}

/**
 * Update source statistics after a fetch
 * Uses admin client to bypass RLS (sources are admin-managed)
 */
async function updateSourceStats(
  sourceId: string,
  success: boolean,
  promptsExtracted: number,
  errorMessage?: string
): Promise<void> {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    last_fetched_at: new Date().toISOString(),
    last_error: success ? null : (errorMessage || 'Unknown error'),
  };

  if (success && promptsExtracted > 0) {
    updateData.prompts_extracted = promptsExtracted;
  }

  const { error } = await supabase
    .from('prompt_discovery_sources')
    .update(updateData)
    .eq('id', sourceId);

  if (error) {
    logger.error('[prompt-discovery] Failed to update source stats:', error, { sourceId });
  }
}

// ============================================
// AI EXTRACTION FUNCTIONS
// ============================================

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Extract prompts from raw text content using Gemini
 */
export async function extractPromptsFromContent(content: string, existingTags: string[] = []) {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: EXTRACTION_SYSTEM_PROMPT,
    });

    const prompt = `
Context: Here are some existing tags in the library: ${existingTags.join(', ')}
Content to analyze:
---
${content.substring(0, 30000)}
---
Extract the prompts in JSON format.
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    logger.info('[prompt-discovery] Gemini response received, length:', text.length);

    // Extract JSON from markdown if present (try multiple patterns)
    let jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      // Try to find a JSON array directly (greedy to get the full array)
      jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    }

    if (!jsonMatch) {
      logger.error(
        '[prompt-discovery] Failed to find JSON in Gemini response. Response preview:',
        text.substring(0, 500)
      );
      return [];
    }

    const rawJson = jsonMatch[1] || jsonMatch[0];
    logger.info('[prompt-discovery] Extracted JSON, length:', rawJson.length);

    let prompts;
    try {
      prompts = JSON.parse(rawJson);
    } catch (parseError) {
      logger.error(
        '[prompt-discovery] JSON parse error:',
        parseError,
        'Raw JSON preview:',
        rawJson.substring(0, 300)
      );
      return [];
    }

    return prompts as Array<{
      title: string;
      content: string;
      category: PromptCategory;
      tags: string[];
    }>;
  } catch (error) {
    logger.error('[prompt-discovery] AI Extraction error:', error);
    return [];
  }
}

/**
 * Discover prompts from a specific URL
 */
export async function discoverFromUrl(url: string, existingTags: string[] = []) {
  try {
    logger.info(`[prompt-discovery] Fetching from ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const content = await response.text();

    return await extractPromptsFromContent(content, existingTags);
  } catch (error) {
    logger.error(`[prompt-discovery] Error discovering from ${url}:`, error);
    return [];
  }
}

/**
 * Discover prompts from a single source
 */
export async function discoverFromSource(
  source: DiscoverySource,
  existingTags: string[] = []
): Promise<{
  prompts: Array<{
    title: string;
    content: string;
    category: PromptCategory;
    tags: string[];
    source_url: string;
    source_name: string;
  }>;
  error?: string;
}> {
  try {
    logger.info(`[prompt-discovery] Processing source: ${source.name} (${source.url})`);
    const prompts = await discoverFromUrl(source.url, existingTags);

    // Update stats
    await updateSourceStats(source.id, true, prompts.length);

    return {
      prompts: prompts.map((p) => ({
        ...p,
        source_url: source.url,
        source_name: source.name,
      })),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateSourceStats(source.id, false, 0, errorMessage);
    logger.error(`[prompt-discovery] Error with source ${source.name}:`, error);
    return { prompts: [], error: errorMessage };
  }
}

/**
 * Main discovery function - discovers from all enabled sources
 */
export async function discoverAndSavePrompts(userId: string, sourceIds?: string[]) {
  logger.info(`[prompt-discovery] Starting discovery for user ${userId}`);

  // Get sources (all enabled or specific ones)
  let sources: DiscoverySource[];
  if (sourceIds && sourceIds.length > 0) {
    const allSources = await getAllDiscoverySources();
    sources = allSources.filter((s) => sourceIds.includes(s.id));
  } else {
    sources = await getDiscoverySources();
  }

  if (sources.length === 0) {
    logger.warn('[prompt-discovery] No sources found to process');
    return { savedPrompts: [], errors: [] };
  }

  logger.info(`[prompt-discovery] Found ${sources.length} sources to process`);

  const existingTags = await getAllTags();
  logger.info(`[prompt-discovery] Found ${existingTags.length} existing tags`);

  const allDiscoveredPrompts: Array<{
    title: string;
    content: string;
    category: PromptCategory;
    tags: string[];
    source_url: string;
    source_name: string;
  }> = [];
  const errors: Array<{ source: string; error: string }> = [];

  // Process each source
  for (const source of sources) {
    const result = await discoverFromSource(source, existingTags);
    if (result.error) {
      errors.push({ source: source.name, error: result.error });
    }
    allDiscoveredPrompts.push(...result.prompts);
    logger.info(
      `[prompt-discovery] Extracted ${result.prompts.length} prompts from ${source.name}`
    );
  }

  logger.info(`[prompt-discovery] Total prompts to save: ${allDiscoveredPrompts.length}`);

  // Save prompts
  const savedPrompts = [];
  for (const p of allDiscoveredPrompts) {
    logger.info(`[prompt-discovery] Saving prompt: "${p.title}" (${p.category})`);
    const saved = await createPrompt({
      title: p.title,
      content: p.content,
      category: p.category,
      tags: p.tags,
      source_url: p.source_url,
      is_automated: true,
      status: 'draft',
    });
    if (saved) {
      logger.info(`[prompt-discovery] Saved prompt: ${saved.id}`);
      savedPrompts.push(saved);
    } else {
      logger.error(`[prompt-discovery] Failed to save prompt: "${p.title}"`);
    }
  }

  logger.info(
    `[prompt-discovery] Discovery complete. Saved ${savedPrompts.length}/${allDiscoveredPrompts.length} prompts`
  );

  return { savedPrompts, errors };
}
