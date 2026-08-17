import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { scrapeMLAffiliateProfile } from "../services/mlScraper";
import { createProduct, getProductByMlId, updateProduct, deleteProduct } from "../db";
import { categorizeProduct } from "../services/aiCategorizer";

export const mlSyncRouter = router({
  /**
   * Sincroniza produtos da página de afiliado do Mercado Livre
   */
  syncAffiliateProducts: adminProcedure
    .input(z.object({
      profileUrl: z.string().url(),
      affiliateCode: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        console.log(`[tRPC] Iniciando sincronização de ${input.profileUrl}`);
        
        // Scraper dos produtos
        const mlProducts = await scrapeMLAffiliateProfile(input.profileUrl);
        
        if (mlProducts.length === 0) {
          throw new Error("Nenhum produto encontrado na página");
        }

        const results = {
          added: 0,
          updated: 0,
          failed: 0,
          errors: [] as string[],
        };

        // Processar cada produto
        for (const mlProduct of mlProducts) {
          try {
            const existingProduct = await getProductByMlId(mlProduct.mlId);

            if (existingProduct) {
              // Atualizar preço, informações e categorização
              const categorization = await categorizeProduct(mlProduct.title, mlProduct.description);
              await updateProduct(existingProduct.id, {
                price: mlProduct.price,
                title: mlProduct.title,
                imageUrl: mlProduct.imageUrl,
                description: mlProduct.description || "",
                category: categorization.category,
                featured: categorization.isFeatured,
                isMostSold: mlProduct.isMostSold || false,
              });
              results.updated++;
            } else {
              // Criar novo produto
              // Categorizar automaticamente com IA
              const categorization = await categorizeProduct(mlProduct.title, mlProduct.description);

              // Construir link de afiliado
              const affiliateLink = `${mlProduct.productUrl}${input.affiliateCode ? `&affiliateCode=${input.affiliateCode}` : ""}`;

              await createProduct({
                mlId: mlProduct.mlId,
                title: mlProduct.title,
                price: mlProduct.price,
                imageUrl: mlProduct.imageUrl,
                affiliateLink,
                description: mlProduct.description || "",
                featured: categorization.isFeatured,
                isMostSold: mlProduct.isMostSold || false,
              });
              results.added++;
            }
          } catch (error) {
            results.failed++;
            results.errors.push(`${mlProduct.title}: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
          }
        }

        console.log(`[tRPC] Sincronização concluída:`, results);
        return results;
      } catch (error) {
        console.error("[tRPC] Erro na sincronização:", error);
        throw new Error(
          `Falha ao sincronizar produtos: ${error instanceof Error ? error.message : "Erro desconhecido"}`
        );
      }
    }),

  /**
   * Obtém status da última sincronização
   */
  getSyncStatus: publicProcedure.query(async () => {
    // TODO: Implementar rastreamento de última sincronização
    return {
      lastSync: new Date(),
      totalProducts: 0,
      nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 horas
    };
  }),

  /**
   * Força sincronização imediata (admin only)
   */
  forceSyncNow: adminProcedure
    .input(z.object({
      profileUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      return await scrapeMLAffiliateProfile(input.profileUrl);
    }),
});
