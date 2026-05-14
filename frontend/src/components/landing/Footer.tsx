import { Zap } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container mx-auto px-4 md:px-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">SPI</span>
        </div>

        <p className="text-sm text-muted-foreground text-center">La façon la plus simple d'accepter MonCash</p>

        <div className="flex gap-6 text-sm text-muted-foreground">
          {[
            { label: "Docs", href: "#code-examples" },
            { label: "Support", href: "#" },
            { label: "Conditions", href: "#" },
            { label: "Confidentialité", href: "#" },
          ].map((link) => (
            <a key={link.label} href={link.href} className="hover:text-foreground transition-colors">
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        © 2025 SPI. Non affilié à Digicel ni à MonCash.
      </div>
    </div>
  </footer>
);

export default Footer;
