import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // 2. SSRF Protection
  if (!isSafeUrl(url)) {
    return NextResponse.json(
      { error: 'Invalid URL: Private or restricted access' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIInboxBot/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    
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
  } catch (error) {
    console.error('Error parsing URL:', error);
    return NextResponse.json(
      { error: 'Failed to parse URL' },
      { status: 500 }
    );
  }
}
