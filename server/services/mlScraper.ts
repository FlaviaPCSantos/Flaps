import puppeteer, { Browser, Page } from "puppeteer";
import * as cheerio from "cheerio";

export interface MLProduct {
  mlId: string;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  imageUrl: string;
  productUrl: string;
  category?: string;
  isMostSold?: boolean;
  badge?: string;
  description?: string;
}

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * Extrai o ID do Mercado Livre de uma URL
 */
function extractMLId(url: string): string {
  const match = url.match(/\/p\/(MLB\d+)/);
  if (match) return match[1];

  const match2 = url.match(/MLB(\d+)/);
  if (match2) return `MLB${match2[1]}`;

  return "";
}

/**
 * Extrai o preço de uma string (ex: "R$100,00" ou "R$ 100,00")
 */
function parsePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[^\d,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

/**
 * Scrapa a página de perfil social do Mercado Livre
 */
export async function scrapeMLAffiliateProfile(
  profileUrl: string
): Promise<MLProduct[]> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Configurar timeout e user agent
    page.setDefaultTimeout(30000);
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    );

    console.log(`[MLScraper] Acessando ${profileUrl}`);
    await page.goto(profileUrl, { waitUntil: "networkidle2" });

    // Aguardar carregamento dos produtos
    await page.waitForSelector("a[href*='/p/MLB']", { timeout: 10000 }).catch(() => {
      console.warn("[MLScraper] Produtos não encontrados, continuando...");
    });

    // Extrair HTML da página
    const html = await page.content();
    const $ = cheerio.load(html);

    const products: MLProduct[] = [];

    // Seletor para cada card de produto
    $("a[href*='/p/MLB']").each((index: number, element: any) => {
      try {
        const $card = $(element);
        const href = $card.attr("href") || "";

        // Extrair ID do produto
        const mlId = extractMLId(href);
        if (!mlId) return;

        // Extrair título
        const title = $card.text().trim();
        if (!title) return;

        // Extrair preço (procurar em elementos próximos)
        const $parent = $card.closest("[class*='polycard']") || $card.parent();
        const priceText = $parent.text();

        // Extrair preço com desconto
        const priceMatch = priceText.match(/R\$\s*([\d.,]+)/);
        const price = priceMatch ? parsePrice(priceMatch[1]) : 0;

        // Extrair preço original
        const originalMatch = priceText.match(/~~R\$\s*([\d.,]+)~~/);
        const originalPrice = originalMatch ? parsePrice(originalMatch[1]) : undefined;

        // Calcular desconto
        const discount = originalPrice && price ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined;

        // Extrair imagem
        const $img = $card.find("img").first();
        const imageUrl = $img.attr("src") || $img.attr("data-src") || "";

        // Verificar badges
        const isMostSold = priceText.includes("MAIS VENDIDO");
        const badge = isMostSold ? "MAIS VENDIDO" : undefined;

        if (price > 0 && title) {
          products.push({
            mlId,
            title,
            price,
            originalPrice,
            discount,
            imageUrl,
            productUrl: href,
            isMostSold,
            badge,
          });
        }
      } catch (error) {
        console.error("[MLScraper] Erro ao processar produto:", error);
      }
    });

    console.log(`[MLScraper] ${products.length} produtos extraídos`);
    return products;
  } catch (error) {
    console.error("[MLScraper] Erro ao scraper perfil:", error);
    throw error;
  } finally {
    await page.close();
  }
}

/**
 * Busca detalhes de um produto específico no Mercado Livre
 */
export async function getMLProductDetails(mlId: string): Promise<MLProduct | null> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const productUrl = `https://www.mercadolivre.com.br/p/${mlId}`;
    page.setDefaultTimeout(15000);
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    );

    console.log(`[MLScraper] Buscando detalhes de ${mlId}`);
    await page.goto(productUrl, { waitUntil: "networkidle2" });

    const html = await page.content();
    const $ = cheerio.load(html);

    // Extrair informações
    const title = $("h1").first().text().trim() || "";
    const priceText = $("[class*='price']").first().text() || "";
    const price = parsePrice(priceText);
    const imageUrl = $("img[alt*='Imagem']").first().attr("src") || "";
    const description = $("[class*='description']").text().substring(0, 500) || "";

    if (!title || price === 0) {
      return null;
    }

    return {
      mlId,
      title,
      price,
      imageUrl,
      productUrl,
      description,
    };
  } catch (error) {
    console.error(`[MLScraper] Erro ao buscar detalhes de ${mlId}:`, error);
    return null;
  } finally {
    await page.close();
  }
}
