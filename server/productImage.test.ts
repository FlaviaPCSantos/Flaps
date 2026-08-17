import { describe, expect, it } from "vitest";
import { sanitizeProductImageUrl } from "./productImage";

describe("sanitizeProductImageUrl", () => {
  it("preserves valid Mercado Livre image URLs", () => {
    const url = "https://http2.mlstatic.com/D_NQ_NP_123-O.webp";
    expect(sanitizeProductImageUrl(url)).toBe(url);
  });

  it("rejects placeholder and example image URLs", () => {
    expect(sanitizeProductImageUrl("https://example.com/image.jpg")).toBeUndefined();
    expect(sanitizeProductImageUrl("https://via.placeholder.com/300x300")).toBeUndefined();
  });

  it("rejects malformed or non-http URLs", () => {
    expect(sanitizeProductImageUrl("not-a-url")).toBeUndefined();
    expect(sanitizeProductImageUrl("javascript:alert(1)")).toBeUndefined();
    expect(sanitizeProductImageUrl(null)).toBeUndefined();
  });
});
