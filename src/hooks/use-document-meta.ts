import { useEffect } from "react";

interface DocumentMeta {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
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
    setMetaTag("twitter:title", ogTitle);
    setMetaTag("twitter:description", ogDesc);
    if (meta.description) setMetaTag("description", meta.description);
    if (meta.ogImage) {
      setMetaTag("og:image", meta.ogImage);
      setMetaTag("twitter:image", meta.ogImage);
    }
    if (meta.ogType) setMetaTag("og:type", meta.ogType);

    return () => {
      document.title = prevTitle;
      setMetaTag("og:title", defaults.title);
      setMetaTag("og:description", defaults.description);
      setMetaTag("twitter:title", defaults.title);
      setMetaTag("twitter:description", defaults.description);
      setMetaTag("description", defaults.description);
    };
  }, [meta.title, meta.description, meta.ogTitle, meta.ogDescription, meta.ogImage, meta.ogType]);
};
