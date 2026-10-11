/**
 * Prefix root-absolute links written in Markdown with the site's base path.
 *
 * Service pages are Markdown files, and their prose links to other pages the
 * way a person writes them: `[the children's page](/children/)`. Astro does
 * not rebase those, so on the GitHub Pages preview (served from
 * `/therapyhouse`) every one of them would point at the domain root and 404.
 * `.astro` files use `withBase` for this; this plugin is the same rule for
 * Markdown, applied once at build time.
 *
 * Only `href`s on `<a>` and `src`s on `<img>` (library article images) that
 * start with a single `/` are touched. External
 * URLs, `mailto:`, `#anchors`, protocol-relative `//` URLs and links already
 * carrying the prefix are left alone. No dependencies: the tree is walked by
 * hand rather than pulling in unist-util-visit for one loop.
 */
export function rehypeBaseLinks({ base = '/' } = {}) {
  const prefix = base.replace(/\/+$/, '');

  const rebase = (href) => {
    if (!prefix || typeof href !== 'string') return href;
    if (!href.startsWith('/') || href.startsWith('//')) return href;
    if (href === prefix || href.startsWith(`${prefix}/`)) return href;
    return `${prefix}${href}`;
  };

  const walk = (node) => {
    if (node.type === 'element' && node.tagName === 'a' && node.properties) {
      node.properties.href = rebase(node.properties.href);
    }
    if (node.type === 'element' && node.tagName === 'img' && node.properties) {
      node.properties.src = rebase(node.properties.src);
    }
    for (const child of node.children ?? []) walk(child);
  };

  return (tree) => walk(tree);
}
