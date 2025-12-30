/**
 * AI Inbox Gemini Integration
 *
 * Provides AI-powered analysis of content items using Google's Gemini 3 Flash model.
 * The analysis is personalized based on the user's profile (stack, projects, interests).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Item, AIAnalysis, UserProfile } from '@/types/ai-inbox';
import { logger } from '@/lib/logger';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Configuration
const MODEL_ID = 'gemini-2.0-flash'; // Stable model for production
const GENERATION_CONFIG = {
  temperature: 0.3,
  maxOutputTokens: 1024,
  topP: 0.8,
};

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

/**
 * System prompt for Gemini - defines the AI's persona and response format
 */
const SYSTEM_PROMPT = `Tu es un assistant expert pour développeurs "vibe coders" — des développeurs qui construisent des projets personnels en s'appuyant fortement sur l'IA générative (Claude, Cursor, Copilot, v0, Bolt, etc.).

Ta mission : analyser du contenu tech (vidéos YouTube, articles Substack, ressources diverses) et évaluer sa pertinence et son applicabilité pour le profil spécifique de l'utilisateur.

Tu dois être :
- Pragmatique : focus sur ce qui est actionnable
- Concis : pas de blabla, va à l'essentiel
- Personnalisé : tes réponses doivent refléter le profil de l'utilisateur
- Créatif : propose des idées de projets concrètes

Tu réponds UNIQUEMENT en JSON valide, sans markdown ni texte autour.`;

/**
 * Build the user prompt for analysis
 */
function buildUserPrompt(item: Item, userProfile: UserProfile): string {
  return `## Profil de l'utilisateur

\`\`\`json
${JSON.stringify(userProfile, null, 2)}
\`\`\`

## Contenu à analyser

**Titre**: ${item.title}
**Type de source**: ${item.source_type}
**URL**: ${item.url || 'Non fournie'}

**Contenu brut**:
${item.raw_content || "Aucun contenu extrait. Analyse basée uniquement sur le titre et l'URL."}

---

## Instructions

Analyse ce contenu du point de vue d'un vibe coder et retourne un JSON avec cette structure exacte :

{
    "summary": "2-3 phrases résumant l'essentiel du contenu. Sois concis et direct.",

    "actionability": <1-5>,

    "complexity": <1-5>,

    "project_ideas": [
        "Idée concrète #1 liée aux projets actuels de l'utilisateur",
        "Idée concrète #2 si pertinent"
    ],

    "relevance_to_profile": "1-2 phrases expliquant pourquoi ce contenu est (ou n'est pas) pertinent pour CE profil spécifique. Mentionne les technos/projets de l'utilisateur.",

    "suggested_category": "<tools|prompts|tutorials|news|inspiration>",

    "suggested_tags": ["tag1", "tag2", "tag3"]
}

IMPORTANT : Retourne UNIQUEMENT le JSON, sans backticks, sans markdown, sans texte avant ou après.`;
}

/**
 * Parse Gemini response text into AIAnalysis object
 */
function parseGeminiResponse(text: string): AIAnalysis | null {
  try {
    // Clean potential markdown backticks
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    // Basic validation
    if (
      !parsed.summary ||
      typeof parsed.actionability !== 'number' ||
      typeof parsed.complexity !== 'number'
    ) {
      logger.error('[ai-inbox-gemini] Invalid response structure:', parsed);
      return null;
    }

    // Ensure arrays exist
    if (!Array.isArray(parsed.project_ideas)) {
      parsed.project_ideas = [];
    }
    if (!Array.isArray(parsed.suggested_tags)) {
      parsed.suggested_tags = [];
    }

    return parsed as AIAnalysis;
  } catch (error) {
    logger.error('[ai-inbox-gemini] Failed to parse response:', error);
    logger.error('[ai-inbox-gemini] Raw text:', text);
    return null;
  }
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Analyze an item using Gemini AI
 *
 * @param item - The content item to analyze
 * @param userProfile - The user's profile for personalized analysis
 * @returns AIAnalysis object or null if analysis fails
 */
export async function analyzeItem(
  item: Item,
  userProfile: UserProfile
): Promise<AIAnalysis | null> {
  if (!process.env.GEMINI_API_KEY) {
    logger.error('[ai-inbox-gemini] GEMINI_API_KEY not configured');
    return null;
  }

  const model = genAI.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: GENERATION_CONFIG,
  });

  const userPrompt = buildUserPrompt(item, userProfile);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      logger.log(
        `[ai-inbox-gemini] Analyzing item ${item.id}, attempt ${attempt + 1}/${MAX_RETRIES}`
      );

      const result = await model.generateContent(userPrompt);
      const response = result.response;
      const text = response.text();

      const analysis = parseGeminiResponse(text);

      if (analysis) {
        logger.log(`[ai-inbox-gemini] Successfully analyzed item ${item.id}`);
        return analysis;
      }

      // If parsing failed but we got a response, don't retry
      logger.error(
        `[ai-inbox-gemini] Failed to parse response for item ${item.id}`
      );
      return null;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.error(
        `[ai-inbox-gemini] Attempt ${attempt + 1} failed for item ${item.id}:`,
        lastError.message
      );

      // If not the last attempt, wait before retrying
      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAYS[attempt];
        logger.log(`[ai-inbox-gemini] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  logger.error(
    `[ai-inbox-gemini] All ${MAX_RETRIES} attempts failed for item ${item.id}:`,
    lastError?.message
  );
  return null;
}

/**
 * Default user profile for users without settings
 */
export const DEFAULT_USER_PROFILE: UserProfile = {
  current_stack: [],
  current_projects: [],
  skill_level: 'intermediate',
  interests: [],
};
