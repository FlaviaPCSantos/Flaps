import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  searchProductsML,
  getProductDetailML,
  isValidMLUrl,
  extractMLId,
} from "./mercadoLivre";

// Mock fetch
global.fetch = vi.fn();

describe("Mercado Livre Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchProductsML", () => {
    it("should return an array of products from search", async () => {
      const mockResponse = {
        results: [
          {
            id: "MLB123456789",
            title: "Product 1",
            price: 100,
            thumbnail: "https://example.com/img1.jpg",
            permalink: "https://mercadolivre.com.br/product1",
          },
          {
            id: "MLB987654321",
            title: "Product 2",
            price: 200,
            thumbnail: "https://example.com/img2.jpg",
            permalink: "https://mercadolivre.com.br/product2",
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchProductsML("test query");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        mlId: "MLB123456789",
        title: "Product 1",
        price: 100,
        imageUrl: "https://example.com/img1.jpg",
        affiliateLink: "https://mercadolivre.com.br/product1",
      });
    });

    it("should handle API errors gracefully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await searchProductsML("test query");

      expect(result).toEqual([]);
    });

    it("should handle network errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const result = await searchProductsML("test query");

      expect(result).toEqual([]);
    });
  });

  describe("getProductDetailML", () => {
    it("should return product details", async () => {
      const mockResponse = {
        id: "MLB123456789",
        title: "Detailed Product",
        price: 150,
        pictures: [
          {
            url: "https://example.com/detail1.jpg",
            secure_url: "https://example.com/detail1-secure.jpg",
          },
        ],
        description: {
          plain_text: "This is a detailed description",
        },
        permalink: "https://mercadolivre.com.br/detailed-product",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getProductDetailML("MLB123456789");

      expect(result).toEqual({
        mlId: "MLB123456789",
        title: "Detailed Product",
        price: 150,
        imageUrl: "https://example.com/detail1-secure.jpg",
        description: "This is a detailed description",
        affiliateLink: "https://mercadolivre.com.br/detailed-product",
      });
    });

    it("should handle missing pictures", async () => {
      const mockResponse = {
        id: "MLB123456789",
        title: "Product without pictures",
        price: 100,
        pictures: [],
        permalink: "https://mercadolivre.com.br/product",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getProductDetailML("MLB123456789");

      expect(result?.imageUrl).toBe("");
    });

    it("should return null on API error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await getProductDetailML("INVALID_ID");

      expect(result).toBeNull();
    });
  });

  describe("isValidMLUrl", () => {
    it("should validate ML URLs", () => {
      expect(isValidMLUrl("https://www.mercadolivre.com.br/produto")).toBe(true);
      expect(isValidMLUrl("https://www.mercadolibre.com/producto")).toBe(true);
      expect(isValidMLUrl("MLB123456789")).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(isValidMLUrl("https://example.com")).toBe(false);
      expect(isValidMLUrl("invalid-url")).toBe(false);
    });
  });

  describe("extractMLId", () => {
    it("should extract ML ID from URL", () => {
      const url = "https://www.mercadolivre.com.br/produto-MLB123456789-descricao";
      expect(extractMLId(url)).toBe("MLB123456789");
    });

    it("should return ID if already in ID format", () => {
      expect(extractMLId("MLB123456789")).toBe("MLB123456789");
    });

    it("should return null for invalid input", () => {
      expect(extractMLId("https://example.com")).toBeNull();
      expect(extractMLId("invalid")).toBeNull();
    });
  });
});
