const SITE_NAME = 'AniCart';
const SITE_URL = window.location.origin;
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`; // Fallback image

export const generateMeta = ({ title, description, keywords }) => {
  return {
    title: title ? `${title} | ${SITE_NAME}` : SITE_NAME,
    description: description || `Premium Anime Wallpapers in 4K & Ultra HD. Download the best anime backgrounds for your desktop and mobile devices at ${SITE_NAME}.`,
    keywords: keywords || 'anime wallpapers, 4k anime backgrounds, desktop wallpapers, mobile anime backgrounds, premium wallpapers',
  };
};

export const generateCanonical = (path) => {
  let origin = SITE_URL || window.location.origin;
  origin = origin.replace(/^http:/, 'https:').replace('://www.', '://');

  let cleanPath = path || '';
  if (cleanPath !== '/' && cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1);
  }

  if (cleanPath && !cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }

  return `${origin}${cleanPath}`;
};

export const generateOpenGraph = ({ title, description, image, url, type = 'website' }) => {
  return {
    'og:title': title ? `${title} | ${SITE_NAME}` : SITE_NAME,
    'og:description': description || `Download premium 4K anime wallpapers at ${SITE_NAME}.`,
    'og:image': image || DEFAULT_IMAGE,
    'og:url': url || generateCanonical(window.location.pathname),
    'og:type': type,
    'og:site_name': SITE_NAME,
  };
};

export const generateTwitterCard = ({ title, description, image, url }) => {
  return {
    'twitter:card': 'summary_large_image',
    'twitter:title': title ? `${title} | ${SITE_NAME}` : SITE_NAME,
    'twitter:description': description || `Download premium 4K anime wallpapers at ${SITE_NAME}.`,
    'twitter:image': image || DEFAULT_IMAGE,
    'twitter:url': url || generateCanonical(window.location.pathname),
  };
};

// Schema Generators
export const generateWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/marketplace?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: DEFAULT_IMAGE,
  sameAs: [],
});

export const generateImageObjectSchema = (product) => ({
  '@context': 'https://schema.org',
  '@type': 'ImageObject',
  name: product.name,
  contentUrl: product.img || product.assets?.preview?.url || DEFAULT_IMAGE,
  thumbnailUrl: product.assets?.thumbnail?.url || product.img || DEFAULT_IMAGE,
  description: `${product.name}${product.series ? ` from ${product.series}` : ''} - Premium anime wallpaper on ${SITE_NAME}`,
  uploadDate: product.createdAt || new Date().toISOString(),
  width: product.resolution?.includes('4k') ? '3840' : '1920',
  height: product.resolution?.includes('4k') ? '2160' : '1080',
  creator: {
    '@type': 'Organization',
    name: SITE_NAME,
  },
});

export const generateProductSchema = (product) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  image: product.img || product.assets?.preview?.url || DEFAULT_IMAGE,
  description: `Download ${product.name} wallpaper in ${product.resolution || '4K'} resolution.`,
  sku: product.id || product._id,
  brand: {
    '@type': 'Brand',
    name: product.series || 'AniCart',
  },
  offers: {
    '@type': 'Offer',
    url: `${SITE_URL}/products/${product.slug || product.id || product._id}`,
    priceCurrency: 'USD',
    price: product.price || '0',
    itemCondition: 'https://schema.org/NewCondition',
    availability: 'https://schema.org/InStock',
  },
});

export const generateCollectionPageSchema = (title, url) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: title,
  url: url || generateCanonical(window.location.pathname),
});

export const generateBreadcrumbsSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url ? `${SITE_URL}${item.url}` : undefined,
  })),
});