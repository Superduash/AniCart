/**
 * Product Controller
 *
 * HTTP handlers for products. Business logic lives in productService.
 */

const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const productService = require('../services/productService');
const emailService = require('../services/emailService');
const User = require('../models/User');
const logger = require('../utils/logger');

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
 * @desc    Delete or archive product (Admin or Creator)
 * @route   DELETE /api/v1/products/:id
 * @access  Private
 */
const deleteProduct = catchAsync(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id, req.user);

  res.status(200).json(
    successResponse({
      message: result.action === 'archived' ? 'Product archived successfully (has existing purchases)' : 'Product permanently deleted',
      data: result,
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

/**
 * @desc    Get presigned download URL for a purchased product
 * @route   GET /api/v1/products/:id/download
 * @access  Private
 */
const downloadProduct = catchAsync(async (req, res) => {
  const { resolution } = req.query;
  const result = await productService.downloadProduct(req.user.id, req.params.id, resolution);

  res.status(200).json(
    successResponse({
      message: 'Download URL generated successfully',
      data: result,
    })
  );
});

const getPendingProducts = catchAsync(async (req, res) => {
  const { products, page, limit, total } = await productService.getProducts({ ...req.query, status: 'pending' });

  res.status(200).json(
    paginatedResponse({
      message: 'Pending products retrieved successfully',
      data: products,
      page,
      limit,
      total,
    })
  );
});

const approveProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, { status: 'active' });

  if (product.creatorId) {
    const creator = await User.findById(product.creatorId);
    if (creator) {
      emailService.sendProductApprovalEmail(creator, product).catch(err => 
        logger.error('Failed to send product approval email', err)
      );
    }
  }

  res.status(200).json(
    successResponse({
      message: 'Product approved successfully',
      data: { product },
    })
  );
});

const rejectProduct = catchAsync(async (req, res) => {
  const { rejectionReason } = req.body;
  const product = await productService.updateProduct(req.params.id, { status: 'rejected', rejectionReason });

  if (product.creatorId) {
    const creator = await User.findById(product.creatorId);
    if (creator) {
      emailService.sendProductRejectionEmail(creator, product, rejectionReason).catch(err => 
        logger.error('Failed to send product rejection email', err)
      );
    }
  }

  res.status(200).json(
    successResponse({
      message: 'Product rejected successfully',
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
  downloadProduct,
  getPendingProducts,
  approveProduct,
  rejectProduct,
};
