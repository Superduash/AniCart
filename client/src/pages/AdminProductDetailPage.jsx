import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import apiClient from '../../api/client';
import AdminProductEditor from '../components/admin/AdminProductEditor';

export default function AdminProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useUI();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/admin/products/${id}`);
        setProduct(response.data.data);
      } catch (error) {
        addToast('Failed to load product.', 'error');
        navigate('/admin/products');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role !== 'admin') {
      navigate('/marketplace');
      return;
    }

    loadProduct();
  }, [id, user]);

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="skeleton" style={{ width: '100%', height: '200px', borderRadius: 'var(--radius-xl)', margin: '0 auto 20px' }} />
        <div className="skeleton" style={{ width: '80%', height: '20px', margin: '0 auto 10px', borderRadius: '4px' }} />
        <div className="skeleton" style={{ width: '60%', height: '20px', margin: '0 auto 10px', borderRadius: '4px' }} />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text)' }}>Edit Wallpaper</h1>
        <button
          onClick={() => navigate('/admin/products')}
          className="btn btn-ghost"
          style={{ padding: '8px 16px' }}
        >
          Back to Products
        </button>
      </div>

      {/* Product Preview */}
      <div style={{ 
        background: 'var(--color-surface-2)', 
        padding: '24px', 
        borderRadius: 'var(--radius-lg)', 
        marginBottom: '24px',
        border: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
          <img 
            src={product.img} 
            alt={product.name} 
            style={{ 
              width: '120px', 
              height: '120px', 
              objectFit: 'cover', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--color-border)' 
            }} 
          />
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--color-text)' }}>
              {product.name}
            </h2>
            <p style={{ color: 'var(--color-text-2)', margin: '0', fontSize: '14px' }}>
              {product.series} • {product.resolution}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <span style={{ 
            background: 'var(--color-accent-dim)', 
            color: 'var(--color-accent)', 
            padding: '4px 12px', 
            borderRadius: 'var(--radius-full)', 
            fontSize: '12px', 
            fontWeight: '600'
          }}>
            Status: {product.status}
          </span>
          <span style={{ 
            background: 'var(--color-accent-dim)', 
            color: 'var(--color-accent)', 
            padding: '4px 12px', 
            borderRadius: 'var(--radius-full)', 
            fontSize: '12px', 
            fontWeight: '600'
          }}>
            Visibility: {product.visibility}
          </span>
          <span style={{ 
            background: 'var(--color-accent-dim)', 
            color: 'var(--color-accent)', 
            padding: '4px 12px', 
            borderRadius: 'var(--radius-full)', 
            fontSize: '12px', 
            fontWeight: '600'
          }}>
            Price: ${product.price}
          </span>
          {product.isPremium && (
            <span style={{ 
              background: 'var(--color-pink-dim)', 
              color: 'var(--color-pink)', 
              padding: '4px 12px', 
              borderRadius: 'var(--radius-full)', 
              fontSize: '12px', 
              fontWeight: '600'
            }}>
              Premium
            </span>
          )}
          {product.isFeatured && (
            <span style={{ 
              background: 'var(--color-yellow-dim)', 
              color: 'var(--color-yellow)', 
              padding: '4px 12px', 
              borderRadius: 'var(--radius-full)', 
              fontSize: '12px', 
              fontWeight: '600'
            }}>
              Featured
            </span>
          )}
          {product.isHero && (
            <span style={{ 
              background: 'var(--color-purple-dim)', 
              color: 'var(--color-purple)', 
              padding: '4px 12px', 
              borderRadius: 'var(--radius-full)', 
              fontSize: '12px', 
              fontWeight: '600'
            }}>
              Hero Slider
            </span>
          )}
        </div>
        
        <p style={{ 
          color: 'var(--color-text-2)', 
          lineHeight: '1.6', 
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {product.description || 'No description provided.'}
        </p>
        
        {product.tags && product.tags.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--color-text-2)', 
              marginBottom: '8px'
            }}>
              Tags
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {product.tags.map((tag, index) => (
                <span 
                  key={index} 
                  style={{ 
                    background: 'var(--color-surface)', 
                    color: 'var(--color-text)', 
                    padding: '4px 12px', 
                    borderRadius: 'var(--radius-full)', 
                    fontSize: '12px'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {product.creatorId && (
          <div style={{ 
            background: 'var(--color-surface)', 
            padding: '12px', 
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px'
          }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--color-text-2)', 
              marginBottom: '8px'
            }}>
              Creator
            </h3>
            <p style={{ color: 'var(--color-text)', margin: '0', fontSize: '14px' }}>
              {product.creatorId.name || product.creatorId._id}
            </p>
          </div>
        )}
      </div>

      {/* Edit Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button
          onClick={() => setShowEditor(true)}
          className="btn btn-primary"
          style={{ padding: '12px 24px' }}
        >
          Edit Wallpaper
        </button>
      </div>

      {/* Admin Product Editor Modal */}
      {showEditor && (
        <AdminProductEditor 
          product={product} 
          onClose={() => setShowEditor(false)} 
        />
      )}
    </div>
  );
}