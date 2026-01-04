/**
 * Scraper Utility
 * 
 * Extracts clean, LLM-friendly content from URLs using Jina Reader (r.jina.ai).
 * This service converts any URL into markdown, which is ideal for analysis by Gemini.
 */

import { logger } from './logger';

const JINA_READER_URL = 'https://r.jina.ai/';

/**
 * Extract content from a URL
 * Falls back to null if extraction fails
 */
export async function extractUrlContent(url: string): Promise<string | null> {
    if (!url) return null;

    try {
        logger.log(`[scraper] Extracting content from: ${url}`);

        // We append the URL to the Jina Reader endpoint
        const targetUrl = `${JINA_READER_URL}${url}`;

        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Accept': 'text/plain', // Jina returns plain text/markdown
            },
        });

        if (!response.ok) {
            logger.warn(`[scraper] Failed to extract from ${url}: ${response.statusText}`);
            return null;
        }

        const content = await response.text();

        if (!content || content.length < 50) {
            logger.warn(`[scraper] Extracted content is too short for ${url}`);
            return null;
        }

        logger.log(`[scraper] Successfully extracted ${content.length} characters from ${url}`);
        return content;
    } catch (error) {
        logger.error(`[scraper] Error extracting from ${url}:`, error);
        return null;
    }
}
