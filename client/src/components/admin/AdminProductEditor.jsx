import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import apiClient from '../../api/client';
import { Button, Input, TextArea, Select, Checkbox, Badge, Modal } from '../../components/ui';
import { formatFileSize } from '../../utils/resolutionUtils';

const AdminProductEditor = ({ product, onClose }) => {
  const navigate = useNavigate();
  const { addToast } = useUI();
  const { user } = useAuth();
  const { id } = useParams();
  
  // Form state
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    series: product?.series || '',
    character: product?.character || '',
    category: product?.category || '',
    tags: product?.tags?.join(', ') || '',
    price: product?.price || 0,
    isPremium: product?.isPremium || false,
    isFeatured: product?.isFeatured || false,
    isHero: product?.isHero || false,
    heroOrder: product?.heroOrder || 0,
    featuredOrder: product?.featuredOrder || 0,
    status: product?.status || 'active',
    visibility: product?.visibility || 'public',
    creatorId: product?.creatorId?._id || product?.creatorId || '',
    displayResolution: product?.displayResolution || '',
    defaultDownload: product?.defaultDownload || '',
    availableResolutions: product?.availableResolutions?.join(', ') || '',
    altText: product?.altText || '',
    slug: product?.slug || '',
    metaTitle: product?.metaTitle || '',
    metaDescription: product?.metaDescription || '',
    sortOrder: product?.sortOrder || 0,
    downloadPermissions: product?.downloadPermissions || 'all',
    ageRating: product?.ageRating || '',
    thumbnail: product?.img || '',
    preview: product?.assets?.preview?.url || '',
    banner: product?.banner || '',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetType, setAssetType] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  
  // Available options
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'archived', label: 'Archived' },
  ];
  
  const visibilityOptions = [
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' },
    { value: 'unlisted', label: 'Unlisted' },
  ];
  
  const downloadPermissionsOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'premium', label: 'Premium Only' },
    { value: 'free', label: 'Free Only' },
    { value: 'none', label: 'None' },
  ];
  
  const ageRatingOptions = [
    { value: 'G', label: 'G - General' },
    { value: 'PG', label: 'PG - Parental Guidance' },
    { value: 'PG-13', label: 'PG-13 - Parents Strongly Cautioned' },
    { value: 'R', label: 'R - Restricted' },
    { value: 'NC-17', label: 'NC-17 - Adults Only' },
  ];
  
  const resolutionOptions = [
    { value: '4K Ultra HD', label: '4K Ultra HD' },
    { value: '2K Quad HD', label: '2K Quad HD' },
    { value: 'HD (1920×1080)', label: 'HD (1920×1080)' },
    { value: 'HD Ready', label: 'HD Ready' },
    { value: 'Mobile Portrait', label: 'Mobile Portrait' },
    { value: 'Mobile Landscape', label: 'Mobile Landscape' },
    { value: 'Original', label: 'Original' },
  ];
  
  const defaultDownloadOptions = [
    { value: 'original', label: 'Original' },
    { value: '4k', label: '4K Ultra HD' },
    { value: '2k', label: '2K Quad HD' },
    { value: '1080p', label: 'HD (1920×1080)' },
    { value: '720p', label: 'HD Ready' },
    { value: 'mobile-portrait', label: 'Mobile Portrait' },
    { value: 'mobile-landscape', label: 'Mobile Landscape' },
  ];
  
  const availableResolutionsOptions = [
    { value: '4k', label: '4K Ultra HD' },
    { value: '2k', label: '2K Quad HD' },
    { value: '1080p', label: 'HD (1920×1080)' },
    { value: '720p', label: 'HD Ready' },
    { value: 'mobile-portrait', label: 'Mobile Portrait' },
    { value: 'mobile-landscape', label: 'Mobile Landscape' },
  ];
  
  // Update form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        series: product.series || '',
        character: product.character || '',
        category: product.category || '',
        tags: product.tags?.join(', ') || '',
        price: product.price || 0,
        isPremium: product.isPremium || false,
        isFeatured: product.isFeatured || false,
        isHero: product.isHero || false,
        heroOrder: product.heroOrder || 0,
        featuredOrder: product.featuredOrder || 0,
        status: product.status || 'active',
        visibility: product.visibility || 'public',
        creatorId: product.creatorId?._id || product.creatorId || '',
        displayResolution: product.displayResolution || '',
        defaultDownload: product.defaultDownload || '',
        availableResolutions: product.availableResolutions?.join(', ') || '',
        altText: product.altText || '',
        slug: product.slug || '',
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        sortOrder: product.sortOrder || 0,
        downloadPermissions: product.downloadPermissions || 'all',
        ageRating: product.ageRating || '',
        thumbnail: product.img || '',
        preview: product.assets?.preview?.url || '',
        banner: product.banner || '',
      });
    }
  }, [product]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags: tags.join(', ')
    }));
  };
  
  const handleAvailableResolutionsChange = (e) => {
    const resolutions = e.target.value.split(',').map(res => res.trim()).filter(res => res);
    setFormData(prev => ({
      ...prev,
      availableResolutions: resolutions.join(', ')
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const data = {
        name: formData.name,
        description: formData.description,
        series: formData.series,
        character: formData.character,
        category: formData.category,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        price: parseFloat(formData.price),
        isPremium: formData.isPremium,
        isFeatured: formData.isFeatured,
        isHero: formData.isHero,
        heroOrder: parseInt(formData.heroOrder),
        featuredOrder: parseInt(formData.featuredOrder),
        status: formData.status,
        visibility: formData.visibility,
        creatorId: formData.creatorId || undefined,
        displayResolution: formData.displayResolution,
        defaultDownload: formData.defaultDownload,
        availableResolutions: formData.availableResolutions ? formData.availableResolutions.split(',').map(res => res.trim()).filter(res => res) : [],
        altText: formData.altText,
        slug: formData.slug,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        sortOrder: parseInt(formData.sortOrder),
        downloadPermissions: formData.downloadPermissions,
        ageRating: formData.ageRating,
      };
      
      const response = await apiClient.patch(`/admin/products/${id}`, data);
      
      addToast('Product updated successfully!', 'success');
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update product.';
      addToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAssetUpdate = async () => {
    if (!assetUrl) return;
    
    setIsSaving(true);
    
    try {
      const data = {};
      if (assetType === 'thumbnail') {
        data.thumbnail = assetUrl;
      } else if (assetType === 'preview') {
        data.preview = assetUrl;
      } else if (assetType === 'banner') {
        data.banner = assetUrl;
      }
      
      const response = await apiClient.patch(`/admin/products/${id}/assets`, data);
      
      addToast('Asset updated successfully!', 'success');
      setShowAssetModal(false);
      setAssetType('');
      setAssetUrl('');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update asset.';
      addToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };
  
  const openAssetModal = (type) => {
    setAssetType(type);
    if (type === 'thumbnail') {
      setAssetUrl(formData.thumbnail);
    } else if (type === 'preview') {
      setAssetUrl(formData.preview);
    } else if (type === 'banner') {
      setAssetUrl(formData.banner);
    }
    setShowAssetModal(true);
  };
  
  const getAssetPreview = (type) => {
    if (type === 'thumbnail') return formData.thumbnail;
    if (type === 'preview') return formData.preview;
    if (type === 'banner') return formData.banner;
    return '';
  };
  
  const getAssetLabel = (type) => {
    if (type === 'thumbnail') return 'Thumbnail';
    if (type === 'preview') return 'Preview';
    if (type === 'banner') return 'Banner';
    return '';
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface max-w-4xl w-full max-h-screen overflow-y-auto rounded-xl shadow-2xl">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text">Edit Wallpaper</h2>
            <button
              onClick={onClose}
              className="text-text-3 hover:text-text transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* General Section */}
          <div className="bg-surface-2 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-accent mb-4">General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Title *</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter wallpaper title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Anime/Series *</label>
                <Input
                  name="series"
                  value={formData.series}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter anime series"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Character</label>
                <Input
                  name="character"
                  value={formData.character}
                  onChange={handleInputChange}
                  placeholder="Enter character name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Category</label>
                <Input
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Enter category"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Price</label>
                <Input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Status</label>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  options={statusOptions}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Visibility</label>
                <Select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleInputChange}
                  options={visibilityOptions}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Download Permissions</label>
                <Select
                  name="downloadPermissions"
                  value={formData.downloadPermissions}
                  onChange={handleInputChange}
                  options={downloadPermissionsOptions}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Age Rating</label>
                <Select
                  name="ageRating"
                  value={formData.ageRating}
                  onChange={handleInputChange}
                  options={ageRatingOptions}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Sort Order</label>
                <Input
                  type="number"
                  name="sortOrder"
                  value={formData.sortOrder}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Creator</label>
                <Input
                  name="creatorId"
                  value={formData.creatorId}
                  onChange={handleInputChange}
                  placeholder="User ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Display Resolution</label>
                <Select
                  name="displayResolution"
                  value={formData.displayResolution}
                  onChange={handleInputChange}
                  options={resolutionOptions}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Default Download</label>
                <Select
                  name="defaultDownload"
                  value={formData.defaultDownload}
                  onChange={handleInputChange}
                  options={defaultDownloadOptions}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Available Resolutions</label>
                <Input
                  name="availableResolutions"
                  value={formData.availableResolutions}
                  onChange={handleAvailableResolutionsChange}
                  placeholder="4k, 2k, 1080p, ..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Slug</label>
                <Input
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="auto-generated"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Alt Text (SEO)</label>
                <Input
                  name="altText"
                  value={formData.altText}
                  onChange={handleInputChange}
                  placeholder="Wallpaper of [character] from [series]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Meta Title (SEO)</label>
                <Input
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  placeholder="Optional custom title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Meta Description (SEO)</label>
                <Input
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  placeholder="Optional custom description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Tags</label>
                <Input
                  name="tags"
                  value={formData.tags}
                  onChange={handleTagsChange}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-2 mb-1">Description</label>
                <TextArea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Enter detailed description of the wallpaper"
                />
              </div>
              
              <div className="md:col-span-2 flex items-center gap-4">
                <Checkbox
                  name="isPremium"
                  checked={formData.isPremium}
                  onChange={handleInputChange}
                  label="Premium Content"
                />
                <Checkbox
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  label="Featured"
                />
                <Checkbox
                  name="isHero"
                  checked={formData.isHero}
                  onChange={handleInputChange}
                  label="Hero Slider"
                />
              </div>
              
              {formData.isHero && (
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">Hero Order</label>
                  <Input
                    type="number"
                    name="heroOrder"
                    value={formData.heroOrder}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="0"
                  />
                </div>
              )}
              
              {formData.isFeatured && (
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1">Featured Order</label>
                  <Input
                    type="number"
                    name="featuredOrder"
                    value={formData.featuredOrder}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="0"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Asset Management Section */}
          <div className="bg-surface-2 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-accent mb-4">Asset Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Thumbnail</label>
                <div className="flex items-center gap-2">
                  {formData.thumbnail ? (
                    <img
                      src={formData.thumbnail}
                      alt="Thumbnail"
                      className="w-16 h-16 object-cover rounded border border-border"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-surface-3 rounded border border-border flex items-center justify-center">
                      <span className="text-text-3">No image</span>
                    </div>
                  )}
                  <Button
                    type="button"
                    onClick={() => openAssetModal('thumbnail')}
                    variant="secondary"
                    size="sm"
                  >
                    Edit
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Preview</label>
                <div className="flex items-center gap-2">
                  {formData.preview ? (
                    <img
                      src={formData.preview}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded border border-border"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-surface-3 rounded border border-border flex items-center justify-center">
                      <span className="text-text-3">No image</span>
                    </div>
                  )}
                  <Button
                    type="button"
                    onClick={() => openAssetModal('preview')}
                    variant="secondary"
                    size="sm"
                  >
                    Edit
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Banner</label>
                <div className="flex items-center gap-2">
                  {formData.banner ? (
                    <img
                      src={formData.banner}
                      alt="Banner"
                      className="w-16 h-16 object-cover rounded border border-border"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-surface-3 rounded border border-border flex items-center justify-center">
                      <span className="text-text-3">No image</span>
                    </div>
                  )}
                  <Button
                    type="button"
                    onClick={() => openAssetModal('banner')}
                    variant="secondary"
                    size="sm"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-border">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              loading={isSaving}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
      
      {/* Asset Modal */}
      {showAssetModal && (
        <Modal
          title={`Edit ${getAssetLabel(assetType)}`}
          isOpen={showAssetModal}
          onClose={() => {
            setShowAssetModal(false);
            setAssetType('');
            setAssetUrl('');
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">New {getAssetLabel(assetType)} URL</label>
              <Input
                value={assetUrl}
                onChange={(e) => setAssetUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            {assetUrl && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-text-2 mb-1">Preview</label>
                <img
                  src={assetUrl}
                  alt="Preview"
                  className="max-w-full h-auto rounded border border-border"
                />
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setShowAssetModal(false);
                  setAssetType('');
                  setAssetUrl('');
                }}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAssetUpdate}
                disabled={!assetUrl || isSaving}
                loading={isSaving}
              >
                Update Asset
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminProductEditor;