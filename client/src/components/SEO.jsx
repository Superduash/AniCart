import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import {
  generateMeta,
  generateCanonical,
  generateOpenGraph,
  generateTwitterCard,
} from '../utils/seoUtils';

const SEO = ({
  title,
  description,
  keywords,
  image,
  type = 'website',
  robots = 'index,follow',
  schemas = [], // Array of schema objects
}) => {
  const location = useLocation();
  const url = `${window.location.origin}${location.pathname}`;

  const meta = generateMeta({ title, description, keywords });
  const canonical = generateCanonical(location.pathname);
  const og = generateOpenGraph({ title, description, image, url, type });
  const twitter = generateTwitterCard({ title, description, image });

  return (
    <Helmet>
      {/* Basic HTML Meta Tags */}
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="keywords" content={meta.keywords} />
      <link rel="canonical" href={canonical} />

      {/* Robots Tag */}
      <meta name="robots" content={robots} />

      {/* OpenGraph Tags */}
      {Object.entries(og).map(([property, content]) => (
        <meta key={property} property={property} content={content} />
      ))}

      {/* Twitter Card Tags */}
      {Object.entries(twitter).map(([name, content]) => (
        <meta key={name} name={name} content={content} />
      ))}

      {/* JSON-LD Schemas */}
      {schemas && schemas.length > 0 && schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
