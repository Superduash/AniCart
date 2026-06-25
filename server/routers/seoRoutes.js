const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Product = require('../models/Product');
const config = require('../config');
const slugify = require('slugify');
const productService = require('../services/productService');

const slugifyHelper = (str) => slugify(str, { lower: true, strict: true, trim: true });
const formatDate = (date) => new Date(date).toISOString().split('T')[0];

// Safe XML characters escape utility
const escapeXml = (unsafe) => {
  if (!unsafe) return '';
  const AMP = '&' + 'amp;';
  const LT = '&' + 'lt;';
  const GT = '&' + 'gt;';
  const QUOT = '&' + 'quot;';
  const APOS = '&' + 'apos;';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return LT;
      case '>': return GT;
      case '&': return AMP;
      case '\'': return APOS;
      case '"': return QUOT;
    }
  });
};

/**
 * @desc    Generate dynamic sitemap.xml conforming to the official Sitemap Protocol
 * @route   GET /sitemap.xml
 * @access  Public
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = (config.CLIENT_URL || 'https://anicartwallpaper.vercel.app').replace(/\/$/, '');
    const lastModDate = formatDate(new Date());

    // Fetch active products
    const products = await Product.find({ status: 'active' }).select('slug _id updatedAt series name assets');

    // Distinct series
    const distinctSeries = await Product.getDistinctSeries();

    // Predefined popular characters that have active wallpapers
    const characters = await productService.getCharacters();

    const addedUrls = new Set();
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

    const addUrl = (loc, lastmod, changefreq, priority, imageBlock) => {
      const escapedLoc = escapeXml(loc);
      if (addedUrls.has(escapedLoc)) return;
      addedUrls.add(escapedLoc);
      xml += `\n  <url>
    <loc>${escapedLoc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageBlock || ''}
  </url>`;
    };

    // Core Public Hubs
    addUrl(`${baseUrl}/`, lastModDate, 'daily', '1.0');
    addUrl(`${baseUrl}/marketplace`, lastModDate, 'daily', '0.9');
    addUrl(`${baseUrl}/anime`, lastModDate, 'daily', '0.9');
    addUrl(`${baseUrl}/characters`, lastModDate, 'daily', '0.9');
    addUrl(`${baseUrl}/collections`, lastModDate, 'daily', '0.8');
    addUrl(`${baseUrl}/4k-wallpapers`, lastModDate, 'daily', '0.8');
    addUrl(`${baseUrl}/mobile-wallpapers`, lastModDate, 'daily', '0.8');
    addUrl(`${baseUrl}/new`, lastModDate, 'daily', '0.8');
    addUrl(`${baseUrl}/trending`, lastModDate, 'daily', '0.8');
    addUrl(`${baseUrl}/popular`, lastModDate, 'daily', '0.8');
    addUrl(`${baseUrl}/terms`, lastModDate, 'yearly', '0.3');
    addUrl(`${baseUrl}/privacy`, lastModDate, 'yearly', '0.3');

    // 1. Anime Series Pages
    distinctSeries.forEach(series => {
      if (series) {
        const seriesProducts = products.filter(p => p.series === series);
        const lastMod = seriesProducts.length > 0
          ? formatDate(new Date(Math.max(...seriesProducts.map(p => p.updatedAt))))
          : lastModDate;

        const slug = slugifyHelper(series);
        if (slug) {
          addUrl(`${baseUrl}/anime/${slug}`, lastMod, 'daily', '0.9');
        }
      }
    });

    // 2. Character Pages
    characters.forEach(char => {
      const firstWord = char.name.split(' ')[0].toLowerCase();
      const charProducts = products.filter(p => p.name.toLowerCase().includes(firstWord));
      const lastMod = charProducts.length > 0
        ? formatDate(new Date(Math.max(...charProducts.map(p => p.updatedAt))))
        : lastModDate;

      if (char.slug) {
        addUrl(`${baseUrl}/character/${char.slug}`, lastMod, 'daily', '0.9');
      }
    });

    // 3. Wallpaper / Product pages (canonical route: /products/:id) with image sitemap
    products.forEach(product => {
      const slug = product.slug || product._id.toString();
      if (slug) {
        const previewUrl = product.assets?.preview?.url || '';
        let imageBlock = '';
        if (previewUrl) {
          const imageTitle = escapeXml(product.name || 'Anime Wallpaper');
          const imageCaption = escapeXml(
            `${product.name || 'Anime Wallpaper'}${product.series ? ` from ${product.series}` : ''} - Premium 4K wallpaper on AniCart`
          );
          imageBlock = `
    <image:image>
      <image:loc>${escapeXml(previewUrl)}</image:loc>
      <image:title>${imageTitle}</image:title>
      <image:caption>${imageCaption}</image:caption>
    </image:image>`;
        }
        addUrl(`${baseUrl}/products/${slug}`, formatDate(product.updatedAt), 'weekly', '0.8', imageBlock);
      }
    });

    xml += `\n</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.end(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    const baseUrl = (config.CLIENT_URL || 'https://anicartwallpaper.vercel.app').replace(/\/$/, '');
    const lastModDate = formatDate(new Date());
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(baseUrl)}/</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.end(fallbackXml);
  }
});

// ── Static sitemap files (fallback for when DB is unavailable) ──
router.get('/sitemap-static.xml', (req, res) => {
  const p = path.join(__dirname, '../../client/public/sitemap-static.xml');
  if (fs.existsSync(p)) return res.type('application/xml').sendFile(p);
  res.status(404).send('Static sitemap not found');
});

// ── robots.txt ──
router.get('/robots.txt', (req, res) => {
  const baseUrl = (config.CLIENT_URL || 'https://anicartwallpaper.vercel.app').replace(/\/$/, '');
  const robotsTxt = [
    '# AniCart - Production Robots.txt',
    `# ${baseUrl}/robots.txt`,
    '',
    'User-agent: *',
    'Allow: /',
    '',
    '# Block private/user pages',
    'Disallow: /admin',
    'Disallow: /dashboard',
    'Disallow: /profile',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /library',
    'Disallow: /settings',
    'Disallow: /creator',
    '',
    '# Block auth pages',
    'Disallow: /login',
    'Disallow: /signup',
    'Disallow: /auth/',
    '',
    '# Block API endpoints',
    'Disallow: /api/',
    '',
    '# Block internal/utility routes',
    'Disallow: /verify',
    'Disallow: /reset-password',
    'Disallow: /forgot-password',
    '',
    '# Sitemap',
    `Sitemap: ${baseUrl}/sitemap.xml`,
  ].join('\n');

  res.type('text/plain').send(robotsTxt);
});

module.exports = router;