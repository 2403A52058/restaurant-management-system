import { useEffect } from 'react';

const DEFAULT_TITLE = 'KodiKart — Live Native Hens. Direct from Farms.';
const DEFAULT_DESCRIPTION =
  'Buy live native country hens directly from verified local farms. Farm-fresh, doorstep delivery. మన నాటి కోళ్లు – మన నమ్మకం.';
const DEFAULT_URL = 'https://kodikart.pages.dev/';
const DEFAULT_IMAGE = 'https://kodikart.pages.dev/icons/icon-512.png';

/**
 * SEOHead — dynamically updates <head> meta tags for each page.
 *
 * Usage:
 *   <SEOHead
 *     title="Browse Farms | KodiKart"
 *     description="Find verified native hen farms near you."
 *     canonicalUrl="https://kodikart.pages.dev/farms"
 *     ogImage="https://kodikart.pages.dev/og/farms.jpg"
 *   />
 *
 * Props are all optional — sensible KodiKart defaults are applied.
 * Cleans up (restores defaults) on unmount.
 */
function SEOHead({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonicalUrl = DEFAULT_URL,
  ogImage = DEFAULT_IMAGE,
}) {
  useEffect(() => {
    // ── Title ────────────────────────────────────────────────────────────
    const prevTitle = document.title;
    document.title = title;

    // ── Helper: upsert a <meta> tag ──────────────────────────────────────
    function setMeta(selector, attr, value) {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [attrName, attrValue] = attr.split('=');
        el.setAttribute(attrName.trim(), attrValue.replace(/"/g, '').trim());
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
      return el;
    }

    // ── Helper: upsert a <link> tag ──────────────────────────────────────
    function setLink(rel, href) {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
      return el;
    }

    // ── Description ──────────────────────────────────────────────────────
    setMeta('meta[name="description"]', 'name="description"', description);

    // ── Open Graph ───────────────────────────────────────────────────────
    setMeta('meta[property="og:title"]', 'property="og:title"', title);
    setMeta('meta[property="og:description"]', 'property="og:description"', description);
    setMeta('meta[property="og:url"]', 'property="og:url"', canonicalUrl);
    setMeta('meta[property="og:image"]', 'property="og:image"', ogImage);

    // ── Twitter Card ─────────────────────────────────────────────────────
    setMeta('meta[name="twitter:title"]', 'name="twitter:title"', title);
    setMeta('meta[name="twitter:description"]', 'name="twitter:description"', description);
    setMeta('meta[name="twitter:image"]', 'name="twitter:image"', ogImage);

    // ── Canonical ────────────────────────────────────────────────────────
    setLink('canonical', canonicalUrl);

    // ── Cleanup: restore previous values on unmount ───────────────────────
    return () => {
      document.title = prevTitle;
      setMeta('meta[name="description"]', 'name="description"', DEFAULT_DESCRIPTION);
      setMeta('meta[property="og:title"]', 'property="og:title"', DEFAULT_TITLE);
      setMeta('meta[property="og:description"]', 'property="og:description"', DEFAULT_DESCRIPTION);
      setMeta('meta[property="og:url"]', 'property="og:url"', DEFAULT_URL);
      setMeta('meta[property="og:image"]', 'property="og:image"', DEFAULT_IMAGE);
      setMeta('meta[name="twitter:title"]', 'name="twitter:title"', DEFAULT_TITLE);
      setMeta('meta[name="twitter:description"]', 'name="twitter:description"', DEFAULT_DESCRIPTION);
      setMeta('meta[name="twitter:image"]', 'name="twitter:image"', DEFAULT_IMAGE);
      setLink('canonical', DEFAULT_URL);
    };
  }, [title, description, canonicalUrl, ogImage]);

  // This component renders nothing — it only manages <head>
  return null;
}

export default SEOHead;
