/**
 * Product Controller
 *
 * HTTP handlers for products. Business logic lives in productService.
 */

const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const productService = require('../services/productService');

/**
 * @desc    Get all products with optional filtering and pagination
 * @route   GET /api/v1/products
 * @access  Public
 */
const getProducts = catchAsync(async (req, res) => {
  const { products, page, limit, total, meta } = await productService.getProducts(
    req.query
  );

  res.status(200).json(
    paginatedResponse({
      message: 'Products retrieved successfully',
      data: products,
      page,
      limit,
      total,
      meta,
    })
  );
});

/**
 * @desc    Get single product by ID
 * @route   GET /api/v1/products/:id
 * @access  Public
 */
const getProduct = catchAsync(async (req, res) => {
  const product = await productService.getProduct(req.params.id);

  res.status(200).json(
    successResponse({
      message: 'Product retrieved successfully',
      data: { product },
    })
  );
});

/**
 * @desc    Create new product (Admin only)
 * @route   POST /api/v1/products
 * @access  Private/Admin
 */
const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body);

  res.status(201).json(
    successResponse({
      message: 'Product created successfully',
      data: { product },
    })
  );
});

/**
 * @desc    Update product (Admin only)
 * @route   PUT /api/v1/products/:id
 * @access  Private/Admin
 */
const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);

  res.status(200).json(
    successResponse({
      message: 'Product updated successfully',
      data: { product },
    })
  );
});

/**
 * @desc    Soft delete product (Admin only)
 * @route   DELETE /api/v1/products/:id
 * @access  Private/Admin
 */
const deleteProduct = catchAsync(async (req, res) => {
  await productService.deleteProduct(req.params.id);

  res.status(200).json(
    successResponse({
      message: 'Product deleted successfully',
    })
  );
});

/**
 * @desc    Get all product series (for filters)
 * @route   GET /api/v1/products/series/list
 * @access  Public
 */
const getSeries = catchAsync(async (req, res) => {
  const series = await productService.getSeries();

  res.status(200).json(
    successResponse({
      message: 'Series retrieved successfully',
      data: { series },
    })
  );
});

/**
 * @desc    Restore soft-deleted product (Admin only)
 * @route   PUT /api/v1/products/:id/restore
 * @access  Private/Admin
 */
const restoreProduct = catchAsync(async (req, res) => {
  const product = await productService.restoreProduct(req.params.id);

  res.status(200).json(
    successResponse({
      message: 'Product restored successfully',
      data: { product },
    })
  );
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getSeries,
  restoreProduct,
};
