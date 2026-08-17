import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Heart, Share2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { updateMetaTags, generateStructuredData, breadcrumbSchema } from "@/lib/seo";
import { RatingComponent } from "@/components/RatingComponent";
import { WishlistButton } from "@/components/WishlistButton";
import { Header } from "@/components/Header";
import { ProductImage } from "@/components/ProductImage";
import { getDisplayTitle, getCurationReason } from "@/lib/productPresentation";

export default function ProductDetail() {
  const [, params] = useRoute("/produto/:id");
  const [, navigate] = useLocation();
  const [isFavorite, setIsFavorite] = useState(false);

  const productId = params?.id ? parseInt(params.id) : null;

  const { data: product, isLoading } = trpc.products.byId.useQuery(
    { id: productId! },
    { enabled: !!productId }
  );
  
  // SEO Configuration
  useEffect(() => {
    if (product) {
      updateMetaTags({
        title: `${product.title} | Flaps`,
        description: product.description || `Compre ${product.title} com desconto no Mercado Livre através do Flaps.`,
        keywords: [`${product.title}`, "Mercado Livre", "afiliado", "comprar"],
        url: `https://flaps.manus.space/produto/${product.id}`,
        image: product.imageUrl || undefined,
        type: "product",
      });
      
      const productSchema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.title,
        "description": product.description || "",
        "image": product.imageUrl || "",
        "offers": {
          "@type": "Offer",
          "price": product.price,
          "priceCurrency": "BRL",
          "availability": "https://schema.org/InStock"
        }
      };
      generateStructuredData("Product", productSchema);
      
      const breadcrumb = breadcrumbSchema([
        { name: "Home", url: "https://flaps.manus.space" },
        { name: "Produtos", url: "https://flaps.manus.space/vitrine" },
        { name: product.title, url: `https://flaps.manus.space/produto/${product.id}` }
      ]);
      generateStructuredData("BreadcrumbList", breadcrumb as any);
    }
  }, [product, navigate]);

  if (!productId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <Button onClick={() => navigate("/")} className="bg-slate-900 hover:bg-slate-700 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            Voltar à Vitrine
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <Button onClick={() => navigate("/")} className="bg-slate-900 hover:bg-slate-700 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            Voltar à Vitrine
          </Button>
        </div>
      </div>
    );
  }

  const handleAffiliate = () => {
    if (product.affiliateLink) {
      window.open(product.affiliateLink, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Product Detail */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Image */}
            <div className="flex items-center justify-center">
              <Card className="w-full bg-muted overflow-hidden">
                <ProductImage
                  src={product.imageUrl}
                  alt={getDisplayTitle(product)}
                  className="w-full h-auto object-cover"
                  fallbackClassName="w-full h-96 flex items-center justify-center bg-gradient-to-br from-rose-50 to-stone-100 text-sm text-slate-500"
                />
              </Card>
            </div>

            {/* Details */}
            <div className="flex flex-col justify-center">
              <h1
                className="text-4xl md:text-5xl font-bold mb-6 text-foreground"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {getDisplayTitle(product)}
              </h1>

              <p className="text-sm text-slate-600 mb-6">{getCurationReason(product)}</p>

              {/* Description */}
              {product.description && (
                <div className="mb-8">
                  <p className="text-sm text-muted-foreground mb-3 font-semibold">Descrição</p>
                  <p className="text-foreground leading-relaxed text-base">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-4 mb-8">
                <Button
                  onClick={handleAffiliate}
                  className="w-full bg-slate-900 hover:bg-slate-700 text-white py-4 rounded-lg text-lg font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Ver no Mercado Livre
                </Button>

                {/* Affiliate Disclaimers */}
                <div className="space-y-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  <p className="italic">Preço e disponibilidade podem mudar no site do vendedor.</p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    aria-pressed={isFavorite}
                    aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-300 bg-white text-slate-800 rounded-lg hover:bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <Heart
                      size={20}
                      className={isFavorite ? "fill-accent text-accent" : "text-muted-foreground"}
                    />
                    <span className="text-foreground">
                      {isFavorite ? "Favoritado" : "Favoritar"}
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label="Compartilhar produto"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: getDisplayTitle(product), url: window.location.href }).catch(() => undefined);
                      } else {
                        void navigator.clipboard?.writeText(window.location.href);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-300 bg-white text-slate-800 rounded-lg hover:bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <Share2 size={20} className="text-slate-700" />
                    <span>Compartilhar</span>
                  </button>
                </div>
              </div>

              {/* Wishlist Button */}
              <div className="border-t border-border pt-8 mb-8">
                <WishlistButton productId={product.id} />
              </div>

              {/* Ratings Section */}
              <div className="border-t border-border pt-8 mb-8">
                <h3 className="text-xl font-semibold mb-6">Avaliações</h3>
                <RatingComponent productId={product.id} />
              </div>

              {/* Additional Info */}
              <div className="border-t border-border pt-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Este é um link de afiliada do Mercado Livre. Ao comprar através deste link, você nos ajuda a manter o Flaps funcionando.
                </p>
                <p className="text-xs text-muted-foreground">
                  ID do Produto: {product.mlId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Sobre Flaps
              </h4>
              <p className="text-sm text-gray-300">
                Uma vitrine elegante de produtos afiliados do Mercado Livre, com curadoria cuidadosa e design sofisticado.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Links Rápidos
              </h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li><a href="/" className="hover:text-white transition">Vitrine</a></li>
                <li><a href="#" className="hover:text-white transition">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Redes Sociais
              </h4>
              <div className="flex gap-4">
                <a href="#" className="text-gray-300 hover:text-white transition">Instagram</a>
                <a href="#" className="text-gray-300 hover:text-white transition">Pinterest</a>
                <a href="#" className="text-gray-300 hover:text-white transition">TikTok</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-300">
            <p>&copy; 2026 Flaps. Todos os direitos reservados. | Links de afiliada do Mercado Livre</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
