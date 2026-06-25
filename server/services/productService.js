/**
 * Product service — catalog CRUD and series listing.
 */

const Product = require('../models/Product');
const License = require('../models/License');
const Cart = require('../models/Cart');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const CONSTANTS = require('../utils/constants');
const config = require('../config');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const redis = require('../config/redis');

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
  const cacheKey = `products:${JSON.stringify(query)}`;
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      // ignore redis errors and fallback to DB
    }
  }

  const { series, page = 1, limit = CONSTANTS.DEFAULTS.PAGE_LIMIT, search, status = 'active' } = query;

  const filter = { status };

  if (series) {
    filter.series = series;
  }

  if (search) {
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.name = { $regex: escapeRegex(search), $options: 'i' };
  }

  if (query.creatorId) {
    filter.creatorId = query.creatorId;
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
          await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
        } catch (err) {}
      }

      return result;
    } catch (err) {
      // Fallback to MongoDB regex
      logger.error('MeiliSearch failed, falling back to Mongo Regex', err);
    }
  }

  // Fallback / Standard MongoDB Query
  const [mongoProducts, mongoTotal, distinctSeries] = await Promise.all([
    Product.find(filter)
      .select(PUBLIC_PRODUCT_SELECT)
      .sort({ createdAt: -1 })
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
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
    } catch (err) {
      // ignore redis errors
    }
  }

  return result;
}

async function getProduct(id) {
  const product = await Product.findOne({ _id: id, status: 'active' }).select(
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
      const keys = await redis.keys('products:*');
      if (keys.length > 0) await redis.del(...keys);
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
  if (tags !== undefined) product.tags = tags;
  if (status !== undefined) product.status = status;

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
      const keys = await redis.keys('products:*');
      if (keys.length > 0) await redis.del(...keys);
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
      ['preview', 'thumbnail', 'original', '4k', '2k', '1080p'].forEach(res => {
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
        const keys = await redis.keys('products:*');
        if (keys.length > 0) await redis.del(...keys);
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
        const keys = await redis.keys('products:*');
        if (keys.length > 0) await redis.del(...keys);
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
      const keys = await redis.keys('products:*');
      if (keys.length > 0) await redis.del(...keys);
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
    const fallbacks = ['4k', '2k', '1080p', 'original'];
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

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  getSeries,
  downloadProduct,
};
