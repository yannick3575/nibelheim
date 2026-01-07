
import { describe, it, expect } from 'vitest';
import { _isSafeUrl } from '@/app/api/ai-inbox/parse-url/route';

describe('SSRF Protection (isSafeUrl)', () => {
  it('allows safe public URLs', () => {
    expect(_isSafeUrl('https://google.com')).toBe(true);
    expect(_isSafeUrl('https://example.com/path?query=1')).toBe(true);
    expect(_isSafeUrl('http://8.8.8.8')).toBe(true);
  });

  it('blocks localhost and loopback addresses', () => {
    expect(_isSafeUrl('http://localhost')).toBe(false);
    expect(_isSafeUrl('http://127.0.0.1')).toBe(false);
    expect(_isSafeUrl('http://127.0.0.5')).toBe(false);
    expect(_isSafeUrl('http://[::1]')).toBe(false);
  });

  it('blocks private IP ranges', () => {
    // 10.0.0.0/8
    expect(_isSafeUrl('http://10.0.0.1')).toBe(false);
    // 192.168.0.0/16
    expect(_isSafeUrl('http://192.168.1.1')).toBe(false);
    // 172.16.0.0/12
    expect(_isSafeUrl('http://172.16.0.1')).toBe(false);
    expect(_isSafeUrl('http://172.31.255.255')).toBe(false);
  });

  it('blocks alternative IP representations (handled by URL normalization)', () => {
    // Integer: 2130706433 -> 127.0.0.1
    expect(_isSafeUrl('http://2130706433')).toBe(false);
    // Hex: 0x7f000001 -> 127.0.0.1
    expect(_isSafeUrl('http://0x7f000001')).toBe(false);
    // Octal: 0177.0.0.1 -> 127.0.0.1 (if supported/normalized)
    const octal = 'http://0177.0.0.1';
    expect(_isSafeUrl(octal)).toBe(false);
  });

  it('blocks IPv6 mapped IPv4 addresses', () => {
    // This was the vulnerability: [::ffff:127.0.0.1]
    expect(_isSafeUrl('http://[::ffff:127.0.0.1]')).toBe(false);
    // [::ffff:7f00:1] is hex representation
    expect(_isSafeUrl('http://[::ffff:7f00:1]')).toBe(false);
    // [0:0:0:0:0:ffff:127.0.0.1]
    expect(_isSafeUrl('http://[0:0:0:0:0:ffff:127.0.0.1]')).toBe(false);
  });

  it('blocks cloud metadata services', () => {
    expect(_isSafeUrl('http://169.254.169.254')).toBe(false);
    expect(_isSafeUrl('http://169.254.0.1')).toBe(false); // Link-local range
  });

  it('blocks invalid URLs', () => {
    expect(_isSafeUrl('not-a-url')).toBe(false);
    expect(_isSafeUrl('ftp://google.com')).toBe(false); // Wrong protocol
  });
});
