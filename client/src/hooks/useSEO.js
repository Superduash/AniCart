import { useEffect } from 'react';

export function useSEO({ title, description, image, url, type = 'website', jsonLd = null }) {
  useEffect(() => {
    // Basic title
    const prevTitle = document.title;
    if (title) {
      document.title = title.includes('AniCart') ? title : `${title} — AniCart`;
    }

    // Helper to set or create meta tags
    const setMetaTag = (selector, attribute, value) => {
      if (!value) return null;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (selector.startsWith('meta[name=')) {
          el.setAttribute('name', selector.match(/name="([^"]+)"/)[1]);
        } else if (selector.startsWith('meta[property=')) {
          el.setAttribute('property', selector.match(/property="([^"]+)"/)[1]);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
      return el;
    };

    const tags = [
      setMetaTag('meta[name="description"]', 'content', description),
      setMetaTag('meta[property="og:title"]', 'content', title),
      setMetaTag('meta[property="og:description"]', 'content', description),
      setMetaTag('meta[property="og:image"]', 'content', image),
      setMetaTag('meta[property="og:url"]', 'content', url || window.location.href),
      setMetaTag('meta[property="og:type"]', 'content', type),
      setMetaTag('meta[name="twitter:card"]', 'content', image ? 'summary_large_image' : 'summary'),
      setMetaTag('meta[name="twitter:title"]', 'content', title),
      setMetaTag('meta[name="twitter:description"]', 'content', description),
      setMetaTag('meta[name="twitter:image"]', 'content', image),
    ].filter(Boolean);

    // JSON-LD Structured Data
    let scriptEl = null;
    if (jsonLd) {
      scriptEl = document.querySelector('script[type="application/ld+json"][data-seo]');
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.type = 'application/ld+json';
        scriptEl.setAttribute('data-seo', 'true');
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(jsonLd);
    }

    return () => {
      document.title = prevTitle;
      tags.forEach(tag => tag && tag.remove());
      if (scriptEl) scriptEl.remove();
    };
  }, [title, description, image, url, type, jsonLd]);
}
