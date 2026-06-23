/**
 * Product service — catalog CRUD and series listing.
 */

const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const CONSTANTS = require('../utils/constants');

const PUBLIC_PRODUCT_SELECT =
  '-fileHash -rightsConfirmed -termsAcceptedAt -licenseType -authorName -sourceLink -copyrightOwner -assets.original -assets.4k -assets.2k -assets.1080p';

/**
 * @param {{ series?: string, page?: string|number, limit?: string|number, search?: string }} query
 */
async function getProducts(query) {
  const { series, page = 1, limit = CONSTANTS.DEFAULTS.PAGE_LIMIT, search } = query;

  const filter = { status: 'active' };

  if (series) {
    filter.series = series;
  }

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(
    CONSTANTS.LIMITS.MAX_PAGE_SIZE,
    Math.max(1, parseInt(limit, 10))
  );
  const skip = (pageNum - 1) * limitNum;

  const [products, total, distinctSeries] = await Promise.all([
    Product.find(filter)
      .select(PUBLIC_PRODUCT_SELECT)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(filter),
    Product.getDistinctSeries(),
  ]);

  return {
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
  } = body;

  return Product.create({
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
  });
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
  return product;
}

async function deleteProduct(id) {
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  await product.softDelete();
}

async function restoreProduct(id) {
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  await product.restore();
  return product;
}

async function getSeries() {
  return Product.getDistinctSeries();
}

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  getSeries,
};
