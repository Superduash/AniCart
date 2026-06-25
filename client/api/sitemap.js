export default async function handler(req, res) {
  try {
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    // Extract base URL of the backend
    const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
    
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    let response;
    let xml = '';
    
    try {
      response = await fetch(sitemapUrl, { signal: AbortSignal.timeout(8000) });
      if (response.ok) {
        xml = await response.text();
      }
    } catch (fetchError) {
      console.error('Failed to fetch dynamic sitemap from backend:', fetchError.message);
    }

    // Validate that we got a valid XML response starting with '<?xml'
    if (xml && xml.trim().startsWith('<?xml')) {
      res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
      return res.status(200).end(xml.trim());
    }

    // Fallback static sitemap if backend is down or returned invalid XML
    console.warn('Backend sitemap unavailable or invalid. Serving fallback static sitemap.');
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'anicartwallpaper.vercel.app';
    const siteBaseUrl = `${protocol}://${host}`;
    const lastModDate = new Date().toISOString().split('T')[0];

    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteBaseUrl}/</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteBaseUrl}/marketplace</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${siteBaseUrl}/anime</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${siteBaseUrl}/characters</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${siteBaseUrl}/collections</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteBaseUrl}/categories</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteBaseUrl}/4k-wallpapers</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteBaseUrl}/mobile-wallpapers</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteBaseUrl}/new</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteBaseUrl}/trending</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteBaseUrl}/popular</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
    res.status(200).end(fallbackXml);
  } catch (error) {
    // Ultimate fallback, must still be XML!
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://anicartwallpaper.vercel.app/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.status(200).end(errorXml);
  }
}
