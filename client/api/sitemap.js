export default async function handler(req, res) {
  try {
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    // Extract base URL of the backend
    const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
    
    // Determine path based on query
    const { type } = req.query;
    let path = '/sitemap.xml';
    if (type === 'static') {
      path = '/sitemap-static.xml';
    } else if (type === 'dynamic') {
      path = '/sitemap-dynamic.xml';
    }

    const sitemapUrl = `${baseUrl}${path}`;
    const response = await fetch(sitemapUrl);
    const xml = await response.text();

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
    res.status(response.status).send(xml);
  } catch (error) {
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?><error>${error.message}</error>`);
  }
}
