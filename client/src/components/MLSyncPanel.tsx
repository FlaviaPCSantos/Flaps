import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function MLSyncPanel() {
  const [profileUrl, setProfileUrl] = useState("https://mercadolivre.com.br/social/flaviasts");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const syncMutation = trpc.mlSync.syncAffiliateProducts.useMutation({
    onSuccess: (result) => {
      setSyncResult(result);
      toast.success(`Sincronização concluída! ${result.added} produtos adicionados, ${result.updated} atualizados.`);
    },
    onError: (error) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleSync = async () => {
    if (!profileUrl.trim()) {
      toast.error("Por favor, insira a URL da página de afiliado");
      return;
    }

    setIsLoading(true);
    syncMutation.mutate({
      profileUrl: profileUrl.trim(),
      affiliateCode: affiliateCode.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-playfair font-bold mb-4">Sincronizar Produtos do Mercado Livre</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">URL da Página de Afiliado</label>
            <Input
              placeholder="https://mercadolivre.com.br/social/seu-usuario"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Insira a URL da sua página de perfil social do Mercado Livre
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Código de Afiliado (Opcional)</label>
            <Input
              placeholder="Seu código de afiliado"
              value={affiliateCode}
              onChange={(e) => setAffiliateCode(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Se tiver um código de afiliado, será adicionado aos links dos produtos
            </p>
          </div>

          <Button
            onClick={handleSync}
            disabled={isLoading}
            className="w-full bg-rose-400 hover:bg-rose-500 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              "Sincronizar Agora"
            )}
          </Button>
        </div>
      </Card>

      {syncResult && (
        <Card className="p-6 border-green-200 bg-green-50">
          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 mb-2">Sincronização Concluída</h3>
              <div className="space-y-1 text-sm text-green-800">
                <p>✓ {syncResult.added} produtos adicionados</p>
                <p>✓ {syncResult.updated} produtos atualizados</p>
                {syncResult.failed > 0 && (
                  <p className="text-orange-600">⚠ {syncResult.failed} produtos falharam</p>
                )}
              </div>
              {syncResult.errors.length > 0 && (
                <div className="mt-3 p-2 bg-white rounded border border-orange-200">
                  <p className="text-xs font-semibold text-orange-700 mb-1">Erros:</p>
                  <ul className="text-xs text-orange-600 space-y-1">
                    {syncResult.errors.slice(0, 3).map((error: string, i: number) => (
                      <li key={i}>• {error}</li>
                    ))}
                    {syncResult.errors.length > 3 && (
                      <li>• ... e mais {syncResult.errors.length - 3} erros</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Como funciona:</p>
            <ul className="space-y-1 text-xs">
              <li>• Acessa sua página de perfil social do Mercado Livre</li>
              <li>• Extrai todos os produtos listados</li>
              <li>• Categoriza automaticamente com IA</li>
              <li>• Sincroniza preços e informações</li>
              <li>• Atualiza a cada 6 horas automaticamente</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
