import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Heart, Search, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateMetaTags, pageConfigs, organizationSchema, generateStructuredData } from "@/lib/seo";
import { Header } from "@/components/Header";
import { ProductImage } from "@/components/ProductImage";
import { getDisplayTitle, getCurationReason, getOccasion } from "@/lib/productPresentation";

const occasionCategories = [
  { key: "todos", label: "Todos" },
  { key: "trabalho", label: "Trabalho" },
  { key: "festa", label: "Festa" },
  { key: "basicos", label: "Básicos" },
  { key: "achados", label: "Achados baratos" },
] as const;

export default function Home() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<"relevance" | "newest" | "featured">("relevance");
  
  // SEO Configuration
  useEffect(() => {
    updateMetaTags(pageConfigs.home);
    generateStructuredData("Organization", organizationSchema);
  }, []);

  // Fetch featured products
  const { data: featuredProducts, isLoading: featuredLoading } =
    trpc.products.featured.useQuery();

  // Fetch all products
  const { data: allProducts, isLoading: allLoading } = trpc.products.list.useQuery();

  // Categories are organized by occasion to make discovery more useful than technical product labels.

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    }
  };

  // Filter local products by search query
  const searchedLocalProducts = allProducts?.filter((p: any) => {
    const query = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(query) || 
           (p.description && p.description.toLowerCase().includes(query));
  }) || [];

  const displayProducts = showSearchResults ? searchedLocalProducts : allProducts;
  const isLoading = allLoading;
  const searchError = null;

  // Filter products by category
  let filteredProducts = displayProducts?.filter((p: any) => {
    const inCategory = selectedCategory === "todos" || getOccasion(p) === selectedCategory;
    return inCategory;
  }) || [];

  // Sort products
  if (sortBy === "newest") {
    filteredProducts = [...filteredProducts].sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  } else if (sortBy === "featured") {
    filteredProducts = [...filteredProducts].sort((a: any, b: any) => {
      if (a.featured === b.featured) return 0;
      return a.featured ? -1 : 1;
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-white via-muted to-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Bem-vindo ao <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Flaps</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Flaps: curadoria de moda acessível para você que quer se vestir bem sem perder horas procurando.
            </p>
            
            {/* Affiliate Disclaimer - Shown once at the top */}
            <div className="bg-muted/30 border border-muted rounded-lg p-4 mb-8 text-sm text-muted-foreground">
              <p className="italic">A Flaps pode receber uma comissão pelas compras realizadas por meio dos links indicados, sem custo adicional para você.</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-12">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent transition"
                >
                  <Search size={20} />
                </button>
              </div>
              <Button
                type="submit"
                className="bg-slate-900 hover:bg-slate-700 text-white px-6 sm:px-8 rounded-lg transition w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Buscar
              </Button>
            </form>

            <Button
              className="bg-slate-900 hover:bg-slate-700 text-white px-8 py-3 rounded-lg text-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              onClick={() => setShowSearchResults(false)}
            >
              Explorar Vitrine
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      {!showSearchResults && (
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h3
              className="text-3xl md:text-4xl font-bold mb-12 text-center text-foreground"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Destaques
            </h3>

            {featuredLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-accent" size={40} />
              </div>
            ) : featuredProducts && featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum produto em destaque no momento.
              </div>
            )}
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h3
            className="text-3xl md:text-4xl font-bold mb-12 text-center text-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Como Funciona
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                1
              </div>
              <h4 className="font-bold text-lg mb-2 text-foreground">Pesquisamos</h4>
              <p className="text-sm text-muted-foreground">
                A Flaps pesquisa e seleciona as melhores peças de moda para você.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                2
              </div>
              <h4 className="font-bold text-lg mb-2 text-foreground">Você Escolhe</h4>
              <p className="text-sm text-muted-foreground">
                Escolha as opções que combinam com seu estilo na nossa vitrine.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                3
              </div>
              <h4 className="font-bold text-lg mb-2 text-foreground">Confira a Oferta</h4>
              <p className="text-sm text-muted-foreground">
                Ao clicar, confere a oferta diretamente no Mercado Livre.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                4
              </div>
              <h4 className="font-bold text-lg mb-2 text-foreground">Compre com Segurança</h4>
              <p className="text-sm text-muted-foreground">
                Pagamento, entrega, troca e atendimento são realizados pela plataforma e vendedor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* All Products Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h3
            className="text-3xl md:text-4xl font-bold mb-12 text-center text-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {showSearchResults ? "Resultados da Busca" : "Todos os Produtos"}
          </h3>

          {searchError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              Erro ao buscar produtos: {searchError}
            </div>
          )}

          {/* Filter and Sort Bar */}
          <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Occasion Filter */}
            {!showSearchResults && (
              <div className="flex flex-wrap gap-2 justify-center md:justify-start w-full md:w-auto">
                {occasionCategories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`px-4 py-2 rounded-full border transition text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      selectedCategory === category.key
                        ? "bg-primary text-white border-primary"
                        : "bg-white border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-primary"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="w-full md:w-auto">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full md:w-48 bg-white border border-border">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevância</SelectItem>
                  <SelectItem value="newest">Mais Recentes</SelectItem>
                  <SelectItem value="featured">Destaques</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>



          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-accent" size={40} />
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts?.map((product: any, idx: number) => (
                  <ProductCard key={`${product.id || idx}`} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {showSearchResults
                ? `Nenhum produto encontrado para "${searchQuery}". Tente outra busca.`
                : "Nenhum produto disponível no momento."}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Sobre Flaps
              </h4>
              <p className="text-sm text-gray-300">
                Uma vitrine de moda acessível com curadoria por ocasião, faixa de preço e praticidade para a vida real.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Links Rápidos
              </h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li><a href="#" className="hover:text-white transition">Vitrine</a></li>
                <li><a href="#" className="hover:text-white transition">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Redes Sociais
              </h4>
              <div className="flex gap-4">
                <a href="/sobre" className="text-gray-300 hover:text-white transition">Sobre</a>
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

/**
 * Product Card Component
 */
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
      {/* Image Container */}
      <div className="relative h-40 sm:h-48 md:h-56 bg-muted overflow-hidden group flex-shrink-0">
        <ProductImage
          src={product.imageUrl}
          alt={getDisplayTitle(product)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {product.featured && (
            <span className="bg-accent text-white text-xs px-2 py-1 rounded-full font-semibold">
              Em Destaque
            </span>
          )}
          {product.isMostSold && (
            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full font-semibold">
              Mais Vendido
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          type="button"
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          className="absolute top-3 right-3 p-2 bg-white border border-slate-300 rounded-full shadow-md hover:bg-slate-100 hover:shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Heart
            size={20}
            className={isFavorite ? "fill-accent text-accent" : "text-muted-foreground"}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex-grow flex flex-col">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 line-clamp-2 mb-2">
          {getDisplayTitle(product)}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 mb-3 flex-grow">
          {getCurationReason(product)}
        </p>

        {/* CTA Button */}
        <Button
          onClick={handleAffiliate}
          className="w-full bg-slate-900 hover:bg-slate-700 text-white rounded-lg transition py-2 text-xs sm:text-sm font-semibold mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Ver no Mercado Livre
        </Button>

        <p className="text-xs text-slate-500 mt-2">Preço e disponibilidade podem mudar no site do vendedor.</p>
      </div>
    </Card>
  );
}
