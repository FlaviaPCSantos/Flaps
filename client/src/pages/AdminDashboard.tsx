import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Edit2, Trash2, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MLSyncPanel } from "@/components/MLSyncPanel";
import { MLImportPanel } from "@/components/MLImportPanel";
import { ProductImage } from "@/components/ProductImage";

export default function AdminDashboard() {
  // All hooks must be at the top level, before any conditional returns
  const { user, logout, loading } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [mlLink, setMlLink] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [manualImage, setManualImage] = useState("");
  const [curationReason, setCurationReason] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editFeatured, setEditFeatured] = useState(false);
  const [activeTab, setActiveTab] = useState<"produtos" | "sincronizar" | "importar">("produtos");

  // Verificar se OAuth foi bem-sucedido
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ml_auth") === "success") {
      toast.success("Mercado Livre conectado com sucesso!", {
        description: "Agora você pode importar seus produtos.",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // All tRPC queries must be at the top level
  const { data: products, isLoading: productsLoading, refetch } = trpc.products.list.useQuery();
  const deleteProductMutation = trpc.products.delete.useMutation();
  const updateProductMutation = trpc.products.update.useMutation();
  const addProductMutation = trpc.products.add.useMutation();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user is admin
  const isAdmin = (user as any)?.role === "admin" || (user as any)?.isAdmin === true;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">Você não tem permissão para acessar o painel administrativo.</p>
          <Button onClick={() => navigate("/")} className="bg-accent hover:bg-accent/90">
            Voltar à Vitrine
          </Button>
        </div>
      </div>
    );
  }

  const handleToggleFeatured = async (productId: number, featured: boolean) => {
    try {
      await updateProductMutation.mutateAsync({
        id: productId,
        featured: featured,
      });
      toast.success(featured ? "Produto destacado!" : "Destaque removido!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar destaque");
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Tem certeza que deseja remover este produto?")) return;

    try {
      await deleteProductMutation.mutateAsync({ id: productId });
      toast.success("Produto removido com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover produto");
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingId(product.id);
    setEditDescription(product.description || "");
    setEditFeatured(product.featured || false);
  };

  const handleSaveEdit = async () => {
    if (editingId === null) return;
    try {
      await updateProductMutation.mutateAsync({
        id: editingId,
        description: editDescription,
        featured: editFeatured,
      });
      toast.success("Produto atualizado com sucesso!");
      setEditingId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar produto");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mlLink.trim() && !affiliateLink.trim()) {
      toast.error("Forneça pelo menos um link (original ou de afiliado)");
      return;
    }

    setIsAdding(true);
    try {
      await addProductMutation.mutateAsync({
        mlLink: mlLink || undefined,
        affiliateLink: affiliateLink || undefined,
        title: manualTitle || undefined,
        price: manualPrice ? parseFloat(manualPrice) : undefined,
        imageUrl: manualImage || undefined,
        curationReason: curationReason.trim() || undefined,
      });
      toast.success("Produto adicionado com sucesso!");
      setMlLink("");
      setAffiliateLink("");
      setManualTitle("");
      setManualPrice("");
      setManualImage("");
      setCurationReason("");
      setShowAddForm(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar produto");
    } finally {
      setIsAdding(false);
    }
  };

  const filteredProducts = products?.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Flaps Admin
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{(user as any)?.name || (user as any)?.email}</span>
            <Button
              onClick={() => window.location.href = '/api/ml/auth'}
              className="bg-gradient-to-r from-accent to-primary hover:opacity-90 text-white flex items-center gap-2"
            >
              🔗 Conectar Mercado Livre
            </Button>
            <Button
              onClick={() => navigate('/admin/settings')}
              variant="outline"
              className="flex items-center gap-2"
            >
              Configuracoes
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut size={16} />
              Sair
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-border">
            <button
              onClick={() => setActiveTab("produtos")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "produtos"
                  ? "text-accent border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Meus Produtos
            </button>
            <button
              onClick={() => setActiveTab("sincronizar")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "sincronizar"
                  ? "text-accent border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sincronizar do ML
            </button>
            <button
              onClick={() => setActiveTab("importar")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "importar"
                  ? "text-accent border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Importar Produtos
            </button>
          </div>

          {/* Sincronizar Tab */}
          {activeTab === "sincronizar" && (
            <div className="mb-12">
              <MLSyncPanel />
            </div>
          )}

          {/* Importar Tab */}
          {activeTab === "importar" && (
            <div className="mb-12">
              <MLImportPanel />
            </div>
          )}

          {/* Produtos Tab */}
          {activeTab === "produtos" && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h2
                  className="text-3xl md:text-4xl font-bold text-foreground"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Gerenciar Produtos
                </h2>
                <Button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-accent hover:bg-accent/90 text-white flex items-center gap-2"
                >
                  <Plus size={20} />
                  Adicionar Produto
                </Button>
              </div>

              {/* Add Product Form */}
              {showAddForm && (
                <Card className="mb-8 p-6 bg-white border border-border">
                  <h3 className="text-xl font-bold mb-4">Adicionar Novo Produto</h3>
                  <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        URL ou ID do Mercado Livre
                      </label>
                      <Input
                        type="text"
                        placeholder="Ex: https://mercadolivre.com.br/produto-MLB123456789"
                        value={mlLink}
                        onChange={(e) => setMlLink(e.target.value)}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Link original do Mercado Livre (usado para extrair dados automaticamente)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Link de Afiliado
                      </label>
                      <Input
                        type="text"
                        placeholder="Ex: https://meli.la/seu-link-afiliado"
                        value={affiliateLink}
                        onChange={(e) => setAffiliateLink(e.target.value)}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Link de afiliado para rastreamento de comissão (obrigatório)
                      </p>
                    </div>
                    <div className="border-t pt-4 mt-4 bg-amber-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 text-sm">Dados Manuais (Recomendado para produtos de outros países)</h4>
                      <p className="text-xs text-muted-foreground mb-4">
                        Se o sistema não conseguir extrair os dados automaticamente (ex: produtos de Argentina, México), preencha manualmente os campos abaixo:
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">
                            Título
                          </label>
                          <Input
                            type="text"
                            placeholder="Título do produto"
                            value={manualTitle}
                            onChange={(e) => setManualTitle(e.target.value)}
                            className="w-full"
                          />
                        </div>

                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-semibold mb-2">
                          URL da Imagem
                        </label>
                        <Input
                          type="text"
                          placeholder="https://exemplo.com/imagem.jpg"
                          value={manualImage}
                          onChange={(e) => setManualImage(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Preencha o título, preço e imagem manualmente se a extração automática falhar
                      </p>
                      <div className="mt-4">
                        <label className="block text-sm font-semibold mb-2">
                          Por que esta peça foi selecionada?
                        </label>
                        <Textarea
                          placeholder="Ex.: Selecionada por ser versátil para o trabalho e fácil de combinar."
                          value={curationReason}
                          onChange={(e) => setCurationReason(e.target.value)}
                          maxLength={500}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Texto editorial exibido na vitrine para explicar a escolha com transparência.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={isAdding}
                        className="bg-accent hover:bg-accent/90 text-white flex items-center gap-2"
                      >
                        {isAdding && <Loader2 className="animate-spin" size={16} />}
                        Adicionar
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        variant="outline"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Search */}
              <div className="mb-6">
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Products Table */}
              {productsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-accent" size={40} />
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-4 px-4 font-semibold">Produto</th>
                        <th className="text-left py-4 px-4 font-semibold">Destaque</th>
                        <th className="text-left py-4 px-4 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b border-border hover:bg-muted/50 transition">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <ProductImage
                                src={product.imageUrl}
                                alt={product.title}
                                className="w-12 h-12 object-cover rounded"
                                fallbackClassName="w-12 h-12 rounded bg-rose-50 text-[10px] text-slate-500 flex items-center justify-center text-center px-1"
                              />
                              <div>
                                <p className="font-semibold text-foreground line-clamp-1">
                                  {product.title}
                                </p>
                                <p className="text-xs text-muted-foreground">{product.mlId}</p>
                                {product.imageNeedsReview && (
                                  <span className="inline-flex mt-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                    Imagem pendente
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => handleToggleFeatured(product.id, !product.featured)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                                product.featured
                                  ? "bg-accent/20 text-accent hover:bg-accent/30"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              {product.featured ? "Sim" : "Não"}
                            </button>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="p-2 hover:bg-muted rounded transition"
                              >
                                <Edit2 size={16} className="text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-2 hover:bg-red-50 rounded transition"
                              >
                                <Trash2 size={16} className="text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum produto encontrado. Começe adicionando um novo produto!
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Edit Modal */}
      <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              Editar Produto
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Descrição</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Digite a descrição do produto"
                className="w-full border border-border rounded-lg p-3"
                rows={4}
              />
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                checked={editFeatured}
                onCheckedChange={(checked) => setEditFeatured(checked as boolean)}
                id="featured"
              />
              <label htmlFor="featured" className="text-sm font-semibold text-foreground cursor-pointer">
                Marcar como destaque
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setEditingId(null)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
