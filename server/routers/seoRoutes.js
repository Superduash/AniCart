const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const config = require('../config');

// Helper to format date for sitemap
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

/**
 * @desc    Generate dynamic sitemap.xml
 * @route   GET /sitemap.xml
 * @access  Public
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = config.CLIENT_URL || 'https://anicartweb.netlify.app';

    // Fetch active products
    const products = await Product.find({ status: 'active' }).select('slug _id updatedAt');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/marketplace</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- Dynamic Products -->
`;

    products.forEach((product) => {
      const loc = product.slug ? `${baseUrl}/wallpaper/${product.slug}` : `${baseUrl}/products/${product._id}`;
      xml += `  <url>
    <loc>${loc}</loc>
    <lastmod>${formatDate(product.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).end();
  }
});

module.exports = router;
