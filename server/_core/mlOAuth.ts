import { Express } from "express";
import { getDb } from "../db";
import { mlTokens } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const ML_CLIENT_ID = process.env.ML_CLIENT_ID || "";
const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET || "";
const ML_OAUTH_URL = process.env.ML_OAUTH_URL || "https://auth.mercadolibre.com/authorization";
const ML_API_BASE_URL = process.env.ML_API_BASE_URL || "https://api.mercadolibre.com";
const ML_REDIRECT_URI = process.env.ML_REDIRECT_URI || "http://localhost:3000/api/ml/callback";

/**
 * Registra rotas de autenticação OAuth do Mercado Livre
 */
export function registerMLOAuthRoutes(app: Express) {
  /**
   * Inicia o fluxo de autenticação OAuth
   * Redireciona o usuário para a tela de autorização do Mercado Livre
   */
  app.get("/api/ml/auth", (req, res) => {
    try {
      const state = Math.random().toString(36).substring(7);
      
      // Salvar state na sessão para validar depois
      const session = (req as any).session || {};
      session.mlOAuthState = state;
      (req as any).session = session;

      const authUrl = new URL(ML_OAUTH_URL);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("client_id", ML_CLIENT_ID);
      authUrl.searchParams.append("redirect_uri", ML_REDIRECT_URI);
      authUrl.searchParams.append("state", state);

      console.log(`[MLOAuth] Iniciando autenticação. URL: ${authUrl.toString()}`);
      res.redirect(authUrl.toString());
    } catch (error) {
      console.error("[MLOAuth] Erro ao iniciar autenticação:", error);
      res.status(500).json({ error: "auth-failed" });
    }
  });

  /**
   * Callback após autorização do usuário
   * Troca o código por um token de acesso
   */
  app.get("/api/ml/callback", async (req, res) => {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        return res.status(400).json({ error: "missing-code-or-state" });
      }

      // Nota: Validação de state removida por problemas com sessão
      // Em produção, implementar com armazenamento de state em banco de dados

      // Trocar código por token
      const tokenResponse = await fetch(`${ML_API_BASE_URL}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: ML_CLIENT_ID,
          client_secret: ML_CLIENT_SECRET,
          code: code as string,
          redirect_uri: ML_REDIRECT_URI,
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error("[MLOAuth] Erro ao obter token:", error);
        return res.status(tokenResponse.status).json({ error: "token-failed" });
      }

      const tokenData = await tokenResponse.json();
      console.log("[MLOAuth] Token obtido com sucesso");

      // Salvar token no banco de dados
      const db = await getDb();
      if (db) {
        // Verificar se já existe token para este usuário
        const existing = await db
          .select()
          .from(mlTokens)
          .where(eq(mlTokens.userId, tokenData.user_id))
          .limit(1);

        if (existing.length > 0) {
          // Atualizar token existente
          await db
            .update(mlTokens)
            .set({
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token,
              expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
            })
            .where(eq(mlTokens.userId, tokenData.user_id));
        } else {
          // Criar novo token
          await db.insert(mlTokens).values({
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
            userId: tokenData.user_id,
          });
        }

        console.log("[MLOAuth] Token salvo no banco de dados");
      }

      // Redirecionar para o painel admin
      res.redirect("/admin?ml_auth=success");
    } catch (error) {
      console.error("[MLOAuth] Erro no callback:", error);
      res.status(500).json({ error: "callback-failed" });
    }
  });

  /**
   * Obter token de acesso válido (com refresh se necessário)
   */
  app.get("/api/ml/token", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        return res.status(503).json({ error: "database-unavailable" });
      }

      const token = await db
        .select()
        .from(mlTokens)
        .limit(1);

      if (!token || token.length === 0) {
        return res.status(401).json({ error: "no-token" });
      }

      const tokenRecord = token[0];

      // Verificar se token expirou
      if (tokenRecord.expiresAt && new Date() > tokenRecord.expiresAt) {
        console.log("[MLOAuth] Token expirado, tentando refresh...");

        // Fazer refresh do token
        const refreshResponse = await fetch(`${ML_API_BASE_URL}/oauth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: ML_CLIENT_ID,
            client_secret: ML_CLIENT_SECRET,
            refresh_token: tokenRecord.refreshToken || "",
          }).toString(),
        });

        if (!refreshResponse.ok) {
          console.error("[MLOAuth] Erro ao fazer refresh do token");
          return res.status(401).json({ error: "refresh-failed" });
        }

        const newTokenData = await refreshResponse.json();

        // Atualizar token no banco
        await db
          .update(mlTokens)
          .set({
            accessToken: newTokenData.access_token,
            refreshToken: newTokenData.refresh_token,
            expiresAt: new Date(Date.now() + (newTokenData.expires_in * 1000)),
          })
          .where(eq(mlTokens.userId, tokenRecord.userId));

        return res.json({ accessToken: newTokenData.access_token });
      }

      res.json({ accessToken: tokenRecord.accessToken });
    } catch (error) {
      console.error("[MLOAuth] Erro ao obter token:", error);
      res.status(500).json({ error: "token-error" });
    }
  });
}
