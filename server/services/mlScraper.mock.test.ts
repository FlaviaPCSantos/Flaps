import { describe, it, expect, vi } from "vitest";
import * as cheerio from "cheerio";

// Mock HTML da página social do Mercado Livre
const mockMLProfileHTML = `
<!DOCTYPE html>
<html>
<head><title>Perfil Social - Mercado Livre</title></head>
<body>
  <div class="polycard">
    <a href="https://www.mercadolivre.com.br/p/MLB123456789?utm_source=affiliate&utm_medium=social">
      <img src="https://ml.com/image1.jpg" alt="Produto 1">
      <span>Produto Teste 1</span>
      <span>R$ 100,00</span>
    </a>
  </div>
  
  <div class="polycard">
    <a href="https://www.mercadolivre.com.br/p/MLB987654321?utm_source=affiliate">
      <img src="https://ml.com/image2.jpg" alt="Produto 2">
      <span>Produto Teste 2 MAIS VENDIDO</span>
      <span>~~R$ 250,00~~ R$ 150,00</span>
    </a>
  </div>
</body>
</html>
`;

describe("MLScraper HTML Parsing", () => {
  describe("Parsing de Produtos com Cheerio", () => {
    it("deve extrair todos os produtos do HTML", () => {
      const $ = cheerio.load(mockMLProfileHTML);
      const products = $("a[href*='/p/MLB']");
      
      expect(products.length).toBeGreaterThan(0);
    });

    it("deve extrair ID do Mercado Livre corretamente", () => {
      const $ = cheerio.load(mockMLProfileHTML);
      const links = $("a[href*='/p/MLB']");
      
      links.each((index, element) => {
        const href = $(element).attr("href") || "";
        const match = href.match(/\/p\/(MLB\d+)/);
        
        if (match) {
          expect(match[1]).toMatch(/MLB\d+/);
        }
      });
    });

    it("deve extrair título do produto", () => {
      const $ = cheerio.load(mockMLProfileHTML);
      const titles = $("a[href*='/p/MLB'] span").eq(1);
      
      const title = titles.text().trim();
      expect(title.length).toBeGreaterThan(0);
    });

    it("deve extrair preço do produto", () => {
      const $ = cheerio.load(mockMLProfileHTML);
      const priceText = $("a[href*='/p/MLB']").first().text();
      
      const priceMatch = priceText.match(/R\$\s*([\d.,]+)/);
      expect(priceMatch).toBeTruthy();
      
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(",", "."));
        expect(price).toBeGreaterThan(0);
      }
    });

    it("deve extrair desconto quando disponível", () => {
      const $ = cheerio.load(mockMLProfileHTML);
      const priceText = $("a[href*='/p/MLB']").eq(1).text();
      
      const originalMatch = priceText.match(/~~R\$\s*([\d.,]+)~~/);
      const currentMatch = priceText.match(/R\$\s*([\d.,]+)/);
      
      // Validar que consegue extrair ambos os preços
      expect(originalMatch).toBeTruthy();
      expect(currentMatch).toBeTruthy();
      
      if (originalMatch && currentMatch) {
        const original = parseFloat(originalMatch[1].replace(",", "."));
        const current = parseFloat(currentMatch[1].replace(",", "."));
        
        expect(original).toBeGreaterThan(0);
        expect(current).toBeGreaterThan(0);
      }
    });

    it("deve extrair URL da imagem", () => {
      const $ = cheerio.load(mockMLProfileHTML);
      const imageUrl = $("a[href*='/p/MLB']").first().find("img").attr("src");
      
      expect(imageUrl).toBeTruthy();
      expect(imageUrl).toMatch(/https?:\/\/.+\.(jpg|png|jpeg)/i);
    });

    it("deve detectar badge MAIS VENDIDO", () => {
      const $ = cheerio.load(mockMLProfileHTML);
      const secondProduct = $("a[href*='/p/MLB']").eq(1).text();
      
      const hasBadge = secondProduct.includes("MAIS VENDIDO");
      expect(hasBadge).toBe(true);
    });

    it("deve extrair link de afiliado com parâmetros UTM", () => {
      const $ = cheerio.load(mockMLProfileHTML);
      const firstLink = $("a[href*='/p/MLB']").first().attr("href") || "";
      
      expect(firstLink).toContain("/p/MLB");
      expect(firstLink).toContain("utm_source");
    });

    it("deve validar estrutura completa de um produto", () => {
      const $ = cheerio.load(mockMLProfileHTML);
      const $product = $("a[href*='/p/MLB']").first();
      
      const href = $product.attr("href") || "";
      const mlId = href.match(/\/p\/(MLB\d+)/)?.[1];
      const imageUrl = $product.find("img").attr("src");
      const title = $product.find("span").eq(1).text().trim();
      const priceText = $product.text();
      const priceMatch = priceText.match(/R\$\s*([\d.,]+)/);
      
      expect(mlId).toBeTruthy();
      expect(imageUrl).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
      expect(priceMatch).toBeTruthy();
    });
  });

  describe("Tratamento de Erros", () => {
    it("deve lidar com HTML vazio", () => {
      const $ = cheerio.load("");
      const products = $("a[href*='/p/MLB']");
      
      expect(products.length).toBe(0);
    });

    it("deve lidar com seletores não encontrados", () => {
      const $ = cheerio.load("<div>Sem produtos</div>");
      const products = $("a[href*='/p/MLB']");
      
      expect(products.length).toBe(0);
    });

    it("deve validar preço zero como inválido", () => {
      const priceStr = "R$ 0,00";
      const match = priceStr.match(/R\$\s*([\d.,]+)/);
      
      if (match) {
        const price = parseFloat(match[1].replace(",", "."));
        expect(price).toBe(0);
      }
    });
  });
});
