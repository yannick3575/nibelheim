import { GoogleGenerativeAI } from '@google/generative-ai';
import { createPrompt, getAllTags } from './prompt-library';
import type { PromptCategory } from './prompt-library/types';
import { logger } from './logger';

// ============================================ 
// CONFIGURATION
// ============================================ 

const GEMINI_MODEL = 'gemini-1.5-flash';

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
    logger.log('Gemini Response Text:', text);

    // Extract JSON from markdown if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      logger.error('[prompt-discovery] Failed to find JSON in Gemini response', text);
      return [];
    }

    const rawJson = jsonMatch[1] || jsonMatch[0];
    logger.log('Raw JSON:', rawJson);
    const prompts = JSON.parse(rawJson);

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
  const existingTags = await getAllTags();
  const allDiscoveredPrompts = [];

  for (const url of DISCOVERY_SOURCES) {
    const prompts = await discoverFromUrl(url, existingTags);
    allDiscoveredPrompts.push(...prompts.map(p => ({ ...p, source_url: url })));
  }

  const savedPrompts = [];
  for (const p of allDiscoveredPrompts) {
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
    if (saved) savedPrompts.push(saved);
  }

  return savedPrompts;
}