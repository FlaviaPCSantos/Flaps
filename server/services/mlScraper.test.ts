import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { extractMLId, parsePrice } from "./mlScraper";

describe("MLScraper Utilities", () => {
  describe("extractMLId", () => {
    it("deve extrair ID de URL com /p/", () => {
      const url = "https://www.mercadolivre.com.br/p/MLB62320463";
      const id = extractMLId(url);
      expect(id).toBe("MLB62320463");
    });

    it("deve extrair ID de URL com parâmetros", () => {
      const url = "https://www.mercadolivre.com.br/poltrona-cadeira/p/MLB62320463?param=value";
      const id = extractMLId(url);
      expect(id).toBe("MLB62320463");
    });

    it("deve retornar string vazia para URL inválida", () => {
      const url = "https://www.mercadolivre.com.br/search?q=produto";
      const id = extractMLId(url);
      expect(id).toBe("");
    });

    it("deve extrair ID de formato alternativo", () => {
      const url = "MLB62320463";
      const id = extractMLId(url);
      expect(id).toBe("MLB62320463");
    });
  });

  describe("parsePrice", () => {
    it("deve fazer parse de preço com vírgula", () => {
      const price = parsePrice("R$ 100,50");
      expect(price).toBe(100.5);
    });

    it("deve fazer parse de preço com ponto", () => {
      const price = parsePrice("R$1.234,56");
      expect(price).toBe(1234.56);
    });

    it("deve fazer parse de preço sem formatação", () => {
      const price = parsePrice("100,00");
      expect(price).toBe(100);
    });

    it("deve retornar 0 para string inválida", () => {
      const price = parsePrice("abc");
      expect(price).toBe(0);
    });

    it("deve fazer parse de preço com espaços", () => {
      const price = parsePrice("R$ 50,00");
      expect(price).toBe(50);
    });
  });
});

// Mock functions para testes sem fazer requisições reais
export function extractMLId(url: string): string {
  const match = url.match(/\/p\/(MLB\d+)/);
  if (match) return match[1];

  const match2 = url.match(/MLB(\d+)/);
  if (match2) return `MLB${match2[1]}`;

  return "";
}

export function parsePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[^\d,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}
