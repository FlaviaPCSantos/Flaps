import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

/**
 * Development OAuth mock - allows testing admin without real OAuth server
 * Only enabled in development mode
 */
export function registerDevOAuthRoutes(app: Express) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  // Mock login endpoint for development
  app.get("/api/dev/oauth/login", async (req: Request, res: Response) => {
    try {
      // Create or get dev user with admin role
      await db.upsertUser({
        openId: "dev_user_flaps_admin",
        name: "Admin Dev",
        email: "admin@flaps.local",
        loginMethod: "dev",
        role: "admin",
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = await sdk.createSessionToken("dev_user_flaps_admin", {
        name: "Admin Dev",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to admin dashboard
      res.redirect(302, "/admin");
    } catch (error) {
      console.error("[Dev OAuth] Login failed", error);
      res.status(500).json({ error: "Dev OAuth login failed" });
    }
  });

  console.log("[Dev OAuth] Development OAuth routes registered");
}
