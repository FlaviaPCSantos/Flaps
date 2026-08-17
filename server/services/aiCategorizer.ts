import { invokeLLM } from "../_core/llm";

export interface CategorizedProduct {
  title: string;
  category: string;
  isFeatured: boolean;
  reason: string;
}

const PRODUCT_CATEGORIES = [
  "Eletrônicos",
  "Moda",
  "Casa e Jardim",
  "Esportes",
  "Beleza",
  "Livros",
  "Brinquedos",
  "Alimentos",
  "Saúde",
  "Outros"
];

export async function categorizeProduct(title: string, description?: string): Promise<{
  category: string;
  isFeatured: boolean;
}> {
  try {
    const prompt = `Você é um assistente de categorização de produtos para uma vitrine de e-commerce.

Analise o seguinte produto e categorize-o em uma das categorias disponíveis:
${PRODUCT_CATEGORIES.join(", ")}

Produto: ${title}
${description ? `Descrição: ${description}` : ""}

Responda em JSON com a seguinte estrutura:
{
  "category": "nome da categoria",
  "isFeatured": true/false,
  "reason": "breve explicação"
}

Considere o produto como "destaque" (isFeatured: true) se for um item de alta qualidade, popular ou com bom preço.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em categorização de produtos de e-commerce. Responda sempre em JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "product_categorization",
          strict: true,
          schema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                description: "Categoria do produto"
              },
              isFeatured: {
                type: "boolean",
                description: "Se o produto deve ser destaque"
              },
              reason: {
                type: "string",
                description: "Explicação da categorização"
              }
            },
            required: ["category", "isFeatured", "reason"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No response from LLM");
    }

    const parsed = JSON.parse(content as string);
    
    // Validate category
    const validCategory = PRODUCT_CATEGORIES.includes(parsed.category) 
      ? parsed.category 
      : "Outros";

    return {
      category: validCategory,
      isFeatured: Boolean(parsed.isFeatured)
    };
  } catch (error) {
    console.error("Error categorizing product:", error);
    // Return default category on error
    return {
      category: "Outros",
      isFeatured: false
    };
  }
}

export async function suggestFeaturedProducts(products: Array<{
  id: number;
  title: string;
  price: string;
  description?: string;
}>, limit: number = 5): Promise<number[]> {
  try {
    const productList = products
      .map(p => `- ${p.title} (R$ ${p.price})${p.description ? ` - ${p.description}` : ""}`)
      .join("\n");

    const prompt = `Você é um especialista em curação de produtos para uma vitrine elegante e minimalista.

Analise a seguinte lista de produtos e selecione os ${limit} melhores para serem destaques. Considere qualidade, preço, relevância e apelo visual.

Produtos disponíveis:
${productList}

Responda em JSON com a seguinte estrutura:
{
  "featuredTitles": ["título do produto 1", "título do produto 2", ...],
  "reasoning": "breve explicação da seleção"
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Você é um especialista em curação de produtos para e-commerce. Responda sempre em JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "featured_products",
          strict: true,
          schema: {
            type: "object",
            properties: {
              featuredTitles: {
                type: "array",
                items: { type: "string" },
                description: "Títulos dos produtos em destaque"
              },
              reasoning: {
                type: "string",
                description: "Explicação da seleção"
              }
            },
            required: ["featuredTitles", "reasoning"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No response from LLM");
    }

    const parsed = JSON.parse(content as string);
    const featuredIds: number[] = [];

    // Match titles to IDs
    for (const title of parsed.featuredTitles) {
      const product = products.find(p => p.title.includes(title) || title.includes(p.title));
      if (product) {
        featuredIds.push(product.id);
      }
    }

    return featuredIds.slice(0, limit);
  } catch (error) {
    console.error("Error suggesting featured products:", error);
    return [];
  }
}
