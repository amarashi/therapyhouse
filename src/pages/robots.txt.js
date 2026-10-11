/**
 * robots.txt, generated so the sitemap address always matches the configured
 * site and base (Preview or production) rather than being typed twice.
 *
 * It allows every crawler everywhere. The Preview must stay crawlable too:
 * its pages carry `noindex`, and a crawler that is blocked from a page never
 * reads that tag, so blocking would risk the Preview being listed from links
 * alone. (On the Preview this file sits under /therapyhouse/, where crawlers
 * do not look for it; it matters on the clinic's domain.)
 */
import { withBase } from '../lib/base.js';

export function GET({ site }) {
  const sitemap = new URL(withBase('/sitemap-index.xml'), site).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
