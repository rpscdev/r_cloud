import { useEffect } from 'react';

type SeoProps = {
  title: string;
  description: string;
  path?: string;
  keywords?: string;
};

function setMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

export default function Seo({ title, description, path = '/', keywords }: SeoProps) {
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_SITE_URL || 'http://localhost';
    const canonicalUrl = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

    document.title = title;
    setMetaTag('description', description);
    setMetaTag('robots', 'index,follow');
    if (keywords) setMetaTag('keywords', keywords);

    setMetaTag('og:title', title, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:type', 'website', 'property');
    setMetaTag('og:url', canonicalUrl, 'property');
    setMetaTag('twitter:card', 'summary');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);

    setCanonical(canonicalUrl);
  }, [description, keywords, path, title]);

  return null;
}
