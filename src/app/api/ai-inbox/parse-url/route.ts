import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // 1. Protocol validation
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // 2. Hostname validation
    const hostname = parsed.hostname.toLowerCase();

    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return false;
    }

    // Block private IP ranges (simple regex)
    // 10.x.x.x
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return false;
    // 192.168.x.x
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return false;
    // 172.16-31.x.x
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return false;
    // 169.254.x.x (Link-local / Cloud metadata)
    if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(hostname)) return false;

    return true;
  } catch {
    return false;
  }
}

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
    return NextResponse.json({ error: 'Invalid or forbidden URL' }, { status: 400 });
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
