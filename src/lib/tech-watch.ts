import fs from 'fs';
import path from 'path';

// Path to the digests directory
const DIGESTS_DIR = path.join(process.cwd(), 'scripts', 'tech-watch-bot', 'digests');

export interface DigestMeta {
    slug: string;
    date: string;
    filename: string;
}

export interface DigestContent extends DigestMeta {
    content: string;
}

/**
 * Ensures the digests directory exists
 */
function ensureDirectory() {
    if (!fs.existsSync(DIGESTS_DIR)) {
        // If directory doesn't exist (e.g. no digests yet), return empty list safely
        return false;
    }
    return true;
}

/**
 * Lists all available digests, sorted by date (newest first)
 */
export async function getDigests(): Promise<DigestMeta[]> {
    if (!ensureDirectory()) return [];

    try {
        const files = fs.readdirSync(DIGESTS_DIR);

        const digests = files
            .filter(file => file.startsWith('digest_') && file.endsWith('.md'))
            .map(file => {
                // filename format: digest_YYYY-MM-DD.md
                const datePart = file.replace('digest_', '').replace('.md', '');
                return {
                    slug: datePart, // We use the date as the slug
                    date: datePart,
                    filename: file
                };
            })
            .sort((a, b) => b.date.localeCompare(a.date)); // Sort descending (newest first)

        return digests;
    } catch (error) {
        console.error("Error reading digests directory:", error);
        return [];
    }
}

/**
 * Gets a specific digest by slug (date)
 */
export async function getDigest(slug: string): Promise<DigestContent | null> {
    if (!ensureDirectory()) return null;

    const filename = `digest_${slug}.md`;
    const filePath = path.join(DIGESTS_DIR, filename);

    if (!fs.existsSync(filePath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return {
            slug,
            date: slug,
            filename,
            content
        };
    } catch (error) {
        console.error(`Error reading digest ${slug}:`, error);
        return null;
    }
}

/**
 * Gets the latest digest
 */
export async function getLatestDigest(): Promise<DigestContent | null> {
    const digests = await getDigests();
    if (digests.length === 0) return null;

    return getDigest(digests[0].slug);
}
