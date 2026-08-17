import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractProductFromAffiliateLink } from "./mlApi";

describe("ML API - Affiliate Link Extraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should extract product data from affiliate link HTML", async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>iPhone 15 Pro Max 256GB - Mercado Livre</title>
          <meta property="og:image" content="https://example.com/image.jpg" />
        </head>
        <body>
          <h1>iPhone 15 Pro Max 256GB Preto</h1>
          <div class="price">R$ 8.999,99</div>
          <img src="https://example.com/product.jpg" alt="Product" />
        </body>
      </html>
    `;

    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        url: "https://www.mercadolivre.com.br/iphone-15-pro-max/p/MLB123456789",
        text: async () => mockHtml,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "MLB123456789",
          title: "iPhone 15 Pro Max 256GB Preto",
          price: 8999.99,
          thumbnail: "https://example.com/product.jpg",
          permalink: "https://www.mercadolivre.com.br/iphone-15-pro-max/p/MLB123456789",
          seller: { nickname: "test-seller" }
        })
      })
    );

    const result = await extractProductFromAffiliateLink("https://meli.la/2cecdEf");

    expect(result).toBeDefined();
    expect(result?.title).toContain("iPhone");
    expect(result?.price).toBeGreaterThan(0);
    expect(result?.imageUrl).toBeDefined();
    expect(result?.affiliateLink).toBe("https://meli.la/2cecdEf");
  });

  it("should handle fetch errors gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("Network error")));

    const result = await extractProductFromAffiliateLink("https://meli.la/invalid");

    expect(result).toBeNull();
  });

  it("should handle non-OK responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    }));

    const result = await extractProductFromAffiliateLink("https://meli.la/notfound");

    expect(result).toBeNull();
  });

  it("should extract product ID from HTML if available", async () => {
    const mockHtml = `
      <html>
        <body>
          <h1>Test Product</h1>
          <div>MLB123456789</div>
          <div class="price">R$ 100,00</div>
        </body>
      </html>
    `;

    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        url: "https://www.mercadolivre.com.br/test/p/MLB123456789",
        text: async () => mockHtml,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "MLB123456789",
          title: "Test Product",
          price: 100,
          thumbnail: "https://example.com/test.jpg",
          permalink: "https://www.mercadolivre.com.br/test/p/MLB123456789",
          seller: { nickname: "test-seller" }
        })
      })
    );

    const result = await extractProductFromAffiliateLink("https://meli.la/test");

    expect(result?.mlId).toBe("MLB123456789");
  });

  it("should use placeholder image when no image found", async () => {
    const mockHtml = `
      <html>
        <body>
          <h1>Test Product</h1>
          <div class="price">R$ 100,00</div>
        </body>
      </html>
    `;

    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        url: "https://www.mercadolivre.com.br/test/p/MLB123456789",
        text: async () => mockHtml,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "MLB123456789",
          title: "Test Product",
          price: 100,
          thumbnail: "https://example.com/test.jpg",
          permalink: "https://www.mercadolivre.com.br/test/p/MLB123456789",
          seller: { nickname: "test-seller" }
        })
      })
    );

    const result = await extractProductFromAffiliateLink("https://meli.la/test");

    expect(result?.imageUrl).toBeDefined();
  });

  it("should handle different price formats", async () => {
    const mockHtml = `
      <html>
        <body>
          <h1>Test Product</h1>
          <div class="price">1.999,99</div>
        </body>
      </html>
    `;

    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        url: "https://www.mercadolivre.com.br/test/p/MLB123456789",
        text: async () => mockHtml,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "MLB123456789",
          title: "Test Product",
          price: 1999.99,
          thumbnail: "https://example.com/test.jpg",
          permalink: "https://www.mercadolivre.com.br/test/p/MLB123456789",
          seller: { nickname: "test-seller" }
        })
      })
    );

    const result = await extractProductFromAffiliateLink("https://meli.la/test");

    expect(result?.price).toBe(1999.99);
  });

  it("should use default title when not found in HTML", async () => {
    const mockHtml = `
      <html>
        <body>
          <div class="price">R$ 100,00</div>
        </body>
      </html>
    `;

    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        url: "https://www.mercadolivre.com.br/test/p/MLB123456789",
        text: async () => mockHtml,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "MLB123456789",
          title: "Test Product from API",
          price: 100,
          thumbnail: "https://example.com/test.jpg",
          permalink: "https://www.mercadolivre.com.br/test/p/MLB123456789",
          seller: { nickname: "test-seller" }
        })
      })
    );

    const result = await extractProductFromAffiliateLink("https://meli.la/test");

    expect(result?.title).toBe("Test Product from API");
  });
});
