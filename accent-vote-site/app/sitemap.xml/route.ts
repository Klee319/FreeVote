import { NextResponse } from 'next/server';

/**
 * 動的にサイトマップXMLを生成するAPIルート
 * SEO対策およびアクセシビリティ向上のため
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://accent-vote.jp';
  
  // サイトマップに含めるページのリスト
  const pages = [
    {
      url: '/',
      changefreq: 'daily',
      priority: '1.0',
      lastmod: new Date().toISOString(),
    },
    {
      url: '/search',
      changefreq: 'daily',
      priority: '0.9',
      lastmod: new Date().toISOString(),
    },
    {
      url: '/ranking',
      changefreq: 'daily',
      priority: '0.9',
      lastmod: new Date().toISOString(),
    },
    {
      url: '/submit',
      changefreq: 'weekly',
      priority: '0.7',
      lastmod: new Date().toISOString(),
    },
    {
      url: '/guide',
      changefreq: 'monthly',
      priority: '0.8',
      lastmod: new Date().toISOString(),
    },
    {
      url: '/terms',
      changefreq: 'monthly',
      priority: '0.5',
      lastmod: new Date().toISOString(),
    },
    {
      url: '/privacy',
      changefreq: 'monthly',
      priority: '0.5',
      lastmod: new Date().toISOString(),
    },
    {
      url: '/sitemap',
      changefreq: 'monthly',
      priority: '0.3',
      lastmod: new Date().toISOString(),
    },
  ];

  // XML生成
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${pages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}