const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const config = require('../config');
const slugify = require('slugify');
const productService = require('../services/productService');

const slugifyHelper = (str) => slugify(str, { lower: true, strict: true, trim: true });
const formatDate = (date) => new Date(date).toISOString().split('T')[0];

/**
 * @desc    Get sitemap index file
 * @route   GET /sitemap.xml
 * @access  Public
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = (config.CLIENT_URL || 'https://anicartwallpaper.vercel.app').replace(/\/$/, '');
    const lastModDate = formatDate(new Date());

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-static.xml</loc>
    <lastmod>${lastModDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-dynamic.xml</loc>
    <lastmod>${lastModDate}</lastmod>
  </sitemap>
</sitemapindex>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    res.status(500).end();
  }
});

/**
 * @desc    Get static pages sitemap
 * @route   GET /sitemap-static.xml
 * @access  Public
 */
router.get('/sitemap-static.xml', async (req, res) => {
  try {
    const baseUrl = (config.CLIENT_URL || 'https://anicartwallpaper.vercel.app').replace(/\/$/, '');
    const lastModDate = formatDate(new Date());

    // Fetch distinct tags (categories) from active products
    const tags = await Product.distinct('tags', { status: 'active' });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core Public Hubs -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/marketplace</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/anime</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/characters</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/collections</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/4k-wallpapers</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/mobile-wallpapers</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/new</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/trending</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/popular</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;

    // Category Tags
    tags.forEach(tag => {
      if (tag) {
        const slug = slugifyHelper(tag);
        xml += `  <url>
    <loc>${baseUrl}/category/${slug}</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;
      }
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (error) {
    console.error('Error generating static sitemap:', error);
    res.status(500).end();
  }
});

/**
 * @desc    Get dynamic pages sitemap
 * @route   GET /sitemap-dynamic.xml
 * @access  Public
 */
router.get('/sitemap-dynamic.xml', async (req, res) => {
  try {
    const baseUrl = (config.CLIENT_URL || 'https://anicartwallpaper.vercel.app').replace(/\/$/, '');

    // Fetch active products
    const products = await Product.find({ status: 'active' }).select('slug _id updatedAt series creatorId authorName name');

    // Distinct series and creators
    const distinctSeries = await Product.getDistinctSeries();
    const activeCreatorIds = await Product.distinct('creatorId', { status: 'active' });
    const creators = await User.find({ _id: { $in: activeCreatorIds.filter(Boolean) } }).select('name updatedAt');

    // Predefined popular characters that have active wallpapers
    const characters = await productService.getCharacters();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // 1. Anime Series Pages
    distinctSeries.forEach(series => {
      if (series) {
        const seriesProducts = products.filter(p => p.series === series);
        const lastMod = seriesProducts.length > 0 
          ? formatDate(new Date(Math.max(...seriesProducts.map(p => p.updatedAt))))
          : formatDate(new Date());

        const slug = slugifyHelper(series);
        xml += `  <url>
    <loc>${baseUrl}/anime/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;
      }
    });

    // 2. Character Pages
    characters.forEach(char => {
      const firstWord = char.name.split(' ')[0].toLowerCase();
      const charProducts = products.filter(p => p.name.toLowerCase().includes(firstWord));
      const lastMod = charProducts.length > 0
        ? formatDate(new Date(Math.max(...charProducts.map(p => p.updatedAt))))
        : formatDate(new Date());

      xml += `  <url>
    <loc>${baseUrl}/character/${char.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;
    });

    // 3. Creator Profiles
    creators.forEach(creator => {
      const creatorProducts = products.filter(p => p.creatorId && p.creatorId.toString() === creator._id.toString());
      const lastMod = creatorProducts.length > 0
        ? formatDate(new Date(Math.max(...creatorProducts.map(p => p.updatedAt))))
        : formatDate(creator.updatedAt || new Date());

      const slug = slugifyHelper(creator.name);
      xml += `  <url>
    <loc>${baseUrl}/creator/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    });

    // 4. Wallpaper pages
    products.forEach(product => {
      const slug = product.slug || product._id;
      xml += `  <url>
    <loc>${baseUrl}/wallpaper/${slug}</loc>
    <lastmod>${formatDate(product.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    res.status(500).end();
  }
});

module.exports = router;
