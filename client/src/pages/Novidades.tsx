import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Heart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { updateMetaTags, pageConfigs, generateStructuredData, breadcrumbSchema } from "@/lib/seo";
import { Header } from "@/components/Header";
import { ProductImage } from "@/components/ProductImage";
import { getDisplayTitle, getCurationReason } from "@/lib/productPresentation";

// ProductCard component copied from Home.tsx
function ProductCard({ product }: { product: any }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [, navigate] = useLocation();

  const handleAffiliate = () => {
    if (product.affiliateLink) {
      window.open(product.affiliateLink, "_blank");
    }
  };

  const handleViewDetails = () => {
    if (product.id) {
      navigate(`/produto/${product.id}`);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white border border-border h-full flex flex-col">
      <div className="relative h-40 sm:h-48 md:h-56 bg-muted overflow-hidden group flex-shrink-0">
        <ProductImage
          src={product.imageUrl}
          alt={getDisplayTitle(product)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.featured && (
          <div className="absolute top-3 left-3 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
            Destaque
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          type="button"
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          className="absolute top-3 right-3 bg-white border border-slate-300 rounded-full p-2 shadow-md hover:bg-slate-100 hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Heart size={18} fill={isFavorite ? "#d946ef" : "none"} color={isFavorite ? "#d946ef" : "#999"} />
        </button>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 line-clamp-2 mb-2">
          {getDisplayTitle(product)}
        </h3>
        <p className="text-sm text-slate-600 line-clamp-3 mb-3 flex-grow">{getCurationReason(product)}</p>
        <Button onClick={handleAffiliate} className="w-full bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          Ver no Mercado Livre
        </Button>
        {/* Affiliate Disclaimers */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="italic">Preço e disponibilidade podem mudar no site do vendedor.</p>
        </div>
      </div>
    </Card>
  );
}

export default function Novidades() {
  const [, navigate] = useLocation();
  
  // SEO Configuration
  useEffect(() => {
    updateMetaTags(pageConfigs.novidades);
    generateStructuredData("BreadcrumbList", breadcrumbSchema([
      { name: "Home", url: "https://flaps.manus.space" },
      { name: "Novidades", url: "https://flaps.manus.space/novidades" }
    ]));
  }, []);

  // Fetch all products sorted by creation date
  const { data: allProducts, isLoading, error } = trpc.products.list.useQuery();

  // Sort products by creation date (newest first)
  const noveltyProducts = allProducts
    ? [...allProducts]
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 12) // Show top 12 newest products
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-white via-muted to-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1
              className="text-5xl md:text-6xl font-bold mb-6 text-foreground"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Novidades
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Descubra os produtos mais recentes adicionados à nossa vitrine. Sempre atualizando com as melhores seleções do Mercado Livre.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-slate-900 hover:bg-slate-700 text-white flex items-center gap-2 mx-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <ArrowLeft size={16} />
              Voltar à Vitrine
            </Button>
          </div>
        </div>
      </section>

      {/* Novelty Products Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              <p className="mb-4">Erro ao carregar produtos: {error.message}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-red-700 hover:bg-red-800 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                Tentar Novamente
              </Button>
            </div>
          )}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-accent" size={40} />
            </div>
          ) : noveltyProducts && noveltyProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {noveltyProducts.map((product: any, idx: number) => (
                <ProductCard key={`${product.id || idx}`} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-4">Nenhum produto adicionado recentemente.</p>
              <Button
                onClick={() => navigate("/")}
                className="bg-slate-900 hover:bg-slate-700 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Explorar Vitrine
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-75">
            © 2026 Flaps - Vitrine de Produtos Afiliados do Mercado Livre
          </p>
        </div>
      </footer>
    </div>
  );
}
