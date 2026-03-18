import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  ogImage?: string;
  path?: string;
  jsonLd?: Record<string, unknown>;
}

const BASE_URL = 'https://learnflow.ai';

export function SEO({
  title,
  description,
  ogImage = '/og-image.png',
  path = '',
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    const fullTitle = `${title} | LearnFlow`;
    const fullUrl = `${BASE_URL}${path}`;

    document.title = fullTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', fullUrl);
    setMeta('property', 'og:image', `${BASE_URL}${ogImage}`);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', `${BASE_URL}${ogImage}`);

    // JSON-LD structured data
    const existingLd = document.querySelector('script[data-seo-jsonld]');
    if (existingLd) existingLd.remove();

    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.textContent = JSON.stringify({ '@context': 'https://schema.org', ...jsonLd });
      document.head.appendChild(script);
    }

    return () => {
      const el = document.querySelector('script[data-seo-jsonld]');
      if (el) el.remove();
    };
  }, [title, description, ogImage, path, jsonLd]);

  return null;
}
