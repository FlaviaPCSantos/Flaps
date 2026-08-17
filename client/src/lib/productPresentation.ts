export function getDisplayTitle(product: { title?: string | null }): string {
  const rawTitle = String(product.title || "Peça selecionada").replace(/\s+/g, " ").trim();
  const cleanedTitle = rawTitle
    .replace(/\b(promoção|frete grátis|original|oficial|imperdível)\b/gi, "")
    .replace(/[|]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!cleanedTitle) return "Peça selecionada";
  return cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
}

export function getOccasion(product: { title?: string | null; description?: string | null; price?: unknown }): string {
  const text = `${product.title || ""} ${product.description || ""}`.toLowerCase();
  const price = Number(product.price);
  if (Number.isFinite(price) && price > 0 && price <= 100) return "achados";
  if (/festa|festivo|balada|brilho|paet[eê]|casamento|formatura/.test(text)) return "festa";
  if (/trabalho|social|alfaiataria|blazer|escrit[oó]rio|executiv/.test(text)) return "trabalho";
  if (/b[aá]sic|casual|t-shirt|camiseta|regata|jeans|cotidiano/.test(text)) return "basicos";
  return "basicos";
}

export function getCurationReason(product: { title?: string | null; description?: string | null; price?: unknown; curationReason?: string | null }): string {
  if (product.curationReason?.trim()) return product.curationReason.trim();

  const reasons: Record<string, string> = {
    trabalho: "Selecionada para compor produções práticas para a rotina profissional.",
    festa: "Selecionada para ajudar você a montar uma produção especial sem complicar a busca.",
    basicos: "Selecionada por ser uma opção versátil para combinar com diferentes looks.",
    achados: "Selecionada por reunir uma proposta acessível e fácil de considerar.",
  };
    return reasons[getOccasion(product)] || "Selecionada por combinar praticidade, estilo e uma proposta acessível.";
}

