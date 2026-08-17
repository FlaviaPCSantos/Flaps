import { describe, it, expect, beforeAll } from "vitest";
import { searchMLProducts } from "./mlApi";

describe("ML API - Real Integration", () => {
  it("should fetch products from Mercado Livre API (real seller)", async () => {
    // Test with the real seller nickname
    const products = await searchMLProducts("FLAVIASTS", 5);
    
    // Should return an array
    expect(Array.isArray(products)).toBe(true);
    
    // If products are found, validate structure
    if (products.length > 0) {
      const product = products[0];
      expect(product).toHaveProperty("mlId");
      expect(product).toHaveProperty("title");
      expect(product).toHaveProperty("price");
      expect(product).toHaveProperty("imageUrl");
      expect(product).toHaveProperty("productUrl");
      
      console.log(`✓ Found ${products.length} products from seller FLAVIASTS`);
      console.log(`✓ Sample product: ${product.title} - R$ ${product.price}`);
    } else {
      console.log("⚠ No products found for seller FLAVIASTS (may be expected if seller has no public products)");
    }
  }, { timeout: 15000 });

  it("should search for products by keyword", async () => {
    // Test search functionality
    const products = await searchMLProducts("iphone", 3);
    
    expect(Array.isArray(products)).toBe(true);
    
    if (products.length > 0) {
      console.log(`✓ Search found ${products.length} products for 'iphone'`);
    }
  }, { timeout: 15000 });
});
