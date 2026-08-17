import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, Plus, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export function MLImportPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  // Search products query
  const searchQuery_result = trpc.mlApi.search.useQuery(
    { query: searchTerm, limit: 30 },
    { enabled: !!searchTerm }
  );

  // Add product mutation
  const addProductMutation = trpc.products.add.useMutation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Digite uma palavra-chave para buscar");
      return;
    }

    setSelectedProducts(new Set());
    setSearchTerm(searchQuery);
  };

  const toggleProduct = (mlId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(mlId)) {
      newSelected.delete(mlId);
    } else {
      newSelected.add(mlId);
    }
    setSelectedProducts(newSelected);
  };

  const handleImport = async () => {
    if (selectedProducts.size === 0) {
      toast.error("Selecione pelo menos um produto");
      return;
    }

    setIsImporting(true);
    let imported = 0;
    let failed = 0;

    for (const mlId of Array.from(selectedProducts)) {
      try {
        await addProductMutation.mutateAsync({
          mlLink: `https://mercadolivre.com.br/search?q=${mlId}`,
        });
        imported++;
      } catch (error: any) {
        console.error(`Erro ao importar ${mlId}:`, error);
        failed++;
      }
    }

    setIsImporting(false);
    setSelectedProducts(new Set());
    setSearchTerm("");
    setSearchQuery("");

    if (imported > 0) {
      toast.success(`${imported} produto(s) importado(s) com sucesso!`);
    }
    if (failed > 0) {
      toast.error(`${failed} produto(s) falharam na importação`);
    }
  };

  const searchResults = searchQuery_result.data || [];
  const isSearching = searchQuery_result.isLoading;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-playfair font-bold mb-4">Buscar e Importar Produtos</h2>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Buscar Produtos no Mercado Livre</label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: iPhone, fone de ouvido, smartwatch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSearching}
              />
              <Button
                type="submit"
                disabled={isSearching}
                className="bg-accent hover:bg-accent/90 text-white px-6"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Digite uma palavra-chave para buscar produtos no Mercado Livre
            </p>
          </div>
        </form>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {searchResults.length} produto(s) encontrado(s)
            </h3>
            <span className="text-sm text-gray-500">
              {selectedProducts.size} selecionado(s)
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {searchResults.map((product) => (
              <div
                key={product.mlId}
                className="flex gap-4 p-3 border border-border rounded-lg hover:bg-muted/50 transition"
              >
                <Checkbox
                  checked={selectedProducts.has(product.mlId)}
                  onCheckedChange={() => toggleProduct(product.mlId)}
                  className="mt-1"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2">{product.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-primary">
                      R$ {product.price.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    {product.discount && (
                      <span className="text-xs bg-accent text-white px-2 py-1 rounded">
                        -{product.discount}%
                      </span>
                    )}
                  </div>
                  {product.seller && (
                    <p className="text-xs text-gray-500 mt-1">Vendedor: {product.seller}</p>
                  )}
                </div>

                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded flex-shrink-0"
                  />
                )}
              </div>
            ))}
          </div>

          {selectedProducts.size > 0 && (
            <Button
              onClick={handleImport}
              disabled={isImporting}
              className="w-full mt-4 bg-accent hover:bg-accent/90 text-white"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando {selectedProducts.size} produto(s)...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Importar {selectedProducts.size} Produto(s)
                </>
              )}
            </Button>
          )}
        </Card>
      )}

      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Como funciona:</p>
            <ul className="space-y-1 text-xs">
              <li>• Digite uma palavra-chave para buscar produtos</li>
              <li>• Selecione os produtos que deseja importar</li>
              <li>• Clique em "Importar" para adicionar à sua vitrine</li>
              <li>• Os preços serão sincronizados automaticamente a cada 6 horas</li>
              <li>• Você pode editar descrição e destaque após importar</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
