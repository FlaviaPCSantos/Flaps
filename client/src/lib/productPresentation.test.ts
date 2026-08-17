import { describe, expect, it } from "vitest";
import { getCurationReason, getDisplayTitle, getOccasion } from "./productPresentation";

describe("product presentation", () => {
  it("remove ruído comum do título sem esconder o produto", () => {
    expect(getDisplayTitle({ title: "Vestido Midi Oficial | Frete Grátis" })).toBe("Vestido Midi");
  });

  it("classifica peças por ocasião", () => {
    expect(getOccasion({ title: "Blazer social feminino", price: 180 })).toBe("trabalho");
    expect(getOccasion({ title: "Vestido para festa com brilho", price: 220 })).toBe("festa");
    expect(getOccasion({ title: "Camiseta básica casual", price: 140 })).toBe("basicos");
    expect(getOccasion({ title: "Bolsa feminina", price: 79.9 })).toBe("achados");
  });

  it("explica a seleção sem prometer qualidade não verificada", () => {
    const reason = getCurationReason({ title: "Blazer social", price: 180 });
    expect(reason).toContain("rotina profissional");
    expect(reason.toLowerCase()).not.toContain("alta qualidade");
  });
});
