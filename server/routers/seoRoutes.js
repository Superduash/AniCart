const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const config = require('../config');
const slugify = require('slugify');
const productService = require('../services/productService');

const slugifyHelper = (str) => slugify(str, { lower: true, strict: true, trim: true });
const formatDate = (date) => new Date(date).toISOString().split('T')[0];

// Safe XML characters escape utility
const escapeXml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
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
    const products = await Product.find({ status: 'active' }).select('slug _id updatedAt series creatorId authorName name');

    // Distinct series, tags, and creators
    const distinctSeries = await Product.getDistinctSeries();
    const tags = await Product.distinct('tags', { status: 'active' });
    const activeCreatorIds = await Product.distinct('creatorId', { status: 'active' });
    const creators = await User.find({ _id: { $in: activeCreatorIds.filter(Boolean) } }).select('name updatedAt');

    // Predefined popular characters that have active wallpapers
    const characters = await productService.getCharacters();

    const addedUrls = new Set();
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    const addUrl = (loc, lastmod, changefreq, priority) => {
      const escapedLoc = escapeXml(loc);
      if (addedUrls.has(escapedLoc)) return;
      addedUrls.add(escapedLoc);
      xml += `\n  <url>
    <loc>${escapedLoc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    };

    // Core Public Hubs
    addUrl(`${baseUrl}/`, lastModDate, 'daily', '1.0');
    addUrl(`${baseUrl}/marketplace`, lastModDate, 'daily', '0.9');
    addUrl(`${baseUrl}/anime`, lastModDate, 'daily', '0.9');
    addUrl(`${baseUrl}/characters`, lastModDate, 'daily', '0.9');
    addUrl(`${baseUrl}/collections`, lastModDate, 'daily', '0.8');
    addUrl(`${baseUrl}/categories`, lastModDate, 'daily', '0.8');
    addUrl(`${baseUrl}/4k-wallpapers`, lastModDate, 'daily', '0.8');
    addUrl(`${baseUrl}/mobile-wallpapers`, lastModDate, 'daily', '0.8');
    addUrl(`${baseUrl}/new`, lastModDate, 'daily', '0.8');
    addUrl(`${baseUrl}/trending`, lastModDate, 'daily', '0.8');
    addUrl(`${baseUrl}/popular`, lastModDate, 'daily', '0.8');

    // 1. Category Tags
    tags.forEach(tag => {
      if (tag) {
        const slug = slugifyHelper(tag);
        if (slug) {
          addUrl(`${baseUrl}/category/${slug}`, lastModDate, 'daily', '0.8');
        }
      }
    });

    // 2. Anime Series Pages
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

    // 3. Character Pages
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

    // 4. Creator Profiles
    const BLACKLISTED_SLUGS = ['admin', 'dashboard', 'api', 'login', 'signup', 'profile', 'checkout', 'library', 'apply'];
    creators.forEach(creator => {
      const creatorProducts = products.filter(p => p.creatorId && p.creatorId.toString() === creator._id.toString());
      const lastMod = creatorProducts.length > 0
        ? formatDate(new Date(Math.max(...creatorProducts.map(p => p.updatedAt))))
        : formatDate(creator.updatedAt || new Date());

      const slug = slugifyHelper(creator.name);
      if (slug && !BLACKLISTED_SLUGS.includes(slug)) {
        addUrl(`${baseUrl}/creator/${slug}`, lastMod, 'daily', '0.7');
      }
    });

    // 5. Wallpaper pages
    products.forEach(product => {
      const slug = product.slug || product._id;
      if (slug) {
        addUrl(`${baseUrl}/wallpaper/${slug}`, formatDate(product.updatedAt), 'weekly', '0.8');
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

module.exports = router;
