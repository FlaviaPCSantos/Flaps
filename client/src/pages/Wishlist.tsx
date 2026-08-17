import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { Header } from "@/components/Header";
import { ProductImage } from "@/components/ProductImage";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { updateMetaTags, pageConfigs } from "@/lib/seo";

export default function Wishlist() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // SEO Configuration
  useEffect(() => {
    updateMetaTags(pageConfigs.wishlist || {
      title: "Minha Lista de Desejos - Flaps",
      description: "Veja todos os produtos que você salvou na sua lista de desejos",
    });
  }, []);

  const { data: wishlistItems, isLoading } = trpc.wishlists.getList.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: allProducts } = trpc.products.list.useQuery();
  const removeMutation = trpc.wishlists.remove.useMutation();

  // Load products for wishlist items
  useEffect(() => {
    if (wishlistItems && allProducts) {
      setIsLoadingProducts(true);
      const wishlistProductIds = new Set(wishlistItems.map(w => w.productId));
      const wishlistProducts = allProducts.filter(p => wishlistProductIds.has(p.id));
      setProducts(wishlistProducts);
      setIsLoadingProducts(false);
    }
  }, [wishlistItems, allProducts]);

  const handleRemoveFromWishlist = async (productId: number) => {
    await removeMutation.mutateAsync({ productId });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Você precisa estar logado para ver sua lista de desejos</p>
          <Button onClick={() => navigate("/")} className="bg-slate-900 hover:bg-slate-700 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            Voltar à Vitrine
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-white via-muted to-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <Heart size={40} className="fill-accent text-accent" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Minha Lista de Desejos</h1>
            <p className="text-lg text-muted-foreground">
              {products?.length || 0} produto{products?.length !== 1 ? "s" : ""} salvado{products?.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </section>

      {/* Wishlist Items */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {isLoading || isLoadingProducts ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white border border-border h-full flex flex-col">
                  <div className="relative h-48 bg-muted overflow-hidden group flex-shrink-0">
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-semibold line-clamp-2 mb-2">{product.title}</h3>
                    
                    {product.price && (
                      <p className="text-lg font-bold text-accent mb-3">
                        R$ {parseFloat(String(product.price)).toFixed(2)}
                      </p>
                    )}

                    <div className="space-y-2 mt-auto">
                      <Button
                        onClick={() => window.open(product.affiliateLink, "_blank")}
                        className="w-full bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        Ver no Mercado Livre
                      </Button>
                      <Button
                        onClick={() => handleRemoveFromWishlist(product.id)}
                        variant="outline"
                        className="w-full"
                      >
                        <Heart size={16} className="mr-2" />
                        Remover da Lista
                      </Button>
                    </div>

                    {/* Affiliate Disclaimers */}
                    <div className="space-y-1 text-xs text-muted-foreground mt-3">
                      <p className="italic">Preço e disponibilidade podem mudar no site do vendedor.</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-4">Sua lista de desejos está vazia</p>
              <Button onClick={() => navigate("/")} className="bg-slate-900 hover:bg-slate-700 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                Explorar Produtos
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
