/**
 * Admin Product Controller
 * 
 * Handles administrative editing of wallpaper products.
 * 
 * Rules:
 * - Only admin users can access these endpoints
 * - Only MongoDB metadata is modified
 * - R2 assets are never deleted or modified
 * - All changes are audited
 * - Validation is strict
 */

const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const Product = require('../models/Product');
const User = require('../models/User');
const { successResponse } = require('../utils/apiResponse');
const resolutionService = require('../services/resolutionService');

/**
 * Get a product for admin editing
 * Returns product with all fields including sensitive ones
 * 
 * @route GET /api/v1/admin/products/:id
 * @access Private/Admin
 */
const getProductForAdminEdit = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  
  res.status(200).json(
    successResponse({
      message: 'Product retrieved successfully',
      data: product,
    })
  );
});

/**
 * Update a product with admin permissions
 * 
 * @route PATCH /api/v1/admin/products/:id
 * @access Private/Admin
 */
const updateProductForAdmin = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    description, 
    series, 
    character, 
    category, 
    tags, 
    price, 
    isPremium, 
    isFeatured, 
    isHero, 
    heroOrder, 
    featuredOrder, 
    status, 
    visibility, 
    creatorId, 
    displayResolution, 
    defaultDownload, 
    availableResolutions, 
    altText, 
    slug, 
    metaTitle, 
    metaDescription, 
    sortOrder, 
    downloadPermissions, 
    ageRating 
  } = req.body;
  
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  
  // Validate required fields
  if (!name || name.trim() === '') {
    throw ApiError.badRequest('Title is required');
  }
  
  if (!series || series.trim() === '') {
    throw ApiError.badRequest('Anime/Series is required');
  }
  
  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    throw ApiError.badRequest('Price must be a non-negative number');
  }
  
  // Validate slug uniqueness
  if (slug && slug !== product.slug) {
    const existingProduct = await Product.findOne({
      slug: slug.toLowerCase().trim(),
      _id: { $ne: id }
    });
    if (existingProduct) {
      throw ApiError.badRequest('Slug must be unique');
    }
  }
  
  // Validate creator exists if provided
  if (creatorId && creatorId !== '' && creatorId !== product.creatorId) {
    const creator = await User.findById(creatorId);
    if (!creator) {
      throw ApiError.badRequest('Creator not found');
    }
  }
  
  // Create audit log of changes
  const oldProduct = JSON.parse(JSON.stringify(product));
  const changes = {};
  
  // Track changes for audit
  if (name !== undefined && name !== product.name) {
    changes.name = { old: product.name, new: name };
    product.name = name.trim();
  }
  
  if (description !== undefined && description !== product.description) {
    changes.description = { old: product.description, new: description };
    product.description = description;
  }
  
  if (series !== undefined && series !== product.series) {
    changes.series = { old: product.series, new: series };
    product.series = series.trim();
  }
  
  if (character !== undefined && character !== product.character) {
    changes.character = { old: product.character, new: character };
    product.character = character;
  }
  
  if (category !== undefined && category !== product.category) {
    changes.category = { old: product.category, new: category };
    product.category = category;
  }
  
  if (tags !== undefined && JSON.stringify(tags) !== JSON.stringify(product.tags)) {
    changes.tags = { old: product.tags, new: tags };
    product.tags = tags || [];
  }
  
  if (price !== undefined && price !== product.price) {
    changes.price = { old: product.price, new: price };
    product.price = price;
  }
  
  if (isPremium !== undefined && isPremium !== product.isPremium) {
    changes.isPremium = { old: product.isPremium, new: isPremium };
    product.isPremium = isPremium;
  }
  
  if (isFeatured !== undefined && isFeatured !== product.isFeatured) {
    changes.isFeatured = { old: product.isFeatured, new: isFeatured };
    product.isFeatured = isFeatured;
  }
  
  if (isHero !== undefined && isHero !== product.isHero) {
    changes.isHero = { old: product.isHero, new: isHero };
    product.isHero = isHero;
  }
  
  if (heroOrder !== undefined && heroOrder !== product.heroOrder) {
    changes.heroOrder = { old: product.heroOrder, new: heroOrder };
    product.heroOrder = heroOrder;
  }
  
  if (featuredOrder !== undefined && featuredOrder !== product.featuredOrder) {
    changes.featuredOrder = { old: product.featuredOrder, new: featuredOrder };
    product.featuredOrder = featuredOrder;
  }
  
  if (status !== undefined && status !== product.status) {
    changes.status = { old: product.status, new: status };
    product.status = status;
  }
  
  if (visibility !== undefined && visibility !== product.visibility) {
    changes.visibility = { old: product.visibility, new: visibility };
    product.visibility = visibility;
  }
  
  if (creatorId !== undefined && creatorId !== product.creatorId) {
    const nextCreatorId = creatorId === '' ? undefined : creatorId;
    if (nextCreatorId !== product.creatorId) {
      changes.creatorId = { old: product.creatorId, new: nextCreatorId };
      product.creatorId = nextCreatorId;
    }
  }
  
  // Auto-detect resolution if explicitly cleared or set to auto-detect (empty string / null)
  let targetDisplayResolution = displayResolution;
  if (displayResolution === '' || displayResolution === null) {
    const meta = resolutionService.computeResolutionMetadata(product);
    targetDisplayResolution = meta.displayResolutionLabel || undefined;
  }

  let targetDefaultDownload = defaultDownload;
  if (defaultDownload === '' || defaultDownload === null) {
    const meta = resolutionService.computeResolutionMetadata(product);
    targetDefaultDownload = meta.defaultDownload || undefined;
  }

  if (targetDisplayResolution !== undefined && targetDisplayResolution !== product.displayResolution) {
    changes.displayResolution = { old: product.displayResolution, new: targetDisplayResolution };
    product.displayResolution = targetDisplayResolution;
  }
  
  if (targetDefaultDownload !== undefined && targetDefaultDownload !== product.defaultDownload) {
    changes.defaultDownload = { old: product.defaultDownload, new: targetDefaultDownload };
    product.defaultDownload = targetDefaultDownload;
  }
  
  if (availableResolutions !== undefined && JSON.stringify(availableResolutions) !== JSON.stringify(product.availableResolutions)) {
    changes.availableResolutions = { old: product.availableResolutions, new: availableResolutions };
    product.availableResolutions = availableResolutions;
  }
  
  if (altText !== undefined && altText !== product.altText) {
    changes.altText = { old: product.altText, new: altText };
    product.altText = altText;
  }
  
  if (slug !== undefined && slug !== product.slug) {
    changes.slug = { old: product.slug, new: slug };
    product.slug = slug.toLowerCase().trim();
  }
  
  if (metaTitle !== undefined && metaTitle !== product.metaTitle) {
    changes.metaTitle = { old: product.metaTitle, new: metaTitle };
    product.metaTitle = metaTitle;
  }
  
  if (metaDescription !== undefined && metaDescription !== product.metaDescription) {
    changes.metaDescription = { old: product.metaDescription, new: metaDescription };
    product.metaDescription = metaDescription;
  }
  
  if (sortOrder !== undefined && sortOrder !== product.sortOrder) {
    changes.sortOrder = { old: product.sortOrder, new: sortOrder };
    product.sortOrder = sortOrder;
  }
  
  if (downloadPermissions !== undefined && downloadPermissions !== product.downloadPermissions) {
    changes.downloadPermissions = { old: product.downloadPermissions, new: downloadPermissions };
    product.downloadPermissions = downloadPermissions;
  }
  
  if (ageRating !== undefined && ageRating !== product.ageRating) {
    const nextAgeRating = ageRating === '' ? undefined : ageRating;
    if (nextAgeRating !== product.ageRating) {
      changes.ageRating = { old: product.ageRating, new: nextAgeRating };
      product.ageRating = nextAgeRating;
    }
  }
  
  // If no changes were made, return success
  if (Object.keys(changes).length === 0) {
    return res.status(200).json(
      successResponse({
        message: 'No changes made',
        data: product,
      })
    );
  }
  
  // Add audit information
  product.lastEditedBy = req.user._id;
  product.lastEditedAt = new Date();
  product.editHistory = product.editHistory || [];
  product.editHistory.push({
    editedBy: req.user._id,
    editedAt: new Date(),
    changes: changes,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  
  // Save the product
  await product.save();
  
  res.status(200).json(
    successResponse({
      message: 'Product updated successfully',
      data: product,
    })
  );
});

/**
 * Update product assets (thumbnail, preview, banner)
 * 
 * @route PATCH /api/v1/admin/products/:id/assets
 * @access Private/Admin
 */
const updateProductAssets = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { thumbnail, preview, banner } = req.body;
  
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  
  // Track changes for audit
  const changes = {};
  const oldProduct = JSON.parse(JSON.stringify(product));
  
  // Update thumbnail if provided
  if (thumbnail !== undefined && thumbnail !== product.img) {
    changes.thumbnail = { old: product.img, new: thumbnail };
    product.img = thumbnail;
  }
  
  // Update preview if provided
  if (preview !== undefined && preview !== product.assets?.preview?.url) {
    changes.preview = { old: product.assets?.preview?.url, new: preview };
    if (product.assets) {
      product.assets.preview = {
        ...product.assets.preview,
        url: preview
      };
    }
  }
  
  // Update banner if provided
  if (banner !== undefined && banner !== product.banner) {
    changes.banner = { old: product.banner, new: banner };
    product.banner = banner;
  }
  
  // If no changes were made, return success
  if (Object.keys(changes).length === 0) {
    return res.status(200).json(
      successResponse({
        message: 'No changes made',
        data: product,
      })
    );
  }
  
  // Add audit information
  product.lastEditedBy = req.user._id;
  product.lastEditedAt = new Date();
  product.editHistory = product.editHistory || [];
  product.editHistory.push({
    editedBy: req.user._id,
    editedAt: new Date(),
    changes: changes,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  
  // Save the product
  await product.save();
  
  res.status(200).json(
    successResponse({
      message: 'Product assets updated successfully',
      data: product,
    })
  );
});

/**
 * Permanently delete a product (metadata only)
 * 
 * @route DELETE /api/v1/admin/products/:id
 * @access Private/Admin
 */
const deleteProductAsAdmin = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  
  await Product.findByIdAndDelete(id);
  
  res.status(200).json(
    successResponse({
      message: 'Product permanently deleted successfully',
      data: null,
    })
  );
});

module.exports = {
  getProductForAdminEdit,
  updateProductForAdmin,
  updateProductAssets,
  deleteProductAsAdmin,
};