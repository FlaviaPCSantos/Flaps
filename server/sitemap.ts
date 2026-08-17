/**
 * Sitemap XML Generation
 * Generates dynamic sitemap for SEO
 */

export function generateSitemap(baseUrl: string): string {
  const urls = [
    {
      loc: baseUrl,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "daily",
      priority: "1.0"
    },
    {
      loc: `${baseUrl}/vitrine`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "daily",
      priority: "0.9"
    },
    {
      loc: `${baseUrl}/novidades`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "weekly",
      priority: "0.8"
    },
    {
      loc: `${baseUrl}/sobre`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "monthly",
      priority: "0.7"
    }
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
