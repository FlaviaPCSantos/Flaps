import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function AdminLogin() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to admin dashboard if already authenticated
  useEffect(() => {
    if (!loading && user) {
      const isAdmin = (user as any)?.role === "admin" || (user as any)?.isAdmin === true;
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Flaps
            </h1>
          </div>
        </div>
      </nav>

      {/* Login Card */}
      <Card className="w-full max-w-md p-8 bg-white border border-border shadow-lg">
        <div className="text-center mb-8">
          <h2
            className="text-3xl font-bold mb-2 text-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Painel Administrativo
          </h2>
          <p className="text-muted-foreground">
            Acesso exclusivo para gerenciar a vitrine Flaps
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Faça login com sua conta Manus para acessar o painel administrativo.
          </p>

          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="w-full bg-accent hover:bg-accent/90 text-white py-6 rounded-lg text-lg font-semibold transition"
          >
            Entrar com Manus
          </Button>

          {import.meta.env.DEV && (
            <Button
              onClick={() => window.location.href = '/api/dev/oauth/login'}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6 rounded-lg text-lg font-semibold transition"
            >
              🔧 Dev Login (Desenvolvimento)
            </Button>
          )}

          <Button
            onClick={() => navigate("/admin/login-form")}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-6 rounded-lg text-lg font-semibold transition"
          >
            🔐 Login com Email/Senha
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full py-6 rounded-lg text-lg font-semibold transition"
          >
            Voltar à Vitrine
          </Button>
        </div>

        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            💡 <strong>Dica:</strong> Apenas administradores podem acessar este painel. Entre em contato com o proprietário do Flaps se precisar de acesso.
          </p>
        </div>
      </Card>
    </div>
  );
}
