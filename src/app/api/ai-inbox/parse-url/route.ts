import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

function isSafeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    // Block localhost
    if (hostname === 'localhost') {
      return false;
    }

    // Block IPv6 localhost
    if (hostname === '[::1]') {
      return false;
    }

    // Block IPv4-mapped IPv6 addresses (SSRF bypass vector)
    // These normalize to [::ffff:xx.xx.xx.xx] or [::ffff:xxxx:xxxx]
    if (hostname.includes('::ffff:')) {
      return false;
    }

    // Block private IP ranges (basic check, not exhaustive against all formats like hex/octal)
    // Note: 'new URL()' normalizes integer/hex/octal IPs to standard dot-decimal notation,
    // so checking '127.' covers '2130706433' (integer) and '0x7f000001' (hex).

    // 127.0.0.0/8
    if (hostname.startsWith('127.')) {
      return false;
    }
    // 10.0.0.0/8
    if (hostname.startsWith('10.')) {
      return false;
    }
    // 192.168.0.0/16
    if (hostname.startsWith('192.168.')) {
      return false;
    }
    // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
    if (hostname.startsWith('172.')) {
      const secondOctet = parseInt(hostname.split('.')[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) {
        return false;
      }
    }
    // 0.0.0.0/8
    if (hostname.startsWith('0.')) {
      return false;
    }
    // 169.254.0.0/16 (Link-local)
    if (hostname.startsWith('169.254.')) {
      return false;
    }

    // Block metadata services (e.g. AWS, GCP, Azure)
    if (hostname === '169.254.169.254') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Helper to read response with strict size limit
async function readResponseWithLimit(response: Response, limitBytes: number): Promise<string> {
  if (!response.body) {
    return '';
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = '';
  let bytesRead = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      if (value) {
        bytesRead += value.length;
        if (bytesRead > limitBytes) {
          throw new Error(`Response too large (max ${limitBytes / (1024 * 1024)}MB)`);
        }
        result += decoder.decode(value, { stream: true });
      }
    }
    // Flush decoder
    result += decoder.decode();
    return result;
  } finally {
    reader.releaseLock();
  }
}

// Export for testing
export const _isSafeUrl = isSafeUrl;

export async function GET(request: NextRequest) {
  // 1. Authentication Check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const initialUrl = searchParams.get('url');

  if (!initialUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // 2. SSRF Protection (Initial Check)
  if (!isSafeUrl(initialUrl)) {
    return NextResponse.json(
      { error: 'Invalid URL: Private or restricted access' },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    let currentUrl = initialUrl;
    let response: Response | null = null;
    let redirectCount = 0;
    const maxRedirects = 3;

    try {
      // Manual redirect handling
      while (redirectCount <= maxRedirects) {
        response = await fetch(currentUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AIInboxBot/1.0)',
          },
          redirect: 'manual',
          signal: controller.signal,
        });

        // Handle redirects
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (!location) {
            throw new Error('Redirect without location header');
          }

          // Resolve relative URLs
          const nextUrl = new URL(location, currentUrl).toString();

          // Validate redirect target
          if (!isSafeUrl(nextUrl)) {
            return NextResponse.json(
              { error: 'Invalid URL: Redirected to restricted address' },
              { status: 400 }
            );
          }

          currentUrl = nextUrl;
          redirectCount++;
          continue;
        }

        break;
      }

      if (!response) {
         throw new Error('No response');
      }

      if (redirectCount > maxRedirects) {
        return NextResponse.json(
          { error: 'Too many redirects' },
          { status: 400 }
        );
      }

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch URL: ${response.statusText}` },
          { status: response.status }
        );
      }

      // DoS Protection: Content Type
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('text/') && !contentType.includes('html') && !contentType.includes('json') && !contentType.includes('xml')) {
         // Allow common text formats, block binary
         return NextResponse.json(
            { error: 'Invalid content type. Only text-based content is supported.' },
            { status: 400 }
         );
      }

      // DoS Protection: Content Length (Check header first for fast fail)
      const contentLength = response.headers.get('content-length');
      const MAX_SIZE = 1024 * 1024; // 1MB

      if (contentLength && parseInt(contentLength, 10) > MAX_SIZE) {
        return NextResponse.json(
          { error: 'Response too large (max 1MB)' },
          { status: 400 }
        );
      }

      // Safe Read: Stream with limit
      // Note: We use our custom reader because response.text() reads everything into memory
      let html: string;
      try {
        html = await readResponseWithLimit(response, MAX_SIZE);
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('Response too large')) {
           return NextResponse.json(
            { error: 'Response too large (max 1MB)' },
            { status: 400 }
           );
        }
        throw err;
      }

      // Simple regex to extract title
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';

      // Decode HTML entities (basic)
      const decodedTitle = title
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      return NextResponse.json({ title: decodedTitle });

    } finally {
      clearTimeout(timeout);
    }

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
       return NextResponse.json({ error: 'Request timed out' }, { status: 408 });
    }

    logger.error('Error parsing URL:', error);
    return NextResponse.json(
      { error: 'Failed to parse URL' },
      { status: 500 }
    );
  }
}
