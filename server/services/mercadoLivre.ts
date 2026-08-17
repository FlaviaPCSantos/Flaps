/**
 * Mercado Livre API Service
 * Integrates with the public Mercado Livre API to search and fetch product data
 */

const ML_API_BASE = "https://api.mercadolibre.com";
const ML_SITE_ID = "MLB"; // Brazil site ID

interface MLSearchItem {
  id: string;
  title: string;
  price: number;
  thumbnail: string;
  permalink: string;
  seller?: {
    id: number;
  };
}

interface MLItemDetail {
  id: string;
  title: string;
  price: number;
  pictures: Array<{
    url: string;
    secure_url: string;
  }>;
  description?: {
    plain_text?: string;
  };
  permalink: string;
}

export interface MLProduct {
  mlId: string;
  title: string;
  price: number;
  imageUrl: string;
  description?: string;
  affiliateLink: string;
}

/**
 * Search for products in Mercado Livre by keyword
 */
export async function searchProductsML(
  query: string,
  limit: number = 20
): Promise<MLProduct[]> {
  try {
    const searchUrl = `${ML_API_BASE}/sites/${ML_SITE_ID}/search?q=${encodeURIComponent(
      query
    )}&limit=${limit}`;

    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error(`ML API error: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as {
      results?: MLSearchItem[];
    };
    const results = data.results || [];

    return results.map((item) => ({
      mlId: item.id,
      title: item.title,
      price: item.price,
      imageUrl: item.thumbnail,
      affiliateLink: item.permalink,
    }));
  } catch (error) {
    console.error("Error searching ML products:", error);
    return [];
  }
}

/**
 * Get detailed information about a specific product
 */
export async function getProductDetailML(mlId: string): Promise<MLProduct | null> {
  try {
    const itemUrl = `${ML_API_BASE}/items/${mlId}`;
    const response = await fetch(itemUrl);

    if (!response.ok) {
      console.error(`ML API error: ${response.status}`);
      return null;
    }

    const item = (await response.json()) as MLItemDetail;

    const imageUrl =
      item.pictures && item.pictures.length > 0
        ? item.pictures[0].secure_url || item.pictures[0].url
        : "";

    return {
      mlId: item.id,
      title: item.title,
      price: item.price,
      imageUrl,
      description: item.description?.plain_text,
      affiliateLink: item.permalink,
    };
  } catch (error) {
    console.error("Error fetching ML product detail:", error);
    return null;
  }
}

/**
 * Get product by ML ID (with caching consideration)
 */
export async function getProductByMLId(mlId: string): Promise<MLProduct | null> {
  return getProductDetailML(mlId);
}

/**
 * Validate if a string is a valid Mercado Livre product URL or ID
 */
export function isValidMLUrl(url: string): boolean {
  // Check if it's a valid ML URL
  if (url.includes("mercadolivre.com.br") || url.includes("mercadolibre.com")) {
    return true;
  }
  // Check if it looks like a ML ID (usually starts with MLB and numbers)
  if (/^MLB\d+$/.test(url)) {
    return true;
  }
  return false;
}

/**
 * Extract ML ID from URL or return the ID if it's already an ID
 */
export function extractMLId(urlOrId: string): string | null {
  // If it's already an ID format
  if (/^MLB\d+$/.test(urlOrId)) {
    return urlOrId;
  }

  // Try to extract from URL
  const match = urlOrId.match(/MLB(\d+)/);
  if (match) {
    return `MLB${match[1]}`;
  }

  return null;
}
