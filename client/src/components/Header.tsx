import { useLocation } from "wouter";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Header() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "Vitrine" },
    { href: "/novidades", label: "Novidades" },
    { href: "/sobre", label: "Sobre" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Flaps
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-6 items-center">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`transition ${location === link.href ? "text-accent font-semibold" : "text-foreground hover:text-accent"}`}
            >
              {link.label}
            </a>
          ))}
          <a href="#contato" className="text-foreground hover:text-accent transition">Contato</a>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className="md:hidden p-2 text-slate-800 hover:bg-slate-100 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-3">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`rounded-lg px-3 py-3 transition ${location === link.href ? "bg-slate-100 text-accent font-semibold" : "text-slate-800 hover:bg-slate-100"}`}
              >
                {link.label}
              </a>
            ))}
            <a href="#contato" onClick={() => setIsOpen(false)} className="rounded-lg px-3 py-3 text-slate-800 hover:bg-slate-100 transition">Contato</a>
          </div>
        </div>
      )}
    </nav>
  );
}
