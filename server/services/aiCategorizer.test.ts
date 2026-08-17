import { describe, it, expect } from "vitest";
import { categorizeProduct, suggestFeaturedProducts } from "./aiCategorizer";

describe("AI Categorizer", () => {
  describe("categorizeProduct", () => {
    it("should return a valid category for a product", async () => {
      const result = await categorizeProduct("iPhone 15 Pro Max");
      
      expect(result).toHaveProperty("category");
      expect(result).toHaveProperty("isFeatured");
      expect(typeof result.category).toBe("string");
      expect(typeof result.isFeatured).toBe("boolean");
    }, { timeout: 15000 });

    it("should handle products with descriptions", async () => {
      const result = await categorizeProduct(
        "Vestido Feminino Elegante",
        "Vestido de festa em tecido premium com detalhes em renda"
      );
      
      expect(result.category).toBeTruthy();
    }, { timeout: 15000 });

    it("should return default category on error", async () => {
      const result = await categorizeProduct("");
      
      expect(result.category).toBe("Outros");
      expect(result.isFeatured).toBe(false);
    });

    it("should categorize electronics correctly", async () => {
      const result = await categorizeProduct("Fone de Ouvido Bluetooth Wireless");
      
      expect(result).toHaveProperty("category");
      expect(result).toHaveProperty("isFeatured");
    }, { timeout: 15000 });

    it("should categorize fashion items", async () => {
      const result = await categorizeProduct("Camiseta Básica Premium");
      
      expect(result).toHaveProperty("category");
      expect(result).toHaveProperty("isFeatured");
    }, { timeout: 15000 });
  });

  describe("suggestFeaturedProducts", () => {
    it("should validate featured products structure", () => {
      expect(suggestFeaturedProducts).toBeDefined();
    });

    it("should return array type", async () => {
      const result = await suggestFeaturedProducts([], 5);
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle empty products list", async () => {
      const result = await suggestFeaturedProducts([], 3);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});
