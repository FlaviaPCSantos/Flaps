import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getActiveProducts, getFeaturedProducts, getProductById, getAllCategories, createProduct, updateProduct, deleteProduct, getUserFavorites, addFavorite, removeFavorite, isFavorite, addRating, getProductRatings, getAverageRating, getUserRating, addToWishlist, removeFromWishlist, getUserWishlist, isInWishlist, createNotification, getUserNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead } from "./db";
import { searchProductsML, getProductDetailML, extractMLId } from "./services/mercadoLivre";
import { mlSyncRouter } from "./routers/mlSync";
import { searchMLProducts, getMLProductDetails, expandMeliLink, extractProductFromAffiliateLink } from "./services/mlApi";
import { authenticateAdmin, updateAdminEmail, updateAdminPassword } from "./auth";
import { sanitizeProductImageUrl } from "./productImage";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    adminLogin: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(6) }))
      .mutation(async ({ input, ctx }) => {
        const result = await authenticateAdmin(input.email, input.password);
        
        if (!result.success) {
          return { success: false, error: result.error };
        }

        // Set admin session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, JSON.stringify({ adminId: result.admin.id, email: result.admin.email }), cookieOptions);
        
        return { success: true, admin: result.admin };
      }),
    updateEmail: protectedProcedure
      .input(z.object({ currentPassword: z.string(), newEmail: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        const adminId = (ctx.user as any)?.adminId;
        if (!adminId) {
          return { success: false, error: "Nao autenticado" };
        }
        return await updateAdminEmail(adminId, input.currentPassword, input.newEmail);
      }),
    updatePassword: protectedProcedure
      .input(z.object({ currentPassword: z.string(), newPassword: z.string().min(8) }))
      .mutation(async ({ input, ctx }) => {
        const adminId = (ctx.user as any)?.adminId;
        if (!adminId) {
          return { success: false, error: "Nao autenticado" };
        }
        return await updateAdminPassword(adminId, input.currentPassword, input.newPassword);
      }),
  }),

  products: router({
    // Get all active products
    list: publicProcedure.query(async () => {
      return getActiveProducts();
    }),

    // Get featured products
    featured: publicProcedure.query(async () => {
      return getFeaturedProducts(6);
    }),

    // Get product by ID
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getProductById(input.id);
      }),

    // Search Mercado Livre products (via API)
    searchML: publicProcedure
      .input(z.object({ query: z.string().min(1), limit: z.number().default(20) }))
      .query(async ({ input }) => {
        return searchMLProducts(input.query, input.limit);
      }),

    // Get product detail from Mercado Livre (via API)
    getMLDetail: publicProcedure
      .input(z.object({ mlId: z.string() }))
      .query(async ({ input }) => {
        return getMLProductDetails(input.mlId);
      }),

    // Add product (admin only)
    add: protectedProcedure
      .input(z.object({ 
        mlLink: z.string().optional(),
        affiliateLink: z.string().optional(),
        title: z.string().optional(),
        price: z.number().optional(),
        imageUrl: z.string().optional(),
        description: z.string().optional(),
        curationReason: z.string().max(500).optional(),
        featured: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if user is admin
        const isAdmin = (ctx.user as any)?.role === "admin" || (ctx.user as any)?.isAdmin === true;
        if (!isAdmin) {
          throw new Error("Unauthorized: Only admins can add products");
        }

        // At least one link must be provided
        if (!input.mlLink && !input.affiliateLink) {
          throw new Error("Forneça pelo menos um link (original ou de afiliado)");
        }

        let extractedData: any = null;
        let mlId: string | undefined;
        let finalAffiliateLink = input.affiliateLink;

        // Try to extract data from mlLink if provided
        if (input.mlLink) {
          try {
            console.log("[Products] Tentando extrair dados do link original:", input.mlLink);
            
            // Extract ML ID from the link
            const extractedId = await expandMeliLink(input.mlLink);
            if (extractedId) {
              mlId = extractedId;
            }
            
            if (mlId) {
              // Fetch product details from ML API using the extracted ID
              const mlProduct = await getMLProductDetails(mlId);
              if (mlProduct) {
                extractedData = {
                  title: mlProduct.title,
                  price: mlProduct.price,
                  imageUrl: mlProduct.imageUrl,
                  mlId: mlProduct.mlId,
                };
                
                // If no affiliate link provided, use the original link
                if (!finalAffiliateLink) {
                  finalAffiliateLink = input.mlLink;
                }
                
                console.log("[Products] Dados extraídos com sucesso:", extractedData);
              }
            }
          } catch (error: any) {
            console.log("[Products] Erro ao extrair dados do link original:", error?.message || error);
            // Continue with manual data or affiliate link extraction
          }
        }

        // Try to extract data from affiliateLink if mlLink extraction failed
        if (!extractedData && input.affiliateLink) {
          try {
            console.log("[Products] Tentando extrair dados do link de afiliado:", input.affiliateLink);
            const affiliateData = await extractProductFromAffiliateLink(input.affiliateLink);
            
            if (affiliateData && affiliateData.title && affiliateData.title.trim()) {
              extractedData = {
                title: affiliateData.title,
                price: affiliateData.price,
                imageUrl: affiliateData.imageUrl,
                mlId: affiliateData.mlId,
              };
              
              console.log("[Products] Dados extraídos do link de afiliado:", extractedData);
            }
          } catch (error: any) {
            console.log("[Products] Erro ao extrair dados do link de afiliado:", error?.message || error);
          }
        }

        // Use manual data if provided, otherwise use extracted data
        const finalTitle = input.title || extractedData?.title;
        const finalPrice = input.price ?? extractedData?.price;
        const finalImageUrl = sanitizeProductImageUrl(input.imageUrl) ?? sanitizeProductImageUrl(extractedData?.imageUrl);
        const finalMlId = extractedData?.mlId;
        
        // Debug logging
        console.log("[Products] Dados finais:", {
          finalTitle,
          finalPrice,
          finalImageUrl,
          finalMlId,
          extractedData,
          inputPrice: input.price,
        });

        // Validate that we have at least a title
        if (!finalTitle || !finalTitle.trim()) {
          throw new Error("Título é obrigatório. Forneça um link válido ou preencha manualmente.");
        }

        // Validate that we have a price
        if (!finalPrice || finalPrice <= 0) {
          console.log("[Products] Preço inválido:", finalPrice);
          throw new Error("Preço é obrigatório e deve ser maior que zero. Forneça um link válido ou preencha manualmente.");
        }

        // Validate that we have an affiliate link
        if (!finalAffiliateLink) {
          throw new Error("Link de afiliado é obrigatório para rastreamento de comissão.");
        }

        // Create product in database
        try {
          await createProduct({
            title: finalTitle,
            price: finalPrice,
            imageUrl: finalImageUrl,
            mlId: finalMlId,
            mlLink: input.mlLink,
            affiliateLink: finalAffiliateLink,
            description: input.description,
            curationReason: input.curationReason,
            featured: input.featured || false,
          });

          console.log("[Products] Produto criado com sucesso:", finalTitle);
          return { success: true, mlId: finalMlId };
        } catch (error: any) {
          console.error("[Products] Erro ao criar produto:", error);
          throw new Error(`Erro ao salvar produto: ${error.message}`);
        }

        return { success: true, mlId: mlId || undefined };
      }),

    // Update product (admin only)
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().optional(),
        featured: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const isAdmin = (ctx.user as any)?.role === "admin" || (ctx.user as any)?.isAdmin === true;
        if (!isAdmin) {
          throw new Error("Unauthorized: Only admins can update products");
        }

        await updateProduct(input.id, {
          description: input.description,
          featured: input.featured,
        });

        return { success: true };
      }),

    // Delete product (admin only)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const isAdmin = (ctx.user as any)?.role === "admin" || (ctx.user as any)?.isAdmin === true;
        if (!isAdmin) {
          throw new Error("Unauthorized: Only admins can delete products");
        }

        await deleteProduct(input.id);
        return { success: true };
      }),
  }),

  categories: router({
    // Get all categories
    list: publicProcedure.query(async () => {
      return getAllCategories();
    }),
  }),

  mlSync: mlSyncRouter,

  mlApi: router({
    // Search products by keyword
    search: publicProcedure
      .input(z.object({ query: z.string().min(1), limit: z.number().default(20) }))
      .query(async ({ input }) => {
        return searchMLProducts(input.query, input.limit);
      }),

    // Get product details
    getDetail: publicProcedure
      .input(z.object({ mlId: z.string() }))
      .query(async ({ input }) => {
        return getMLProductDetails(input.mlId);
      }),
  }),

  favorites: router({
    // Get user favorites
    list: protectedProcedure.query(async ({ ctx }) => {
      const userId = (ctx.user as any)?.id || (ctx.user as any)?.adminId;
      if (!userId) throw new Error("User not authenticated");
      return getUserFavorites(userId);
    }),

    // Add to favorites
    add: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const userId = (ctx.user as any)?.id || (ctx.user as any)?.adminId;
        if (!userId) throw new Error("User not authenticated");
        await addFavorite(userId, input.productId);
        return { success: true };
      }),

    // Remove from favorites
    remove: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const userId = (ctx.user as any)?.id || (ctx.user as any)?.adminId;
        if (!userId) throw new Error("User not authenticated");
        await removeFavorite(userId, input.productId);
        return { success: true };
      }),

    // Check if product is favorited
    isFavorite: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input, ctx }) => {
        const userId = (ctx.user as any)?.id || (ctx.user as any)?.adminId;
        if (!userId) return false;
        return isFavorite(userId, input.productId);
      }),
  }),
  ratings: router({
    add: protectedProcedure
      .input(z.object({ productId: z.number(), rating: z.number().min(1).max(5), comment: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const userId = (ctx.user as any)?.id;
        if (!userId) throw new Error("Not authenticated");
        return addRating(userId, input.productId, input.rating, input.comment);
      }),
    getProductRatings: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return getProductRatings(input.productId);
      }),
    getAverageRating: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return getAverageRating(input.productId);
      }),
    getUserRating: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input, ctx }) => {
        const userId = (ctx.user as any)?.id;
        if (!userId) return null;
        return getUserRating(userId, input.productId);
      }),
  }),
  wishlists: router({
    add: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const userId = (ctx.user as any)?.id;
        if (!userId) throw new Error("Not authenticated");
        return addToWishlist(userId, input.productId);
      }),
    remove: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const userId = (ctx.user as any)?.id;
        if (!userId) throw new Error("Not authenticated");
        return removeFromWishlist(userId, input.productId);
      }),
    getList: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = (ctx.user as any)?.id;
        if (!userId) return [];
        return getUserWishlist(userId);
      }),
    isInWishlist: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input, ctx }) => {
        const userId = (ctx.user as any)?.id;
        if (!userId) return false;
        return isInWishlist(userId, input.productId);
      }),
  }),
  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const userId = (ctx.user as any)?.id;
        if (!userId) return [];
        return getUserNotifications(userId, input.limit || 20);
      }),
    unreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = (ctx.user as any)?.id;
        if (!userId) return 0;
        return getUnreadNotificationCount(userId);
      }),
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        return markNotificationAsRead(input.notificationId);
      }),
    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        const userId = (ctx.user as any)?.id;
        if (!userId) throw new Error("Not authenticated");
        return markAllNotificationsAsRead(userId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
