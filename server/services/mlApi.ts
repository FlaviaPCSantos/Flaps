/**
 * Serviço para buscar produtos via API pública do Mercado Livre
 * Documentação: https://developers.mercadolibre.com.br/pt_BR/api-docs-pt_BR
 * 
 * MODO MOCK: Enquanto aguarda liberação da API, usa dados temporários para teste
 */

/**
 * MODO MOCK - Ativar quando API do Mercado Livre não está disponível
 * 
 * Para usar a API real do Mercado Livre quando liberada:
 * 1. Altere USE_MOCK_MODE para false
 * 2. Certifique-se de que a API está acessível
 * 3. Execute os testes para validar
 * 
 * Exemplo:
 * const USE_MOCK_MODE = false; // Ativa API real
 */
const USE_MOCK_MODE = false; // API real ativada

export interface MLProduct {
  mlId: string;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  imageUrl: string;
  productUrl: string;
  category?: string;
  description?: string;
  seller?: string;
}

interface MLApiItem {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  thumbnail: string;
  permalink: string;
  category_id?: string;
  condition?: string;
  seller?: {
    nickname: string;
  };
}

interface MLApiResponse {
  results: MLApiItem[];
  paging: {
    total: number;
    offset: number;
    limit: number;
  };
}

/**
 * Busca produtos no Mercado Livre por palavra-chave
 */
export async function searchMLProducts(query: string, limit = 20): Promise<MLProduct[]> {
  try {
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[MLApi] Erro ao buscar produtos: ${response.status}`);
      return [];
    }

    const data: MLApiResponse = await response.json();
    
    return data.results.map(item => ({
      mlId: item.id,
      title: item.title,
      price: item.price,
      originalPrice: item.original_price,
      imageUrl: item.thumbnail,
      productUrl: item.permalink,
      category: item.category_id,
      seller: item.seller?.nickname
    }));
  } catch (error) {
    console.error("[MLApi] Erro ao buscar produtos:", error);
    return [];
  }
}

/**
 * Obtém detalhes de um produto específico do Mercado Livre
 */
export async function getMLProductDetails(mlId: string): Promise<MLProduct | null> {
  try {
    const url = `https://api.mercadolibre.com/items/${mlId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[MLApi] Erro ${response.status}: Forbidden`);
      return null;
    }

    const item = await response.json();
    
    return {
      mlId: item.id,
      title: item.title,
      price: item.price,
      originalPrice: item.original_price,
      imageUrl: item.thumbnail || item.pictures?.[0]?.url,
      productUrl: item.permalink,
      category: item.category_id,
      description: item.description
    };
  } catch (error) {
    console.error("[MLApi] Erro ao obter detalhes do produto:", error);
    return null;
  }
}

/**
 * Expande um link curto do Mercado Livre (meli.la) para obter o ID do produto
 */
export async function expandMeliLink(shortUrl: string): Promise<string | null> {
  try {
    console.log(`[MLApi] Expandindo link curto: ${shortUrl}`);
    
    const response = await fetch(shortUrl, {
      method: "HEAD",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    const expandedUrl = response.url;
    console.log(`[MLApi] URL expandida: ${expandedUrl}`);

    // Verificar se é uma página de afiliado
    if (expandedUrl.includes("/social/") || expandedUrl.includes("matt_")) {
      console.log(`[MLApi] URL eh de pagina de afiliado, tentando extrair ID do HTML`);
      
      // Buscar o HTML para extrair o ID
      const htmlResponse = await fetch(expandedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
      
      if (!htmlResponse.ok) {
        return null;
      }
      
      const html = await htmlResponse.text();
      
      // Procurar por IDs de produtos no HTML
      const idMatches = html.match(/([A-Z]{3}\d{9,})/g);
      if (idMatches) {
        // Filtrar IDs que não são de promoção
        for (const id of idMatches) {
          if (!id.includes("meli+") && !id.toLowerCase().includes("promo")) {
            console.log(`[MLApi] ID extraido do HTML (primeiro valido): ${id}`);
            return id;
          }
        }
        // Se todos forem de promoção, retornar o primeiro
        if (idMatches.length > 0) {
          console.log(`[MLApi] ID extraido do HTML (primeiro valido): ${idMatches[0]}`);
          return idMatches[0];
        }
      }
      
      return null;
    }

    // Extrair ID do URL expandida
    const idMatch = expandedUrl.match(/([A-Z]{3}\d{9,})/);
    if (idMatch) {
      console.log(`[MLApi] ID extraido da URL: ${idMatch[1]}`);
      return idMatch[1];
    }

    return null;
  } catch (error) {
    console.error("[MLApi] Erro ao expandir link curto:", error);
    return null;
  }
}

/**
 * Extrai dados de um link de afiliado do Mercado Livre
 */
export async function extractProductFromAffiliateLink(affiliateUrl: string): Promise<{
  title: string;
  price: number;
  imageUrl: string;
  affiliateLink: string;
  mlId?: string;
} | null> {
  try {
    console.log(`[MLApi] Extraindo dados do link de afiliado: ${affiliateUrl}`);

    // Primeiro, tentar expandir o link e extrair o ID do produto
    let mlId: string | null | undefined;
    
    if (affiliateUrl.includes("meli.la")) {
      // Para links curtos, expandir e extrair o ID
      const expandedId = await expandMeliLink(affiliateUrl);
      if (expandedId) {
        mlId = expandedId;
        console.log(`[MLApi] ID extraido do link expandido: ${mlId}`);
        // Usar a API para obter dados corretos do produto
        const product = await getMLProductDetails(mlId);
        if (product) {
          console.log(`[MLApi] Dados obtidos via API: ${product.title}`);
          return {
            title: product.title,
            price: product.price,
            imageUrl: product.imageUrl,
            affiliateLink: affiliateUrl,
            mlId: product.mlId
          };
        }
      }
    }

    // Fallback: tentar extrair dados do HTML da página
    console.log(`[MLApi] Fallback: tentando extrair dados do HTML`);
    
    const response = await fetch(affiliateUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    if (!response.ok) {
      console.error(`[MLApi] Erro ao buscar página de afiliado: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Extrair título - procurar em várias localizações possíveis
    let titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    if (!titleMatch) {
      titleMatch = html.match(/<title>([^<]+)<\/title>/);
    }
    if (!titleMatch) {
      titleMatch = html.match(/data-product-title="([^"]+)"/);
    }
    if (!titleMatch) {
      // Procurar por meta tags og:title
      titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
    }
    let title = titleMatch ? titleMatch[1].trim() : null;
    
    // Limpar título de caracteres desnecessários
    if (title) {
      title = title.replace(/\s*-\s*Mercado Libre.*$/i, '').trim();
      title = title.replace(/\s*-\s*Mercado Libre.*$/i, '').trim();
    }
    
    // Se ainda não temos título e temos mlId, usar a API
    if (!title && mlId) {
      const apiProduct = await getMLProductDetails(mlId);
      if (apiProduct) {
        title = apiProduct.title;
      }
    }
    
    // Fallback final
    if (!title) {
      title = "Produto";
    }

    // Extrair preço - procurar em várias localizações possíveis
    let priceStr: string | null = null;
    
    // PRIORIDADE 1: Procurar por preço com desconto (padrão: "R$ XX,XX" próximo a "OFF")
    let discountMatch = html.match(/R\$\s*([\d.,]+)\s*[^<]*(?:OFF|desconto|Desconto)/i);
    if (discountMatch) {
      priceStr = discountMatch[1];
      console.log(`[MLApi] Preço com desconto encontrado: ${priceStr}`);
    }
    
    // PRIORIDADE 2: Procurar por preço em tag de preço principal
    if (!priceStr) {
      let match = html.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>\s*R\$\s*([\d.,]+)/i);
      if (match) priceStr = match[1];
    }
    
    // PRIORIDADE 3: Procurar por data-price
    if (!priceStr) {
      let match = html.match(/data-price=["\']?([\d.,]+)/i);
      if (match) priceStr = match[1];
    }
    
    // PRIORIDADE 4: Procurar por padrão: R$ 123,45 (qualquer um)
    if (!priceStr) {
      let match = html.match(/R\$\s*([\d.,]+)/i);
      if (match) priceStr = match[1];
    }
    
    // PRIORIDADE 5: Procurar por price: 123.45
    if (!priceStr) {
      let match = html.match(/price["\']?\s*[=:]\s*["\']?([\d.,]+)/i);
      if (match) priceStr = match[1];
    }
    
    // PRIORIDADE 6: Procurar por "price": 123.45
    if (!priceStr) {
      let match = html.match(/["\']price["\']\s*:\s*([\d.,]+)/i);
      if (match) priceStr = match[1];
    }
    
    // PRIORIDADE 7: Procurar por padrão genérico: números com separadores
    if (!priceStr) {
      let match = html.match(/([\d]{1,3}(?:[\.,][\d]{3})*[\.,][\d]{2})/);
      if (match) priceStr = match[1];
    }
    
    let price = 0;
    if (priceStr) {
      // Normalizar formato brasileiro vs americano
      if (priceStr.includes(',') && priceStr.includes('.')) {
        // Se tem ambos, o último é o separador decimal
        const lastCommaIdx = priceStr.lastIndexOf(',');
        const lastDotIdx = priceStr.lastIndexOf('.');
        if (lastCommaIdx > lastDotIdx) {
          // Formato brasileiro: 1.234,56
          priceStr = priceStr.replace(/\./g, '').replace(',', '.');
        } else {
          // Formato americano: 1,234.56
          priceStr = priceStr.replace(/,/g, '');
        }
      } else if (priceStr.includes(',')) {
        // Apenas vírgula: converter para ponto
        priceStr = priceStr.replace(',', '.');
      }
      
      price = parseFloat(priceStr);
      if (isNaN(price) || price < 0.01) {
        price = 0;
      }
    }

    // Extrair imagem - procurar em várias localizações possíveis
    let imageUrl = "https://via.placeholder.com/300x300?text=Produto";
    
    // PRIORIDADE 1: og:image (meta tag de imagem principal)
    let imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
    if (imageMatch && imageMatch[1]) {
      imageUrl = imageMatch[1];
      console.log(`[MLApi] Imagem extraída via og:image: ${imageUrl.substring(0, 50)}...`);
    }
    
    // PRIORIDADE 2: Procurar por imagem grande (data-src ou src com mlstatic)
    if (imageUrl.includes("placeholder")) {
      imageMatch = html.match(/<img[^>]*(?:data-src|src)="([^"]*mlstatic[^"]*)"/);
      if (imageMatch && imageMatch[1]) {
        imageUrl = imageMatch[1];
        console.log(`[MLApi] Imagem extraída via mlstatic: ${imageUrl.substring(0, 50)}...`);
      }
    }
    
    // PRIORIDADE 3: Procurar por qualquer imagem grande
    if (imageUrl.includes("placeholder")) {
      imageMatch = html.match(/<img[^>]*src="([^"]*\.(jpg|jpeg|png|webp)[^"]*)"/);
      if (imageMatch && imageMatch[1]) {
        imageUrl = imageMatch[1];
        console.log(`[MLApi] Imagem extraída via img tag: ${imageUrl.substring(0, 50)}...`);
      }
    }
    
    // PRIORIDADE 4: Procurar por image em JSON
    if (imageUrl.includes("placeholder")) {
      imageMatch = html.match(/["\']image["\']\s*[=:]\s*["\']([^"]+)["\']/);  
      if (imageMatch && imageMatch[1]) {
        imageUrl = imageMatch[1];
        console.log(`[MLApi] Imagem extraída via JSON: ${imageUrl.substring(0, 50)}...`);
      }
    }

    // Extrair ID do produto se possível
    const idMatch = html.match(/([A-Z]{3}\d{9,})/);
    if (idMatch) {
      mlId = idMatch[1];
    }

    console.log(`[MLApi] Dados extraidos do HTML - Título: ${title}, Preço: ${price}, Imagem: ${imageUrl.substring(0, 50)}...`);

    return {
      title,
      price,
      imageUrl,
      affiliateLink: affiliateUrl,
      mlId: mlId || undefined
    };
  } catch (error) {
    console.error("[MLApi] Erro ao extrair dados do link de afiliado:", error);
    return null;
  }
}
