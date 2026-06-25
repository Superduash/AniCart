/**
 * Dynamic Sitemap Generator for AniCart
 *
 * Connects to MongoDB, queries active products, and generates:
 *   - sitemap-dynamic.xml  (product/wallpaper URLs with image sitemap)
 *   - sitemap-series.xml   (anime series hub URLs)
 *   - sitemap-characters.xml (character hub URLs)
 *
 * Run:  node server/scripts/generate-sitemaps.js
 * Requires MONGODB_URI in environment or .env
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const mongoose = require('mongoose');

const SITE_URL = process.env.SITE_URL || process.env.CLIENT_URL || 'https://anicartwallpaper.vercel.app';
const OUTPUT_DIR = path.resolve(__dirname, '../../client/public');

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function escapeXml(str) {
  if (!str) return '';
  const AMP = '&' + 'amp;';
  const LT = '&' + 'lt;';
  const GT = '&' + 'gt;';
  const QUOT = '&' + 'quot;';
  const APOS = '&' + 'apos;';
  return str
    .replace(/&/g, AMP)
    .replace(/</g, LT)
    .replace(/>/g, GT)
    .replace(/"/g, QUOT)
    .replace(/'/g, APOS);
}

function formatDate(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

async function generateSitemaps() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI not set. Cannot generate dynamic sitemaps.');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const productsCollection = db.collection('products');

  // ── 1. Dynamic products sitemap (with image sitemap) ──
  const products = await productsCollection
    .find({ status: 'active' }, {
      projection: {
        _id: 1,
        name: 1,
        series: 1,
        character: 1,
        updatedAt: 1,
        'assets.preview.url': 1,
      }
    })
    .sort({ updatedAt: -1 })
    .toArray();

  console.log(`Found ${products.length} active products`);

  const productUrls = products.map((p) => {
    const id = p._id.toString();
    const loc = `${SITE_URL}/products/${id}`;
    const lastmod = formatDate(p.updatedAt);
    const imageUrl = p.assets?.preview?.url || '';
    const imageTitle = escapeXml(p.name || 'Anime Wallpaper');
    const imageCaption = escapeXml(
      `${p.name || 'Anime Wallpaper'}${p.series ? ` from ${p.series}` : ''} - Premium 4K wallpaper on AniCart`
    );

    let imageBlock = '';
    if (imageUrl) {
      imageBlock = `
      <image:image>
        <image:loc>${escapeXml(imageUrl)}</image:loc>
        <image:title>${imageTitle}</image:title>
        <image:caption>${imageCaption}</image:caption>
      </image:image>`;
    }

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imageBlock}
  </url>`;
  });

  const dynamicXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${productUrls.join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap-dynamic.xml'), dynamicXml, 'utf8');
  console.log(`Written sitemap-dynamic.xml (${products.length} URLs)`);

  // ── 2. Series hub sitemap ──
  const distinctSeries = await productsCollection.distinct('series', { status: 'active' });
  const seriesUrls = distinctSeries
    .filter(Boolean)
    .map((series) => {
      const slug = slugify(series);
      if (!slug) return null;
      return `  <url>
    <loc>${SITE_URL}/anime/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .filter(Boolean);

  const seriesXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/anime</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${seriesUrls.join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap-series.xml'), seriesXml, 'utf8');
  console.log(`Written sitemap-series.xml (${seriesUrls.length} series URLs)`);

  // ── 3. Characters hub sitemap ──
  const distinctCharacters = await productsCollection.distinct('character', { status: 'active' });
  const characterUrls = distinctCharacters
    .filter(Boolean)
    .map((char) => {
      const slug = slugify(char);
      if (!slug) return null;
      return `  <url>
    <loc>${SITE_URL}/character/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .filter(Boolean);

  const charactersXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/characters</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${characterUrls.join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap-characters.xml'), charactersXml, 'utf8');
  console.log(`Written sitemap-characters.xml (${characterUrls.length} character URLs)`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
  console.log('Sitemap generation complete.');
}

generateSitemaps().catch((err) => {
  console.error('Sitemap generation failed:', err);
  process.exit(1);
});