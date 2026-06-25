import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { generateCollectionPageSchema, generateBreadcrumbsSchema } from '../utils/seoUtils';
import apiClient from '../api/client';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton, EmptyState } from '../components/ui/Skeleton';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Footer from '../components/layout/Footer';

// Helper to format slugs back into display titles
const formatSlug = (slug) => {
  if (!slug) return '';
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export default function HubPage() {
  const { slug, username } = useParams();
  const location = useLocation();
  const pathname = location.pathname;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]); // Used for hub lists (e.g. series, characters, categories)
  const [products, setProducts] = useState([]); // Used for product lists
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [robots, setRobots] = useState('index,follow');
  const [breadcrumbItems, setBreadcrumbItems] = useState([]);

  // Determine Hub Type
  let type = 'unknown';
  if (pathname === '/anime') type = 'anime-hub';
  else if (pathname.startsWith('/anime/')) type = 'anime-detail';
  else if (pathname === '/characters') type = 'characters-hub';
  else if (pathname.startsWith('/character/')) type = 'character-detail';
  else if (pathname === '/collections' || pathname === '/categories') type = 'collections-hub';
  else if (pathname.startsWith('/category/') || pathname.startsWith('/collections/')) type = 'category-detail';
  else if (pathname.startsWith('/creator/')) type = 'creator-profile';
  else if (pathname === '/4k-wallpapers') type = 'resolution-4k';
  else if (pathname === '/mobile-wallpapers') type = 'resolution-mobile';
  else if (pathname === '/new') type = 'new';
  else if (pathname === '/trending') type = 'trending';
  else if (pathname === '/popular') type = 'popular';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (type === 'anime-hub') {
          setTitle('Anime Wallpapers Hub | Browse Series | AniCart');
          setDescription('Explore premium 4K wallpapers organized by your favorite anime series. Discover collections from Jujutsu Kaisen, Demon Slayer, and more.');
          setKeywords('anime series wallpapers, anime list, 4k anime series backgrounds');
          setBreadcrumbItems([{ label: 'Home', path: '/' }, { label: 'Anime' }]);
          
          const res = await apiClient.get('/products/series/list');
          setItems(res.data?.data?.series || res.data?.data || []);
        } 
        else if (type === 'characters-hub') {
          setTitle('Anime Characters Wallpapers Hub | AniCart');
          setDescription('Find premium 4K backgrounds of iconic anime characters. Browse Gojo Satoru, Luffy, Naruto, and other top-tier hero and villain wallpapers.');
          setKeywords('anime character wallpapers, gojo satoru wallpapers, luffy wallpapers, character backgrounds');
          setBreadcrumbItems([{ label: 'Home', path: '/' }, { label: 'Characters' }]);

          const res = await apiClient.get('/products/characters/list');
          setItems(res.data?.data?.characters || res.data?.data || []);
        } 
        else if (type === 'collections-hub') {
          setTitle('Anime Wallpaper Collections & Styles | AniCart');
          setDescription('Browse premium wallpapers sorted by styles and tags. Discover dark cyberpunk themes, action-packed battle scenes, and AMOLED designs.');
          setKeywords('anime wallpaper styles, cyberpunk anime backgrounds, action anime art');
          setBreadcrumbItems([{ label: 'Home', path: '/' }, { label: 'Collections' }]);

          const res = await apiClient.get('/products/tags/list');
          setItems(res.data?.data?.tags || res.data?.data || []);
        } 
        else {
          // It's a wallpaper catalog query page
          let params = { limit: 40, status: 'active' };
          let displayTitle = '';
          let displayDesc = '';
          let displayKeywords = '';

          if (type === 'anime-detail') {
            const seriesName = formatSlug(slug);
            displayTitle = `${seriesName} Wallpapers in 4K & HD | AniCart`;
            displayDesc = `Download high-quality ${seriesName} wallpapers for desktop and mobile. Discover premium 4K background artwork of ${seriesName}.`;
            displayKeywords = `${seriesName} wallpapers, ${seriesName} 4k backgrounds, download ${seriesName} art`;
            setBreadcrumbItems([{ label: 'Home', path: '/' }, { label: 'Anime', path: '/anime' }, { label: seriesName }]);
            params.series = slug;
          } 
          else if (type === 'character-detail') {
            const charName = formatSlug(slug);
            displayTitle = `${charName} Wallpapers | 4K & Mobile backgrounds | AniCart`;
            displayDesc = `Get stunning 4K and mobile wallpapers of ${charName}. Browse the ultimate collection of premium ${charName} background art.`;
            displayKeywords = `${charName} wallpapers, ${charName} 4k background, ${charName} desktop wallpaper`;
            setBreadcrumbItems([{ label: 'Home', path: '/' }, { label: 'Characters', path: '/characters' }, { label: charName }]);
            params.character = slug;
          } 
          else if (type === 'category-detail') {
            const styleName = formatSlug(slug);
            displayTitle = `${styleName} Anime Wallpapers | Curated Styles | AniCart`;
            displayDesc = `Browse premium ${styleName} themed anime wallpapers in 4K and Ultra HD. Elevate your screen with our curated ${styleName} backgrounds.`;
            displayKeywords = `${styleName} anime wallpapers, ${styleName} hd background, premium ${styleName} art`;
            setBreadcrumbItems([{ label: 'Home', path: '/' }, { label: 'Collections', path: '/collections' }, { label: styleName }]);
            params.tags = slug;
          } 
          else if (type === 'creator-profile') {
            const creatorName = formatSlug(username);
            displayTitle = `${creatorName}'s Anime Art Profile | AniCart`;
            displayDesc = `Discover and download premium anime wallpapers created by ${creatorName}. Support local artists and creators on AniCart.`;
            displayKeywords = `${creatorName} profile, ${creatorName} wallpapers, anime artist ${creatorName}`;
            setBreadcrumbItems([{ label: 'Home', path: '/' }, { label: creatorName }]);
            params.creator = username;
          } 
          else if (type === 'resolution-4k') {
            displayTitle = '4K Anime Wallpapers | Ultra HD Backgrounds | AniCart';
            displayDesc = 'Download crystal-clear 4K Ultra HD anime wallpapers for your desktop, laptop, and large monitors. Experience ultimate fidelity.';
            displayKeywords = '4k anime wallpapers, ultra hd backgrounds, 3840x2160 anime art';
            setBreadcrumbItems([{ label: 'Home', path: '/' }, { label: '4K Wallpapers' }]);
            params.resolution = '4k';
          } 
          else if (type === 'resolution-mobile') {
            displayTitle = 'Mobile Anime Wallpapers | iPhone & Android Backgrounds | AniCart';
            displayDesc = 'Browse vertical 4K and HD mobile anime wallpapers tailored for iPhone, Samsung, and Android screens. Lock screens and home screens.';
            displayKeywords = 'mobile anime wallpapers, iphone anime lockscreen, vertical anime backgrounds';
            setBreadcrumbItems([{ label: 'Home', path: '/' }, { label: 'Mobile Wallpapers' }]);
            params.resolution = 'mobile-portrait,mobile-landscape';
          } 
          else if (type === 'new') {
            displayTitle = 'New Anime Wallpapers | Latest Releases | AniCart';
            displayDesc = 'Discover the newest additions to our anime wallpaper catalog. Stay updated with fresh 4K artwork from upcoming and trending series.';
            displayKeywords = 'new anime wallpapers, latest anime backgrounds, fresh anime art';
            setBreadcrumbItems([{ label: 'Home', path: '/' }, { label: 'New Releases' }]);
            params.sort = 'newest';
          } 
          else if (type === 'trending') {
            displayTitle = 'Trending Anime Wallpapers | Hot Art | AniCart';
            displayDesc = 'Check out the most trending anime wallpapers this week. Popular backgrounds loved and downloaded by the community.';
            displayKeywords = 'trending anime wallpapers, popular backgrounds, hot anime art';
            setBreadcrumbItems([{ label: 'Home', path: '/' }, { label: 'Trending' }]);
            params.sort = 'top_rated';
          } 
          else if (type === 'popular') {
            displayTitle = 'Popular Anime Wallpapers | Best Sellers | AniCart';
            displayDesc = 'Our all-time most popular anime wallpapers. Highest rated and most downloaded 4K background art in the marketplace.';
            displayKeywords = 'popular anime wallpapers, best sellers, top rated anime backgrounds';
            setBreadcrumbItems([{ label: 'Home', path: '/' }, { label: 'Popular' }]);
            params.sort = 'top_rated';
          }

          setTitle(displayTitle);
          setDescription(displayDesc);
          setKeywords(displayKeywords);

          const res = await apiClient.get('/products', { params });
          const data = res.data?.data?.products || res.data?.data || [];
          setProducts(data);
          
          if (data.length === 0) {
            setRobots('noindex');
          } else {
            setRobots('index,follow');
          }
        }
      } catch (error) {
        console.error('Error fetching hub page data:', error);
        setRobots('noindex');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pathname, slug, username, type]);

  const schemaUrl = `${window.location.origin}${pathname}`;
  const pageSchema = generateCollectionPageSchema(title, schemaUrl);
  
  const breadcrumbsSchema = generateBreadcrumbsSchema(
    breadcrumbItems.map(item => ({
      name: item.label,
      url: item.path
    }))
  );

  return (
    <div style={{ minHeight: '100vh', paddingTop: 'calc(var(--navbar-height) + 10px)' }}>
      <SEO
        title={title}
        description={description}
        keywords={keywords}
        robots={robots}
        schemas={[pageSchema, breadcrumbsSchema]}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px 80px' }}>
        <Breadcrumbs items={breadcrumbItems} />

        {/* Hub Header */}
        <div style={{ marginBottom: 40, marginTop: 10 }}>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'var(--text-3xl)', color: 'var(--color-text)', marginBottom: 12 }}>
            {type.endsWith('-hub') ? title.split('|')[0].trim() : title.split('|')[0].trim()}
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', maxWidth: 700, lineHeight: 1.6 }}>
            {description}
          </p>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : (
          <>
            {/* Hub List View (series, characters, collections) */}
            {type.endsWith('-hub') && (
              items.length === 0 ? (
                <EmptyState icon="📂" title="No Items Available" body="There are currently no items available in this category." />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
                  {items.map(item => {
                    const isObject = typeof item === 'object';
                    const name = isObject ? item.name : item;
                    const itemSlug = isObject ? item.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    
                    let path = '';
                    if (type === 'anime-hub') path = `/anime/${itemSlug}`;
                    else if (type === 'characters-hub') path = `/character/${itemSlug}`;
                    else if (type === 'collections-hub') path = `/category/${itemSlug}`;

                    return (
                      <Link 
                        key={itemSlug} 
                        to={path} 
                        style={{
                          display: 'flex', flexDirection: 'column', padding: 24,
                          background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-lg)', textDecoration: 'none',
                          transition: 'border-color 0.2s, transform 0.2s',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--color-accent)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-text)', marginBottom: 6 }}>{name}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: 'var(--color-accent)' }}>View Collection →</span>
                      </Link>
                    );
                  })}
                </div>
              )
            )}

            {/* Catalog/Wallpaper View */}
            {!type.endsWith('-hub') && (
              products.length === 0 ? (
                <EmptyState 
                  icon="🔍" 
                  title="No Wallpapers Found" 
                  body="No active wallpapers match this category at the moment." 
                />
              ) : (
                <div className="products-grid" role="list">
                  {products.map(p => <ProductCard key={p._id || p.id} product={p} />)}
                </div>
              )
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
