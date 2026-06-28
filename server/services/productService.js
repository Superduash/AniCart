/**
 * Product service — catalog CRUD and series listing.
 */

const Product = require('../models/Product');
const License = require('../models/License');
const Cart = require('../models/Cart');
const User = require('../models/User');
const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const CONSTANTS = require('../utils/constants');
const config = require('../config');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { upstashRedis: redis } = require('../config/redis');
const resolutionService = require('../services/resolutionService');

let s3Client;
if (config.R2_ACCOUNT_ID && config.R2_ACCESS_KEY_ID) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.R2_ACCESS_KEY_ID,
      secretAccessKey: config.R2_SECRET_ACCESS_KEY,
    },
  });
}

// Optional MeiliSearch client
const { MeiliSearch } = require('meilisearch');
let meiliClient;
if (process.env.MEILISEARCH_HOST && process.env.MEILISEARCH_KEY) {
  meiliClient = new MeiliSearch({
    host: process.env.MEILISEARCH_HOST,
    apiKey: process.env.MEILISEARCH_KEY,
  });
}

const PUBLIC_PRODUCT_SELECT =
  '-fileHash -rightsConfirmed -termsAcceptedAt -licenseType -authorName -sourceLink -copyrightOwner -assets.original -assets.4k -assets.2k -assets.1080p';

/**
 * @param {{ series?: string, page?: string|number, limit?: string|number, search?: string }} query
 */
async function getProducts(query) {
  const cacheKey = 'products:cache:v1';
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      // ignore redis errors and fallback to DB
    }
  }

  const { series, resolution, minPrice, maxPrice, page = 1, limit = CONSTANTS.DEFAULTS.PAGE_LIMIT, search, status = 'active', tags, character } = query;

  const filter = { status };

  if (series) {
    const seriesList = series.split(',').map(s => s.trim());
    const distinctSeries = await Product.getDistinctSeries();
    const matchedSeries = distinctSeries.filter(ds => {
      const dsSlug = ds.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return seriesList.some(s => s === dsSlug || s.toLowerCase() === ds.toLowerCase());
    });
    filter.series = { $in: matchedSeries.length > 0 ? matchedSeries : seriesList };
  }

  if (resolution) {
    const resList = resolution.split(',').map(r => r.trim());
    filter.$or = [
      { resolution: { $in: resList.map(r => new RegExp(r.replace(/[-_]/g, ''), 'i')) } },
      { availableResolutions: { $in: resList.map(r => r.toLowerCase()) } }
    ];
  }

  if (tags) {
    const tagsList = tags.split(',').map(t => t.trim());
    const distinctTags = await Product.distinct('tags', { status: 'active' });
    const matchedTags = distinctTags.filter(dt => {
      const dtSlug = dt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return tagsList.some(t => t === dtSlug || t.toLowerCase() === dt.toLowerCase());
    });
    filter.tags = { $in: matchedTags.length > 0 ? matchedTags : tagsList };
  }

  if (character) {
    const charObj = POPULAR_CHARACTERS.find(c => c.slug === character || c.name.toLowerCase() === character.toLowerCase());
    const searchName = charObj ? charObj.name : character;
    const firstWord = searchName.split(' ')[0];
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.name = { $regex: new RegExp(escapeRegex(firstWord), 'i') };
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (search) {
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.name = { $regex: escapeRegex(search), $options: 'i' };
  }

  if (query.isHero !== undefined) {
    filter.isHero = query.isHero === 'true';
  }

  if (query.isFeatured !== undefined) {
    filter.isFeatured = query.isFeatured === 'true';
  }

  if (query.creatorId) {
    filter.creatorId = query.creatorId;
  }

  if (query.creator) {
    const nameRegex = new RegExp(`^${query.creator.replace(/-/g, '[-\\s]')}$`, 'i');
    const creatorUser = await User.findOne({ name: nameRegex });
    if (creatorUser) {
      filter.creatorId = creatorUser._id;
    } else {
      // Force empty results if creator doesn't exist
      filter.creatorId = new mongoose.Types.ObjectId();
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(
    CONSTANTS.LIMITS.MAX_PAGE_SIZE,
    Math.max(1, parseInt(limit, 10))
  );
  const skip = (pageNum - 1) * limitNum;

  let products = [];
  let total = 0;

  // MeiliSearch Full-Text Search
  if (search && meiliClient) {
    try {
      const index = meiliClient.index('products');
      const meiliFilter = [`status = ${status}`];
      if (series) meiliFilter.push(`series = "${series}"`);
      if (query.creatorId) meiliFilter.push(`creatorId = "${query.creatorId}"`);

      const searchRes = await index.search(search, {
        filter: meiliFilter,
        offset: skip,
        limit: limitNum,
      });

      // Extract ids to fetch full objects from MongoDB (Meili is just an index)
      const hitIds = searchRes.hits.map(hit => hit.id);
      
      const [fetchedProducts, distinctSeries] = await Promise.all([
        Product.find({ _id: { $in: hitIds } }).select(PUBLIC_PRODUCT_SELECT),
        Product.getDistinctSeries(),
      ]);

      // Preserve Meili sort order
      products = hitIds.map(id => fetchedProducts.find(p => p._id.toString() === id.toString())).filter(Boolean);
      total = searchRes.estimatedTotalHits || searchRes.hits.length;
      
      const result = {
        products,
        page: pageNum,
        limit: limitNum,
        total,
        meta: {
          filters: {
            series: distinctSeries,
          },
        },
      };

      if (redis) {
        try {
          await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
        } catch (err) {}
      }

      return result;
    } catch (err) {
      // Fallback to MongoDB regex
      logger.error('MeiliSearch failed, falling back to Mongo Regex', err);
    }
  }

  let sortOption = { createdAt: -1 };
  if (query.sort === 'heroOrder') {
    sortOption = { heroOrder: 1, createdAt: -1 };
  } else if (query.sort === 'featuredOrder') {
    sortOption = { featuredOrder: 1, createdAt: -1 };
  } else if (query.sort === 'rating' || query.sort === 'top_rated') {
    sortOption = { rating: -1, reviews: -1 };
  } else if (query.sort === 'price_asc') {
    sortOption = { price: 1, createdAt: -1 };
  } else if (query.sort === 'price_desc') {
    sortOption = { price: -1, createdAt: -1 };
  }

  // Fallback / Standard MongoDB Query
  const [mongoProducts, mongoTotal, distinctSeries] = await Promise.all([
    Product.find(filter)
      .select(PUBLIC_PRODUCT_SELECT)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(filter),
    Product.getDistinctSeries(),
  ]);

  products = mongoProducts;
  total = mongoTotal;

  const result = {
    products,
    page: pageNum,
    limit: limitNum,
    total,
    meta: {
      filters: {
        series: distinctSeries,
      },
    },
  };

  if (redis) {
    try {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
    } catch (err) {
      // ignore redis errors
    }
  }

  return result;
}

async function getProduct(idOrSlug) {
  const query = mongoose.Types.ObjectId.isValid(idOrSlug)
    ? { _id: idOrSlug }
    : { slug: idOrSlug };

  const product = await Product.findOne({ ...query, status: 'active' }).select(
    PUBLIC_PRODUCT_SELECT
  );
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  return product;
}

async function createProduct(body) {
  const {
    name,
    series,
    price,
    img,
    badge,
    badgeType,
    rating,
    reviews,
    resolution,
    tags,
    assets,
  } = body;

  const product = await Product.create({
    name: name.trim(),
    series: series.trim(),
    price,
    img: img.trim(),
    badge: badge || '',
    badgeType: badgeType || '',
    rating: rating || 0,
    reviews: reviews || 0,
    resolution: resolution || '4K Ultra HD',
    tags: tags || [],
    rightsConfirmed: body.rightsConfirmed ?? false,
    termsAcceptedAt: body.termsAcceptedAt ?? new Date(),
    licenseType: body.licenseType ?? 'original',
    assets,
  });

  if (meiliClient) {
    try {
      const index = meiliClient.index('products');
      await index.addDocuments([{
        id: product._id.toString(),
        name: product.name,
        series: product.series,
        creatorId: product.creatorId ? product.creatorId.toString() : undefined,
        status: product.status,
      }]);
    } catch (err) {}
  }

  // Clear products cache
  if (redis) {
    try {
      await redis.del('products:cache:v1');
    } catch (err) {}
  }

  return product;
}

async function updateProduct(id, body) {
  const {
    name,
    series,
    price,
    img,
    badge,
    badgeType,
    rating,
    reviews,
    resolution,
    tags,
    status,
    isHero,
    heroOrder,
    isFeatured,
    featuredOrder,
  } = body;

  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  if (name !== undefined) product.name = name.trim();
  if (series !== undefined) product.series = series.trim();
  if (price !== undefined) product.price = price;
  if (img !== undefined) product.img = img.trim();
  if (badge !== undefined) product.badge = badge;
  if (badgeType !== undefined) product.badgeType = badgeType;
  if (rating !== undefined) product.rating = rating;
  if (reviews !== undefined) product.reviews = reviews;
  if (resolution !== undefined) product.resolution = resolution;
  if (body.displayResolution !== undefined) product.displayResolution = body.displayResolution;
  if (body.defaultDownload !== undefined) product.defaultDownload = body.defaultDownload;
  if (body.availableResolutions !== undefined) product.availableResolutions = body.availableResolutions;
  if (tags !== undefined) product.tags = tags;
  
  // Recompute resolution metadata if assets have changed
  if (body.assets) {
    const resolutionMetadata = resolutionService.computeResolutionMetadata(product);
    product.displayResolution = resolutionMetadata.displayResolutionLabel;
    product.defaultDownload = resolutionMetadata.defaultDownload;
    product.availableResolutions = resolutionMetadata.availableVariants;
  }
  if (status !== undefined) product.status = status;
  if (isHero !== undefined) product.isHero = isHero;
  if (heroOrder !== undefined) product.heroOrder = heroOrder;
  if (isFeatured !== undefined) product.isFeatured = isFeatured;
  if (featuredOrder !== undefined) product.featuredOrder = featuredOrder;

  await product.save();

  if (meiliClient) {
    try {
      const index = meiliClient.index('products');
      await index.updateDocuments([{
        id: product._id.toString(),
        name: product.name,
        series: product.series,
        status: product.status,
      }]);
    } catch (err) {}
  }

  // Clear products cache
  if (redis) {
    try {
      await redis.del('products:cache:v1');
    } catch (err) {}
  }

  return product;
}

async function deleteProduct(id, user) {
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  if (user.role === 'creator') {
    if (!product.creatorId || product.creatorId.toString() !== user.id.toString()) {
      throw ApiError.forbidden('You can only delete your own products');
    }
  } else if (user.role !== 'admin') {
    throw ApiError.forbidden('Not authorized to delete this product');
  }

  const purchaseCount = await License.countDocuments({ product: id });

  if (user.role === 'admin' || (user.role === 'creator' && purchaseCount === 0)) {
    await Cart.updateMany(
      { 'items.product': id },
      { $pull: { items: { product: id } } }
    );

    await User.updateMany(
      { wishlist: id },
      { $pull: { wishlist: id } }
    );

    if (s3Client && product.assets) {
      const assetKeys = [];
      ['preview', 'thumbnail', 'original', '4k', '2k', '1080p', '720p', 'mobile-portrait', 'mobile-landscape'].forEach(res => {
        if (product.assets[res] && product.assets[res].key) {
          assetKeys.push(product.assets[res].key);
        }
      });

      for (const key of assetKeys) {
        try {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: config.R2_BUCKET_NAME,
            Key: key,
          }));
        } catch (err) {
          console.error(`Failed to delete asset ${key} from R2:`, err);
        }
      }
    }

    await Product.findByIdAndDelete(id);

    if (meiliClient) {
      try {
        const index = meiliClient.index('products');
        await index.deleteDocument(id.toString());
      } catch (err) {}
    }

    if (redis) {
      try {
        await redis.del('products:cache:v1');
      } catch (err) {}
    }

    return { action: 'deleted' };
  } else {
    product.status = 'archived';
    await product.save();

    if (meiliClient) {
      try {
        const index = meiliClient.index('products');
        await index.updateDocuments([{
          id: product._id.toString(),
          status: 'archived',
        }]);
      } catch (err) {}
    }

    if (redis) {
      try {
        await redis.del('products:cache:v1');
      } catch (err) {}
    }

    return { action: 'archived' };
  }
}

async function restoreProduct(id) {
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  await product.restore();

  if (meiliClient) {
    try {
      const index = meiliClient.index('products');
      await index.updateDocuments([{
        id: product._id.toString(),
        status: 'active',
      }]);
    } catch (err) {}
  }

  // Clear products cache
  if (redis) {
    try {
      await redis.del('products:cache:v1');
    } catch (err) {}
  }

  return product;
}

async function getSeries() {
  return Product.getDistinctSeries();
}

// C9 Fix: default was 'original' which doesn't exist — processor creates 4k/2k/1080p/preview/thumbnail
async function downloadProduct(userId, productId, resolution = '4k') {
  if (!s3Client) {
    throw ApiError.internal('Storage client is not configured');
  }

  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');

  let license = await License.findOne({ user: userId, product: productId, isActive: true });
  if (!license) {
    if (product.price === 0) {
      license = await License.create({ user: userId, product: productId, isActive: true, maxDownloads: 999999 });
    } else {
      throw ApiError.forbidden('You do not own a license for this product');
    }
  }

  let assetKey = product.assets && product.assets[resolution] && product.assets[resolution].key;
  
  if (!assetKey) {
    // Fallback order based on requested resolution type
    const mobileFallbacks = ['mobile-portrait', 'mobile-landscape', '720p', '1080p', '2k', '4k', 'original'];
    const desktopFallbacks = ['4k', '2k', '1080p', '720p', 'original'];
    const fallbacks = (resolution && resolution.startsWith('mobile')) ? mobileFallbacks : desktopFallbacks;
    
    for (const res of fallbacks) {
      if (product.assets && product.assets[res] && product.assets[res].key) {
        assetKey = product.assets[res].key;
        break;
      }
    }
  }

  if (!assetKey) {
    throw ApiError.badRequest(`No downloadable assets found for this product`);
  }

  if (license.downloadCount >= license.maxDownloads) {
    throw ApiError.forbidden('Download limit reached');
  }
  
  license.downloadCount += 1;
  await license.save();

  const command = new GetObjectCommand({
    Bucket: config.R2_BUCKET_NAME,
    Key: assetKey,
  });

  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
  
  return { downloadUrl, expiresIn: 900 };
}

const POPULAR_CHARACTERS = [
  { name: 'Gojo Satoru', slug: 'gojo-satoru' },
  { name: 'Ryomen Sukuna', slug: 'ryomen-sukuna' },
  { name: 'Megumi Fushiguro', slug: 'megumi-fushiguro' },
  { name: 'Itadori Yuji', slug: 'itadori-yuji' },
  { name: 'Mikasa Ackerman', slug: 'mikasa-ackerman' },
  { name: 'Eren Yeager', slug: 'eren-yeager' },
  { name: 'Levi Ackerman', slug: 'levi-ackerman' },
  { name: 'Naruto Uzumaki', slug: 'naruto-uzumaki' },
  { name: 'Kakashi Hatake', slug: 'kakashi-hatake' },
  { name: 'Sasuke Uchiha', slug: 'sasuke-uchiha' },
  { name: 'Monkey D. Luffy', slug: 'monkey-d-luffy' },
  { name: 'Roronoa Zoro', slug: 'roronoa-zoro' },
  { name: 'Kaneki Ken', slug: 'kaneki-ken' },
  { name: 'Tanjiro Kamado', slug: 'tanjiro-kamado' },
  { name: 'Zenitsu Agatsuma', slug: 'zenitsu-agatsuma' },
  { name: 'Kyojuro Rengoku', slug: 'kyojuro-rengoku' },
  { name: 'Killua Zoldyck', slug: 'killua-zoldyck' },
  { name: 'Edward Elric', slug: 'edward-elric' },
  { name: 'Vegeta', slug: 'vegeta' },
  { name: 'Son Goku', slug: 'son-goku' },
  { name: 'David Martinez', slug: 'david-martinez' },
  { name: 'Kurosaki Ichigo', slug: 'kurosaki-ichigo' },
  { name: 'Makima', slug: 'makima' },
  { name: 'Denji', slug: 'denji' },
  { name: 'Lelouch Lamperouge', slug: 'lelouch-lamperouge' }
];

async function getDistinctTags() {
  return Product.distinct('tags', { status: 'active' });
}

async function getCharacters() {
  const activeProducts = await Product.find({ status: 'active' }).select('name');
  const available = POPULAR_CHARACTERS.filter(char => {
    const charFirstName = char.name.split(' ')[0].toLowerCase();
    return activeProducts.some(p => p.name.toLowerCase().includes(charFirstName));
  });
  return available;
}

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  getSeries,
  downloadProduct,
  getDistinctTags,
  getCharacters,
  POPULAR_CHARACTERS,
};
