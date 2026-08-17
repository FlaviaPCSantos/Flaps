const PLACEHOLDER_IMAGE_PATTERNS = [
  /example\.com/i,
  /via\.placeholder\.com/i,
  /placeholder/i,
  /000000/i,
];

export function sanitizeProductImageUrl(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;

  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
  } catch {
    return undefined;
  }

  if (PLACEHOLDER_IMAGE_PATTERNS.some((pattern) => pattern.test(url))) {
    return undefined;
  }

  return url.trim();
}
