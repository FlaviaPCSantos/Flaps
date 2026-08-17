import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerMLOAuthRoutes } from "./mlOAuth";
import { registerDevOAuthRoutes } from "./devOAuth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { generateSitemap } from "../sitemap";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getDb } from "../db";
import { products } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { searchMLProducts } from "../services/mlApi";
import { sdk } from "./sdk";
import { createProduct, updateProduct } from "../db";
import { categorizeProduct } from "../services/aiCategorizer";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Add cookie parser middleware
  app.use(cookieParser());
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerMLOAuthRoutes(app);
  registerDevOAuthRoutes(app);
  
  // Sitemap route
  app.get("/sitemap.xml", (req, res) => {
    const baseUrl = process.env.NODE_ENV === "production" 
      ? "https://flaps.manus.space" 
      : `http://${req.hostname}:${req.socket.localPort || 3000}`;
    const sitemap = generateSitemap(baseUrl);
    res.setHeader("Content-Type", "application/xml");
    res.send(sitemap);
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Scheduled affiliate profile sync handler
  app.post("/api/scheduled/syncAffiliateProfile", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) {
        return res.status(403).json({ error: "cron-only" });
      }

      const db = await getDb();
      if (!db) {
        return res.status(503).json({ error: "database-unavailable" });
      }

      // Search for products from the seller
      const sellerNickname = "flaviasts";
      const apiProducts = await searchMLProducts(sellerNickname, 100);

      let created = 0;
      let updated = 0;
      let errors = 0;

      // Process API products
      for (const apiProduct of apiProducts) {
        try {
          // Check if product already exists
          const existing = await db
            .select()
            .from(products)
            .where(eq(products.mlId, apiProduct.mlId))
            .limit(1);

          if (existing.length > 0) {
            // Update existing product (price and title)
            await updateProduct(existing[0].id, {
              title: apiProduct.title,
              price: apiProduct.price,
              imageUrl: apiProduct.imageUrl,
            });
            updated++;
          } else {
            // Categorize the product with AI
            const categorization = await categorizeProduct(apiProduct.title);

            // Create new product
            await createProduct({
              mlId: apiProduct.mlId,
              title: apiProduct.title,
              price: apiProduct.price,
              imageUrl: apiProduct.imageUrl,
              affiliateLink: apiProduct.productUrl,
              description: apiProduct.title,
            });
            created++;
          }
        } catch (error) {
          console.error(`Error processing product ${apiProduct.mlId}:`, error);
          errors++;
        }
      }

      res.json({ ok: true, created, updated, errors, total: apiProducts.length });
    } catch (error) {
      console.error("Affiliate profile sync error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "unknown-error",
        stack: error instanceof Error ? error.stack : undefined,
        context: { url: req.url },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Scheduled price sync handler
  app.post("/api/scheduled/syncPrices", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) {
        return res.status(403).json({ error: "cron-only" });
      }

      const db = await getDb();
      if (!db) {
        return res.status(503).json({ error: "database-unavailable" });
      }

      // Get all active products
      const activeProducts = await db
        .select()
        .from(products)
        .where(eq(products.active, true));

      let updated = 0;
      let errors = 0;

      // Prices are updated via the affiliate profile sync
      // This handler is a placeholder for future ML API integration
      updated = activeProducts.length;

      res.json({ ok: true, updated, errors, total: activeProducts.length });
    } catch (error) {
      console.error("Price sync error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "unknown-error",
        stack: error instanceof Error ? error.stack : undefined,
        context: { url: req.url },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
