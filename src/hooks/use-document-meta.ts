import { useEffect } from "react";

interface DocumentMeta {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  keywords?: string;
  jsonLd?: Record<string, unknown>;
}

const setMetaTag = (property: string, content: string) => {
  let el = document.querySelector(`meta[property="${property}"]`) ||
           document.querySelector(`meta[name="${property}"]`);
  if (el) {
    el.setAttribute("content", content);
  } else {
    el = document.createElement("meta");
    if (property.startsWith("og:") || property.startsWith("twitter:")) {
      el.setAttribute("property", property);
    } else {
      el.setAttribute("name", property);
    }
    el.setAttribute("content", content);
    document.head.appendChild(el);
  }
};

const setCanonical = (url: string) => {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (el) {
    el.href = url;
  } else {
    el = document.createElement("link");
    el.rel = "canonical";
    el.href = url;
    document.head.appendChild(el);
  }
};

const removeCanonical = () => {
  document.querySelector('link[rel="canonical"]')?.remove();
};

const setJsonLd = (data: Record<string, unknown>) => {
  let el = document.querySelector('script[data-meta-jsonld]') as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-meta-jsonld", "true");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
};

const removeJsonLd = () => {
  document.querySelector('script[data-meta-jsonld]')?.remove();
};

const defaults = {
  title: "Sudagospel - South Sudan's Gospel Music Platform",
  description: "Discover, stream and download the best gospel music from South Sudan.",
};

export const useDocumentMeta = (meta: DocumentMeta) => {
  useEffect(() => {
    const prevTitle = document.title;

    if (meta.title) {
      document.title = `${meta.title} | Sudagospel`;
    }

    const ogTitle = meta.ogTitle || meta.title || defaults.title;
    const ogDesc = meta.ogDescription || meta.description || defaults.description;

    setMetaTag("og:title", ogTitle);
    setMetaTag("og:description", ogDesc);
    setMetaTag("og:url", meta.canonicalUrl || window.location.href);
    setMetaTag("twitter:title", ogTitle);
    setMetaTag("twitter:description", ogDesc);
    setMetaTag("twitter:card", meta.ogImage ? "summary_large_image" : "summary");
    if (meta.description) setMetaTag("description", meta.description);
    if (meta.keywords) setMetaTag("keywords", meta.keywords);
    if (meta.ogImage) {
      setMetaTag("og:image", meta.ogImage);
      setMetaTag("twitter:image", meta.ogImage);
    }
    if (meta.ogType) setMetaTag("og:type", meta.ogType);
    if (meta.canonicalUrl) setCanonical(meta.canonicalUrl);
    if (meta.jsonLd) setJsonLd(meta.jsonLd);

    return () => {
      document.title = prevTitle;
      setMetaTag("og:title", defaults.title);
      setMetaTag("og:description", defaults.description);
      setMetaTag("twitter:title", defaults.title);
      setMetaTag("twitter:description", defaults.description);
      setMetaTag("description", defaults.description);
      removeCanonical();
      removeJsonLd();
    };
  }, [meta.title, meta.description, meta.ogTitle, meta.ogDescription, meta.ogImage, meta.ogType, meta.canonicalUrl, meta.keywords, meta.jsonLd]);
};
