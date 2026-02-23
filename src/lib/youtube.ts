/**
 * YouTube Utility
 * 
 * Fetches transcripts for YouTube videos using the youtube-transcript package.
 */

import { YoutubeTranscript } from 'youtube-transcript';
import { logger } from './logger';

const FETCH_TIMEOUT = 10000; // 10 seconds timeout

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

/**
 * Fetch transcript for a YouTube video
 * Returns a single string with the full transcript or null if not available
 */
export async function getYouTubeTranscript(url: string): Promise<string | null> {
    const videoId = extractVideoId(url);

    if (!videoId) {
        logger.warn(`[youtube] Could not extract video ID from: ${url}`);
        return null;
    }

    try {
        logger.log(`[youtube] Fetching transcript for video: ${videoId}`);

        // We try to fetch the transcript with a timeout
        const transcriptPromise = YoutubeTranscript.fetchTranscript(videoId);
        let timeoutId: ReturnType<typeof setTimeout>;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('YouTube transcript fetch timeout')), FETCH_TIMEOUT);
        });

        let transcriptConfig;
        try {
            transcriptConfig = await Promise.race([transcriptPromise, timeoutPromise]);
        } finally {
            clearTimeout(timeoutId!);
        }

        if (!transcriptConfig || transcriptConfig.length === 0) {
            logger.warn(`[youtube] No transcript found for video: ${videoId}`);
            return null;
        }

        // Combine all transcript parts into a single text
        const fullText = transcriptConfig
            .map(part => part.text)
            .join(' ')
            .replace(/&amp;#39;/g, "'")
            .replace(/&amp;quot;/g, '"')
            .trim();

        logger.log(`[youtube] Successfully fetched ${fullText.length} characters of transcript`);
        return fullText;
    } catch (error) {
        // Fail silently but log the error
        logger.warn(`[youtube] Failed to fetch transcript for ${videoId}:`, error instanceof Error ? error.message : error);
        return null;
    }
}
