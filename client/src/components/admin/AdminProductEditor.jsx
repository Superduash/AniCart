import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import apiClient from '../../api/client';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import Checkbox from '../ui/Checkbox';
import Badge from '../ui/Badge';
import { formatFileSize, RESOLUTION_CONFIG, RESOLUTION_PRIORITY, getAvailableVariants } from '../../utils/resolutionUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'active',   label: 'Active' },
  { value: 'pending',  label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
  { value: 'removed',  label: 'Removed' },
];

const VISIBILITY_OPTIONS = [
  { value: 'public',   label: 'Public' },
  { value: 'private',  label: 'Private' },
  { value: 'unlisted', label: 'Unlisted' },
];

const DOWNLOAD_PERMISSION_OPTIONS = [
  { value: 'all',     label: 'All Users' },
  { value: 'premium', label: 'Premium Only' },
  { value: 'free',    label: 'Free Only' },
  { value: 'none',    label: 'None' },
];

const AGE_RATING_OPTIONS = [
  { value: '',      label: '— Select Age Rating —' },
  { value: 'G',     label: 'G — General' },
  { value: 'PG',    label: 'PG — Parental Guidance' },
  { value: 'PG-13', label: 'PG-13 — Parents Strongly Cautioned' },
  { value: 'R',     label: 'R — Restricted' },
  { value: 'NC-17', label: 'NC-17 — Adults Only' },
];

// displayResolution in DB stores label strings (e.g. "4K Ultra HD")
// defaultDownload stores keys (e.g. "4k")
const DISPLAY_RESOLUTION_OPTIONS = [
  { value: '',                label: '— Auto-detect —' },
  { value: '4K Ultra HD',     label: '4K Ultra HD' },
  { value: '2K Quad HD',      label: '2K Quad HD' },
  { value: 'HD (1920×1080)', label: 'HD (1920×1080)' },
  { value: 'HD Ready',        label: 'HD Ready (720p)' },
  { value: 'Mobile Portrait', label: 'Mobile Portrait' },
  { value: 'Mobile Landscape',label: 'Mobile Landscape' },
  { value: 'Original',        label: 'Original' },
];

const DEFAULT_DOWNLOAD_OPTIONS = [
  { value: '',               label: '— Auto-detect —' },
  { value: 'original',       label: 'Original (Source)' },
  { value: '4k',             label: '4K Ultra HD' },
  { value: '2k',             label: '2K Quad HD' },
  { value: '1080p',          label: 'HD (1920×1080)' },
  { value: '720p',           label: 'HD Ready' },
  { value: 'mobile-portrait',label: 'Mobile Portrait' },
  { value: 'mobile-landscape',label: 'Mobile Landscape' },
];

// All possible resolution keys for manual override checkboxes
const ALL_RESOLUTION_KEYS = ['original', '4k', '2k', '1080p', '720p', 'mobile-portrait', 'mobile-landscape'];

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{
      background: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 24,
      marginBottom: 20,
    }}>
      <h3 style={{
        fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 700,
        fontSize: '1.05rem',
        color: 'var(--color-accent)',
        marginBottom: 16,
        letterSpacing: '1px',
        textTransform: 'uppercase',
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function FieldRow({ children, cols = 2 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 16,
    }}>
      {children}
    </div>
  );
}

function Field({ label, children, fullWidth }) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : {}}>
      <label style={{
        display: 'block',
        marginBottom: 6,
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: 'var(--color-text-2)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

const AdminProductEditor = ({ product, onClose, onSaved }) => {
  const { addToast } = useUI();
  const { id: paramId } = useParams();
  const productId = product?.id || product?._id || paramId;

  // Derive actual available variants from asset keys in DB
  const actualVariants = getAvailableVariants(product);

  // Form state
  const [form, setForm] = useState(() => buildInitialForm(product));
  const [isSaving, setIsSaving]   = useState(false);
  const [assetModal, setAssetModal] = useState(null); // null | { type, url }

  // Sync when product changes
  useEffect(() => {
    if (product) setForm(buildInitialForm(product));
  }, [product]);

  function buildInitialForm(p) {
    return {
      name:                 p?.name               || '',
      description:          p?.description         || '',
      series:               p?.series              || '',
      character:            p?.character           || '',
      category:             p?.category            || '',
      tags:                 Array.isArray(p?.tags) ? p.tags.join(', ') : (p?.tags || ''),
      price:                p?.price               ?? 0,
      isPremium:            p?.isPremium           || false,
      isFeatured:           p?.isFeatured          || false,
      isHero:               p?.isHero              || false,
      heroOrder:            p?.heroOrder           ?? 0,
      featuredOrder:        p?.featuredOrder       ?? 0,
      status:               p?.status              || 'active',
      visibility:           p?.visibility          || 'public',
      creatorId:            p?.creatorId?._id || (typeof p?.creatorId === 'string' ? p.creatorId : '') || '',
      // Resolution fields
      displayResolution:    p?.displayResolution   || '',
      defaultDownload:      p?.defaultDownload     || '',
      // availableResolutions is a Set of checked keys (manual override)
      availableResolutions: new Set(Array.isArray(p?.availableResolutions) ? p.availableResolutions : []),
      // SEO / Meta
      altText:              p?.altText             || '',
      slug:                 p?.slug                || '',
      metaTitle:            p?.metaTitle           || '',
      metaDescription:      p?.metaDescription     || '',
      sortOrder:            p?.sortOrder           ?? 0,
      downloadPermissions:  p?.downloadPermissions || 'all',
      ageRating:            p?.ageRating           || '',
      // Asset URLs (display only, editable via modal)
      thumbnail:            p?.img                 || '',
      preview:              p?.assets?.preview?.url || '',
      banner:               p?.banner              || '',
    };
  }

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    set(name, type === 'checkbox' ? checked : value);
  };

  const toggleResolution = key => {
    setForm(prev => {
      const next = new Set(prev.availableResolutions);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, availableResolutions: next };
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        name:                form.name.trim(),
        description:         form.description,
        series:              form.series.trim(),
        character:           form.character,
        category:            form.category,
        tags:                form.tags
                               ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
                               : [],
        price:               parseFloat(form.price) || 0,
        isPremium:           form.isPremium,
        isFeatured:          form.isFeatured,
        isHero:              form.isHero,
        heroOrder:           parseInt(form.heroOrder) || 0,
        featuredOrder:       parseInt(form.featuredOrder) || 0,
        status:              form.status,
        visibility:          form.visibility,
        creatorId:           form.creatorId,
        displayResolution:   form.displayResolution,
        defaultDownload:     form.defaultDownload,
        availableResolutions: [...form.availableResolutions],
        altText:             form.altText,
        slug:                form.slug,
        metaTitle:           form.metaTitle,
        metaDescription:     form.metaDescription,
        sortOrder:           parseInt(form.sortOrder) || 0,
        downloadPermissions: form.downloadPermissions,
        ageRating:           form.ageRating,
      };

      await apiClient.patch(`/admin/products/${productId}`, payload);
      addToast('Wallpaper updated successfully!', 'success');
      if (onSaved) onSaved();
      if (onClose) onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update product.';
      addToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssetSave = async () => {
    if (!assetModal?.url) return;
    setIsSaving(true);
    try {
      const data = { [assetModal.type]: assetModal.url };
      await apiClient.patch(`/admin/products/${productId}/assets`, data);
      // Update local form state
      if (assetModal.type === 'thumbnail') set('thumbnail', assetModal.url);
      if (assetModal.type === 'preview')   set('preview',   assetModal.url);
      if (assetModal.type === 'banner')    set('banner',    assetModal.url);
      addToast('Asset updated!', 'success');
      setAssetModal(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update asset.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '20px 16px',
          overflowY: 'auto',
        }}
        onClick={e => { if (e.target === e.currentTarget && onClose) onClose(); }}
      >
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: 900,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}>
          {/* Header */}
          <div style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            background: 'var(--color-surface)',
            zIndex: 10,
            borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          }}>
            <div>
              <h2 style={{
                fontFamily: 'Orbitron, monospace',
                fontWeight: 800,
                fontSize: '1.25rem',
                color: 'var(--color-pink)',
                margin: 0,
              }}>
                Edit Wallpaper
              </h2>
              {product?.name && (
                <p style={{ margin: '4px 0 0', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'var(--color-text-3)' }}>
                  {product.name}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--color-text-2)',
                fontSize: '1.2rem',
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: 28 }}>

            {/* ── General Info ── */}
            <Section title="General Info">
              <FieldRow cols={2}>
                <Field label="Title *">
                  <Input name="name" value={form.name} onChange={handleChange} required placeholder="Wallpaper title" />
                </Field>
                <Field label="Anime / Series *">
                  <Input name="series" value={form.series} onChange={handleChange} required placeholder="e.g. Demon Slayer" />
                </Field>
                <Field label="Character">
                  <Input name="character" value={form.character} onChange={handleChange} placeholder="e.g. Tanjiro Kamado" />
                </Field>
                <Field label="Category">
                  <Input name="category" value={form.category} onChange={handleChange} placeholder="e.g. Shonen, Action" />
                </Field>
                <Field label="Price ($)">
                  <Input type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" />
                </Field>
                <Field label="Sort Order">
                  <Input type="number" name="sortOrder" value={form.sortOrder} onChange={handleChange} min="0" />
                </Field>
                <Field label="Tags (comma-separated)" fullWidth>
                  <Input name="tags" value={form.tags} onChange={handleChange} placeholder="Action, Dark Fantasy, 4K" />
                </Field>
                <Field label="Description" fullWidth>
                  <TextArea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Describe the wallpaper..." />
                </Field>
              </FieldRow>
            </Section>

            {/* ── Status & Visibility ── */}
            <Section title="Status & Visibility">
              <FieldRow cols={3}>
                <Field label="Status">
                  <Select name="status" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} />
                </Field>
                <Field label="Visibility">
                  <Select name="visibility" value={form.visibility} onChange={handleChange} options={VISIBILITY_OPTIONS} />
                </Field>
                <Field label="Download Permissions">
                  <Select name="downloadPermissions" value={form.downloadPermissions} onChange={handleChange} options={DOWNLOAD_PERMISSION_OPTIONS} />
                </Field>
                <Field label="Age Rating">
                  <Select name="ageRating" value={form.ageRating} onChange={handleChange} options={AGE_RATING_OPTIONS} />
                </Field>
                <Field label="Creator User ID">
                  <Input name="creatorId" value={form.creatorId} onChange={handleChange} placeholder="ObjectId string" />
                </Field>
              </FieldRow>
              <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
                <Checkbox name="isPremium"  checked={form.isPremium}  onChange={handleChange} label="Premium Content" />
                <Checkbox name="isFeatured" checked={form.isFeatured} onChange={handleChange} label="Featured" />
                <Checkbox name="isHero"     checked={form.isHero}     onChange={handleChange} label="Hero Slider" />
              </div>
              {form.isHero && (
                <div style={{ marginTop: 12 }}>
                  <Field label="Hero Order">
                    <Input type="number" name="heroOrder" value={form.heroOrder} onChange={handleChange} min="0" style={{ maxWidth: 120 }} />
                  </Field>
                </div>
              )}
              {form.isFeatured && (
                <div style={{ marginTop: 12 }}>
                  <Field label="Featured Order">
                    <Input type="number" name="featuredOrder" value={form.featuredOrder} onChange={handleChange} min="0" style={{ maxWidth: 120 }} />
                  </Field>
                </div>
              )}
            </Section>

            {/* ── Resolution & Downloads ── */}
            <Section title="Resolution & Downloads">
              {/* Show actual stored variants from R2 */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: 'var(--color-text-3)', marginBottom: 10 }}>
                  Actual stored R2 variants (read-only — generated automatically):
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {actualVariants.length > 0 ? actualVariants.map(key => {
                    const cfg = RESOLUTION_CONFIG[key];
                    const asset = product?.assets?.[key];
                    return (
                      <span
                        key={key}
                        title={asset ? `${asset.width || '?'}×${asset.height || '?'} · ${formatFileSize(asset.size)}` : ''}
                        style={{
                          padding: '4px 12px',
                          background: 'rgba(0,210,255,0.1)',
                          border: '1px solid rgba(0,210,255,0.3)',
                          borderRadius: 'var(--radius-full)',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.75rem',
                          color: 'var(--color-accent)',
                          cursor: 'default',
                        }}
                      >
                        {cfg?.label || key}
                        {asset && (
                          <span style={{ opacity: 0.6, marginLeft: 6 }}>
                            {asset.width && asset.height ? `${asset.width}×${asset.height}` : ''}
                          </span>
                        )}
                      </span>
                    );
                  }) : (
                    <span style={{ color: 'var(--color-text-3)', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
                      No variants stored yet
                    </span>
                  )}
                </div>
              </div>

              {/* Manual override: availableResolutions */}
              <div style={{ marginBottom: 16 }}>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-text-2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 10,
                }}>
                  Available Resolutions (manual override)
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {ALL_RESOLUTION_KEYS.map(key => {
                    const cfg = RESOLUTION_CONFIG[key];
                    const hasAsset = actualVariants.includes(key);
                    return (
                      <label
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 14px',
                          background: form.availableResolutions.has(key)
                            ? 'rgba(0,210,255,0.12)'
                            : 'var(--color-surface-2)',
                          border: `1px solid ${form.availableResolutions.has(key) ? 'rgba(0,210,255,0.4)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.availableResolutions.has(key)}
                          onChange={() => toggleResolution(key)}
                          style={{ accentColor: 'var(--color-accent)' }}
                        />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'var(--color-text)' }}>
                          {cfg?.label || key}
                        </span>
                        {hasAsset && (
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#00c864',
                            background: 'rgba(0,200,100,0.12)',
                            padding: '1px 6px',
                            borderRadius: 4,
                          }}>
                            ✓ stored
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <FieldRow cols={2}>
                <Field label="Display Resolution (badge label)">
                  <Select
                    name="displayResolution"
                    value={form.displayResolution}
                    onChange={handleChange}
                    options={DISPLAY_RESOLUTION_OPTIONS}
                  />
                  <p style={{ marginTop: 4, fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                    Shown as badge on product card. Leave blank to auto-detect from assets.
                  </p>
                </Field>
                <Field label="Default Download Resolution">
                  <Select
                    name="defaultDownload"
                    value={form.defaultDownload}
                    onChange={handleChange}
                    options={DEFAULT_DOWNLOAD_OPTIONS}
                  />
                  <p style={{ marginTop: 4, fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                    Which variant is offered first at checkout. Leave blank to auto-detect.
                  </p>
                </Field>
              </FieldRow>
            </Section>

            {/* ── SEO / Meta ── */}
            <Section title="SEO & Meta">
              <FieldRow cols={2}>
                <Field label="Slug (URL-safe)">
                  <Input name="slug" value={form.slug} onChange={handleChange} placeholder="auto-generated from title" />
                </Field>
                <Field label="Alt Text">
                  <Input name="altText" value={form.altText} onChange={handleChange} placeholder="Wallpaper of [character] from [series]" />
                </Field>
                <Field label="Meta Title">
                  <Input name="metaTitle" value={form.metaTitle} onChange={handleChange} placeholder="Optional override for <title>" />
                </Field>
                <Field label="Meta Description">
                  <Input name="metaDescription" value={form.metaDescription} onChange={handleChange} placeholder="Optional override for meta description" />
                </Field>
              </FieldRow>
            </Section>

            {/* ── Assets ── */}
            <Section title="Asset Management">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {[
                  { type: 'thumbnail', label: 'Thumbnail', url: form.thumbnail },
                  { type: 'preview',   label: 'Preview',   url: form.preview },
                  { type: 'banner',    label: 'Banner',    url: form.banner },
                ].map(({ type, label, url }) => (
                  <div key={type}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                      {label}
                    </p>
                    {url ? (
                      <img
                        src={url}
                        alt={label}
                        style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 8 }}
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--color-surface-2)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, color: 'var(--color-text-3)', fontSize: '0.8125rem' }}>
                        No image
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setAssetModal({ type, url: url || '' })}
                      style={{ width: '100%' }}
                    >
                      Edit URL
                    </Button>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Actions ── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" loading={isSaving} disabled={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Asset URL Modal */}
      {assetModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={e => { if (e.target === e.currentTarget) setAssetModal(null); }}
        >
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 28,
            width: '100%',
            maxWidth: 560,
          }}>
            <h3 style={{ fontFamily: 'Orbitron, monospace', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)', marginBottom: 20 }}>
              Edit {assetModal.type.charAt(0).toUpperCase() + assetModal.type.slice(1)} URL
            </h3>
            <Field label="Image URL">
              <Input
                value={assetModal.url}
                onChange={e => setAssetModal(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com/image.webp"
              />
            </Field>
            {assetModal.url && (
              <div style={{ marginTop: 16 }}>
                <img
                  src={assetModal.url}
                  alt="Preview"
                  style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                  onError={e => { e.currentTarget.style.opacity = '0.3'; }}
                />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <Button type="button" variant="ghost" onClick={() => setAssetModal(null)} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAssetSave}
                disabled={!assetModal.url || isSaving}
                loading={isSaving}
              >
                Update Asset
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminProductEditor;