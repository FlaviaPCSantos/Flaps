import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";

export type AdminSession = {
  adminId: number;
  email: string;
  isAdmin: true;
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: (User | AdminSession) | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: (User | AdminSession) | null = null;

  // Try to get admin session from cookie first
  const sessionCookie = opts.req.cookies?.[COOKIE_NAME];
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie);
      if (session.adminId && session.email) {
        user = {
          adminId: session.adminId,
          email: session.email,
          isAdmin: true,
        };
        return {
          req: opts.req,
          res: opts.res,
          user,
        };
      }
    } catch (error) {
      // Invalid cookie, continue to OAuth
    }
  }

  // Fall back to OAuth authentication
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
