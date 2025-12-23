import { GoogleGenerativeAI } from '@google/generative-ai';
import { createPrompt, getAllTags } from './prompt-library';
import type { PromptCategory } from './prompt-library/types';
import { logger } from './logger';

// ============================================ 
// CONFIGURATION
// ============================================ 

const GEMINI_MODEL = 'gemini-2.0-flash';

// Target URLs for discovery (Initial set)
const DISCOVERY_SOURCES = [
  'https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv',
  'https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/README.md',
];

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
// FUNCTIONS
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
      systemInstruction: EXTRACTION_SYSTEM_PROMPT 
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
      logger.error('[prompt-discovery] Failed to find JSON in Gemini response. Response preview:', text.substring(0, 500));
      return [];
    }

    const rawJson = jsonMatch[1] || jsonMatch[0];
    logger.info('[prompt-discovery] Extracted JSON, length:', rawJson.length);

    let prompts;
    try {
      prompts = JSON.parse(rawJson);
    } catch (parseError) {
      logger.error('[prompt-discovery] JSON parse error:', parseError, 'Raw JSON preview:', rawJson.substring(0, 300));
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
 * Main discovery function
 */
export async function discoverAndSavePrompts(userId: string) {
  logger.info(`[prompt-discovery] Starting discovery for user ${userId}`);

  const existingTags = await getAllTags();
  logger.info(`[prompt-discovery] Found ${existingTags.length} existing tags`);

  const allDiscoveredPrompts = [];

  for (const url of DISCOVERY_SOURCES) {
    logger.info(`[prompt-discovery] Processing source: ${url}`);
    const prompts = await discoverFromUrl(url, existingTags);
    logger.info(`[prompt-discovery] Extracted ${prompts.length} prompts from ${url}`);
    allDiscoveredPrompts.push(...prompts.map(p => ({ ...p, source_url: url })));
  }

  logger.info(`[prompt-discovery] Total prompts to save: ${allDiscoveredPrompts.length}`);

  const savedPrompts = [];
  for (const p of allDiscoveredPrompts) {
    logger.info(`[prompt-discovery] Saving prompt: "${p.title}" (${p.category})`);
    // We save them as 'draft' for review
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

  logger.info(`[prompt-discovery] Discovery complete. Saved ${savedPrompts.length}/${allDiscoveredPrompts.length} prompts`);
  return savedPrompts;
}