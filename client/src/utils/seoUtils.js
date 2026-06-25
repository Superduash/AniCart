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
  return `${SITE_URL}${path}`;
};

export const generateOpenGraph = ({ title, description, image, url, type = 'website' }) => {
  return {
    'og:title': title ? `${title} | ${SITE_NAME}` : SITE_NAME,
    'og:description': description || `Download premium 4K anime wallpapers at ${SITE_NAME}.`,
    'og:image': image || DEFAULT_IMAGE,
    'og:url': url || SITE_URL,
    'og:type': type,
    'og:site_name': SITE_NAME,
  };
};

export const generateTwitterCard = ({ title, description, image }) => {
  return {
    'twitter:card': 'summary_large_image',
    'twitter:title': title ? `${title} | ${SITE_NAME}` : SITE_NAME,
    'twitter:description': description || `Download premium 4K anime wallpapers at ${SITE_NAME}.`,
    'twitter:image': image || DEFAULT_IMAGE,
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
});

export const generateProductSchema = (product) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  image: product.img,
  description: `Download ${product.name} wallpaper in ${product.resolution} resolution.`,
  sku: product.id,
  brand: {
    '@type': 'Brand',
    name: product.series,
  },
  offers: {
    '@type': 'Offer',
    url: `${SITE_URL}/wallpaper/${product.slug || product.id}`,
    priceCurrency: 'USD',
    price: product.price,
    itemCondition: 'https://schema.org/NewCondition',
    availability: 'https://schema.org/InStock',
  },
});

export const generateCollectionPageSchema = (title, url) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: title,
  url: url,
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
