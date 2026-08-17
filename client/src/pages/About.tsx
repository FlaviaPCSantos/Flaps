import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Heart, Sparkles, Target } from "lucide-react";
import { updateMetaTags, pageConfigs, generateStructuredData, breadcrumbSchema } from "@/lib/seo";
import { Header } from "@/components/Header";

export default function About() {
  const [, navigate] = useLocation();
  
  // SEO Configuration
  useEffect(() => {
    updateMetaTags(pageConfigs.sobre);
    generateStructuredData("BreadcrumbList", breadcrumbSchema([
      { name: "Home", url: "https://flaps.manus.space" },
      { name: "Sobre", url: "https://flaps.manus.space/sobre" }
    ]));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1
            className="text-5xl md:text-6xl font-bold mb-6 text-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Sobre Flaps
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Uma vitrine elegante e cuidadosamente curada de produtos afiliados do Mercado Livre
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Story Section */}
          <div className="mb-20">
            <h2
              className="text-3xl font-bold mb-8 text-foreground"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Nossa História
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              A Flaps nasceu para tornar a busca por moda acessível mais simples e agradável. Em vez de apresentar um catálogo infinito, reunimos peças que fazem sentido para diferentes momentos do dia e estilos reais.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Nossa curadoria considera a ocasião de uso, a versatilidade da peça, a faixa de preço, as informações disponíveis no anúncio e a coerência entre fotos, descrição e proposta. Não testamos os produtos diretamente; por isso, convidamos você a conferir todos os detalhes, avaliações e condições no Mercado Livre.
            </p>
          </div>

          {/* Values Section */}
          <div className="mb-20">
            <h2
              className="text-3xl font-bold mb-12 text-foreground"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Nossos Valores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Value 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="text-accent" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-4 text-foreground">Elegância</h3>
                <p className="text-muted-foreground">
                  Cada detalhe é pensado para transmitir sofisticação e refinamento em nossa seleção de produtos.
                </p>
              </div>

              {/* Value 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="text-primary" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-4 text-foreground">Critério claro</h3>
                <p className="text-muted-foreground">
                  Priorizamos anúncios bem apresentados, com informações suficientes para você comparar e decidir com mais segurança.
                </p>
              </div>

              {/* Value 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="text-accent" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-4 text-foreground">Transparência</h3>
                <p className="text-muted-foreground">
                  A Flaps indica produtos por meio de links de afiliado e informa essa relação sem esconder como a recomendação funciona.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center py-12 px-8 bg-muted/30 rounded-2xl">
            <h2
              className="text-2xl font-bold mb-6 text-foreground"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Pronto para Explorar?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Descubra nossa coleção cuidadosamente curada de produtos afiliados do Mercado Livre.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-slate-900 hover:bg-slate-700 text-white px-8 py-4 rounded-lg text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Voltar à Vitrine
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Sobre Flaps
              </h3>
              <p className="text-sm text-gray-300">
                Uma vitrine de moda acessível com curadoria por ocasião, faixa de preço e praticidade para a vida real.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Links Rápidos
              </h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li><a href="/" className="hover:text-white transition">Vitrine</a></li>
                <li><a href="#" className="hover:text-white transition">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Redes Sociais
              </h3>
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
