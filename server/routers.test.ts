import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    createProduct: vi.fn().mockResolvedValue({}),
  };
});

import { appRouter } from "./routers";
import { createProduct } from "./db";
import type { TrpcContext } from "./_core/context";

// Mock global fetch
vi.stubGlobal("fetch", vi.fn());

// Mock user context
function createAuthContext(role: "admin" | "user" = "admin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createUnauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Products Router - Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("products.add", () => {
    it("should allow admin users", async () => {
      // Mock fetch to return a valid product with unique ID
      const uniqueId = `MLB${Date.now()}`;
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: uniqueId,
          title: "Test Product",
          price: 100,
          thumbnail: "https://example.com/image.jpg",
          permalink: "https://www.mercadolivre.com.br/item/" + uniqueId,
        }),
      });

      const ctx = createAuthContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.products.add({
        mlLink: `https://www.mercadolivre.com.br/item/${uniqueId}`,
        affiliateLink: `https://meli.la/test-affiliate`,
        title: "Test Product",
        price: 100,
      });

      expect(result.success).toBe(true);
    }, { timeout: 10000 });

    it("should reject non-admin users", async () => {
      const ctx = createAuthContext("user");
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.products.add({
          mlLink: "https://www.mercadolivre.com.br/item/MLB123456",
          affiliateLink: "https://meli.la/test",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("Unauthorized");
      }
    });
  });

  describe("products.delete", () => {
    it("should reject non-admin users", async () => {
      const ctx = createAuthContext("user");
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.products.delete({ id: 1 });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("Unauthorized");
      }
    });
  });

  describe("products.list", () => {
    it("should allow public access", async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.products.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("products.featured", () => {
    it("should allow public access", async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.products.featured();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("products.searchML", () => {
    it("should allow public search", async () => {
      // Mock fetch to return search results
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: "MLB123456",
              title: "Test Laptop",
              price: 2000,
              thumbnail: "https://example.com/image.jpg",
              permalink: "https://www.mercadolivre.com.br/item/MLB123456",
            },
          ],
        }),
      });

      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.products.searchML({ query: "laptop" });
      expect(Array.isArray(result)).toBe(true);
    }, { timeout: 10000 });
  });
});


describe("Affiliate Link Preservation", () => {
  it("should preserve affiliate link when creating product with mlLink and affiliateLink", async () => {
    const uniqueId = `MLB${Date.now()}`;
    const affiliateLink = "https://meli.la/test-affiliate-link";
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: uniqueId,
        title: "Test Product for Affiliate",
        price: 150,
        thumbnail: "https://example.com/image.jpg",
        permalink: "https://www.mercadolivre.com.br/item/" + uniqueId,
      }),
    });

    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.add({
      mlLink: `https://www.mercadolivre.com.br/item/${uniqueId}`,
      affiliateLink: affiliateLink,
      title: "Test Product for Affiliate",
      price: 150,
    });

    expect(result).toBeDefined();
    expect(result?.success).toBe(true);
    
    const createdProduct = vi.mocked(createProduct).mock.calls.at(-1)?.[0];
    expect(createdProduct).toMatchObject({
      affiliateLink,
      title: "Test Product for Affiliate",
    });
  }, { timeout: 10000 });

  it("should allow manual data entry when extraction fails", async () => {
    const manualTitle = "Produto Manual";
    const manualPrice = 99.99;
    const manualImage = "https://example.com/manual-image.jpg";
    const affiliateLink = "https://meli.la/manual-product";

    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.add({
      title: manualTitle,
      price: manualPrice,
      imageUrl: manualImage,
      affiliateLink: affiliateLink,
    });

    expect(result.success).toBe(true);
    
    const createdProduct = vi.mocked(createProduct).mock.calls.at(-1)?.[0];
    expect(createdProduct).toMatchObject({
      title: manualTitle,
      price: manualPrice,
      affiliateLink,
    });
    expect(createdProduct?.imageUrl).toBeUndefined();
    expect(createdProduct?.imageNeedsReview).toBeUndefined();
  }, { timeout: 10000 });
});
