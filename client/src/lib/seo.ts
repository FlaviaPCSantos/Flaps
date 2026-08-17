/**
 * SEO Configuration and Meta Tag Management
 * Handles dynamic meta tags, structured data, and SEO optimization
 */

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
}

const DEFAULT_IMAGE = "https://flaps.manus.space/og-image.jpg";
const SITE_URL = "https://flaps.manus.space";
const SITE_NAME = "Flaps";

/**
 * Update document meta tags dynamically
 */
export function updateMetaTags(config: SEOConfig) {
  // Title
  document.title = config.title;
  updateMetaTag("og:title", config.title);
  updateMetaTag("twitter:title", config.title);

  // Description
  updateMetaTag("description", config.description);
  updateMetaTag("og:description", config.description);
  updateMetaTag("twitter:description", config.description);

  // Keywords
  if (config.keywords?.length) {
    updateMetaTag("keywords", config.keywords.join(", "));
  }

  // Image
  const image = config.image || DEFAULT_IMAGE;
  updateMetaTag("og:image", image);
  updateMetaTag("twitter:image", image);

  // URL
  const url = config.url || SITE_URL;
  updateMetaTag("og:url", url);
  updateCanonical(url);

  // Type
  if (config.type) {
    updateMetaTag("og:type", config.type);
  }

  // Author
  if (config.author) {
    updateMetaTag("author", config.author);
  }

  // Dates
  if (config.publishedDate) {
    updateMetaTag("article:published_time", config.publishedDate);
  }
  if (config.modifiedDate) {
    updateMetaTag("article:modified_time", config.modifiedDate);
  }
}

/**
 * Update or create a meta tag
 */
function updateMetaTag(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  
  if (!tag) {
    tag = document.createElement("meta");
    const isProperty = name.includes("og:") || name.includes("article:");
    if (isProperty) {
      tag.setAttribute("property", name);
    } else {
      tag.setAttribute("name", name);
    }
    document.head.appendChild(tag);
  }
  
  tag.setAttribute("content", content);
}

/**
 * Update canonical URL
 */
function updateCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]');
  
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  
  link.setAttribute("href", url);
}

/**
 * Generate structured data (Schema.org JSON-LD)
 */
export function generateStructuredData(type: "Organization" | "Product" | "BreadcrumbList", data: any) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

/**
 * Organization Schema
 */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": SITE_NAME,
  "url": SITE_URL,
  "logo": `${SITE_URL}/logo.png`,
  "description": "Vitrine elegante de produtos afiliados do Mercado Livre",
  "sameAs": [
    "https://instagram.com/flaps",
    "https://pinterest.com/flaps",
    "https://tiktok.com/@flaps"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "url": SITE_URL
  }
};

/**
 * Product Schema
 */
export function productSchema(product: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "description": product.description || product.title,
    "image": product.imageUrl,
    "brand": {
      "@type": "Brand",
      "name": "Mercado Livre"
    },
    "offers": {
      "@type": "Offer",
      "url": product.affiliateLink,
      "priceCurrency": "BRL",
      "availability": "https://schema.org/InStock"
    }
  };
}

/**
 * Breadcrumb Schema
 */
export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

/**
 * SEO Configuration for each page
 */
export const pageConfigs: Record<string, SEOConfig> = {
  home: {
    title: "Flaps - Vitrine de Produtos Afiliados do Mercado Livre",
    description: "Descubra uma curadoria elegante de produtos afiliados do Mercado Livre. Sofisticação e qualidade em cada seleção. Roupas, calçados, acessórios e muito mais.",
    keywords: ["produtos afiliados", "Mercado Livre", "moda feminina", "roupas", "calçados", "acessórios"],
    url: SITE_URL,
    type: "website"
  },
  novidades: {
    title: "Novidades - Flaps | Produtos Recém-Adicionados",
    description: "Confira os produtos mais recentes adicionados à vitrine Flaps. Sempre atualizando com as melhores seleções do Mercado Livre.",
    keywords: ["produtos novos", "lançamentos", "Mercado Livre", "moda"],
    url: `${SITE_URL}/novidades`,
    type: "website"
  },
  sobre: {
    title: "Sobre Flaps - Vitrine de Produtos Afiliados",
    description: "Conheça a história e a missão do Flaps. Uma vitrine elegante de produtos afiliados do Mercado Livre com curadoria cuidadosa e design sofisticado.",
    keywords: ["sobre", "Flaps", "missão", "valores"],
    url: `${SITE_URL}/sobre`,
    type: "website"
  }
};
