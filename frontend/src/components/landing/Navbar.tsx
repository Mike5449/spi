import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  ChevronDown,
  Code2,
  Home,
  KeyRound as KeyRoundIcon,
  LogIn,
  LogOut,
  Menu,
  Rocket,
  ShieldCheck,
  Sparkles,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

/** Liens dans le menu déroulant "Développeur". Ils pointent tous sur /developpeur#... */
type DevLink = {
  label: string;
  href: string;
  sectionId: string;
  icon: typeof Home;
};

const DEV_LINKS: DevLink[] = [
  { label: "Fonctionnalités", href: "/developpeur#features", sectionId: "features", icon: Sparkles },
  { label: "Docs", href: "/developpeur#code-examples", sectionId: "code-examples", icon: Code2 },
  { label: "Démarrer", href: "/developpeur#how-it-works", sectionId: "how-it-works", icon: Rocket },
];

const DEVELOPER_HOME_HREF = "/developpeur#home";

/** Liens ancres vers les sections de la page d'accueil (Services / Process / Contact). */
const HOME_ANCHORS = [
  { label: "Services", href: "/#services" },
  { label: "Comment ça marche ?", href: "/#processus" },
  { label: "Contact", href: "/#contact" },
] as const;

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  /** Dropdown "Développeur" — s'ouvre au clic sur le chevron */
  const [devMenuOpen, setDevMenuOpen] = useState(false);
  const devMenuRef = useRef<HTMLDivElement | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, username, isSuperAdmin, logout } = useAuth();

  // Style "scrolled"
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fermer le dropdown "Développeur" sur clic externe ou touche Escape
  useEffect(() => {
    if (!devMenuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (
        devMenuRef.current &&
        !devMenuRef.current.contains(e.target as Node)
      ) {
        setDevMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDevMenuOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [devMenuOpen]);

  // Scroll-spy : ne fonctionne que sur /developpeur
  useEffect(() => {
    if (location.pathname !== "/developpeur") {
      setActiveSection("");
      return;
    }
    const ids = DEV_LINKS.map((l) => l.sectionId);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    const onScrollTop = () => {
      if (window.scrollY < 80) setActiveSection("home");
    };
    onScrollTop();
    window.addEventListener("scroll", onScrollTop);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScrollTop);
    };
  }, [location.pathname]);

  const handleDevLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    // Si on est déjà sur /developpeur, scroll smooth ; sinon, navigation classique
    if (location.pathname === "/developpeur") {
      e.preventDefault();
      const hash = href.split("#")[1];
      if (hash) {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      e.preventDefault();
      navigate(href);
    }
  };

  /**
   * Handler pour les ancres de la page d'accueil ("/#services", "/#processus", ...).
   * Smooth scroll si déjà sur "/" (ou "/services"), navigation sinon.
   */
  const handleHomeAnchorClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    const onHome =
      location.pathname === "/" || location.pathname === "/services";
    if (onHome) {
      e.preventDefault();
      const hash = href.split("#")[1];
      if (hash) {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      e.preventDefault();
      navigate(href);
    }
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/");
  };

  const isDevSectionActive =
    location.pathname === "/developpeur" && activeSection !== "";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "nav-blur border-b border-border" : ""
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4 md:px-8">
        {/* Logo → / (Services) */}
        <Link to="/" className="flex items-center gap-2" aria-label="SPI — Accueil">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold text-foreground">SPI</span>
            <span className="text-[10px] text-muted-foreground -mt-0.5">
              Système de Paiement Intégré
            </span>
          </div>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Lien Accueil (top-level) — scroll vers la section Hero */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={
              location.pathname === "/" || location.pathname === "/services"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            <a
              href="/#accueil"
              onClick={(e) => handleHomeAnchorClick(e, "/#accueil")}
            >
              <Home className="mr-1.5 h-4 w-4" /> Accueil
            </a>
          </Button>

          {/* Ancres vers les sections de la home */}
          {HOME_ANCHORS.map((a) => (
            <Button
              key={a.href}
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <a
                href={a.href}
                onClick={(e) => handleHomeAnchorClick(e, a.href)}
              >
                {a.label}
              </a>
            </Button>
          ))}

          {/*
            "Développeur" en split-button :
            - clic sur le texte/icône → navigation vers /developpeur#home
            - clic sur le chevron → ouvre / ferme le sous-menu
            - clic en dehors / Escape → ferme le sous-menu
          */}
          <div ref={devMenuRef} className="relative flex items-center">
            {/* Partie navigation */}
            <a
              href={DEVELOPER_HOME_HREF}
              onClick={(e) => {
                handleDevLinkClick(e, DEVELOPER_HOME_HREF);
                setDevMenuOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-l-md text-sm font-medium transition-colors ${
                isDevSectionActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code2 className="h-4 w-4" />
              Développeur
            </a>

            {/* Partie chevron — ouvre le dropdown */}
            <button
              type="button"
              onClick={() => setDevMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={devMenuOpen}
              aria-label="Voir les sections développeur"
              className={`inline-flex items-center pr-3 pl-1 py-1.5 rounded-r-md transition-colors ${
                isDevSectionActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  devMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {devMenuOpen && (
              <div
                role="menu"
                className="absolute top-full right-0 mt-1 w-56 rounded-md border border-border bg-popover text-popover-foreground shadow-lg p-1 z-50"
              >
                {DEV_LINKS.map((l) => {
                  const Icon = l.icon;
                  const active = activeSection === l.sectionId;
                  return (
                    <a
                      key={l.sectionId}
                      href={l.href}
                      role="menuitem"
                      onClick={(e) => {
                        handleDevLinkClick(e, l.href);
                        setDevMenuOpen(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-secondary transition-colors ${
                        active
                          ? "text-primary font-semibold"
                          : "text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {l.label}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                title={username ?? undefined}
              >
                <Link to="/tableau-de-bord">
                  {isSuperAdmin ? (
                    <ShieldCheck className="mr-1.5 h-4 w-4" />
                  ) : (
                    <KeyRoundIcon className="mr-1.5 h-4 w-4" />
                  )}
                  {isSuperAdmin ? "Admin" : "Mon espace"}
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
                title={username ? `Déconnecter ${username}` : "Déconnexion"}
              >
                <LogOut className="mr-1.5 h-4 w-4" /> Déconnexion
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Link to="/connexion">
                  <LogIn className="mr-1.5 h-4 w-4" /> Connexion
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                <Link to="/inscription">
                  <UserPlus className="mr-1.5 h-4 w-4" /> Inscription
                </Link>
              </Button>
            </div>
          )}
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile */}
      {mobileOpen && (
        <div className="md:hidden nav-blur border-b border-border px-4 pb-4">
          {/* Lien Accueil top-level — scroll vers la section Hero */}
          <a
            href="/#accueil"
            onClick={(e) => {
              handleHomeAnchorClick(e, "/#accueil");
              setMobileOpen(false);
            }}
            className={`flex items-center gap-2 py-2 text-sm transition-colors ${
              location.pathname === "/" || location.pathname === "/services"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="h-4 w-4" />
            Accueil
          </a>

          {/* Ancres vers les sections de la home */}
          {HOME_ANCHORS.map((a) => (
            <a
              key={a.href}
              href={a.href}
              onClick={(e) => {
                handleHomeAnchorClick(e, a.href);
                setMobileOpen(false);
              }}
              className="block py-2 pl-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {a.label}
            </a>
          ))}

          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-3 pb-1">
            Développeur
          </div>
          {/* Lien cliquable vers la home de la section Développeur */}
          <a
            href={DEVELOPER_HOME_HREF}
            onClick={(e) => {
              handleDevLinkClick(e, DEVELOPER_HOME_HREF);
              setMobileOpen(false);
            }}
            className={`flex items-center gap-2 py-2 text-sm transition-colors ${
              location.pathname === "/developpeur" && activeSection === "home"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code2 className="h-4 w-4" />
            Vue d'ensemble
          </a>
          {DEV_LINKS.map((l) => {
            const Icon = l.icon;
            const active = activeSection === l.sectionId;
            return (
              <a
                key={l.sectionId}
                href={l.href}
                onClick={(e) => {
                  handleDevLinkClick(e, l.href);
                  setMobileOpen(false);
                }}
                className={`flex items-center gap-2 py-2 pl-6 text-sm transition-colors ${
                  active
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {l.label}
              </a>
            );
          })}

          <div className="mt-3 pt-3 border-t border-border space-y-2">
            {isAuthenticated ? (
              <>
                <Button asChild variant="outline" className="w-full">
                  <Link
                    to="/tableau-de-bord"
                    onClick={() => setMobileOpen(false)}
                  >
                    {isSuperAdmin ? (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" /> Admin
                      </>
                    ) : (
                      <>
                        <KeyRoundIcon className="mr-2 h-4 w-4" /> Mon espace
                      </>
                    )}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/connexion" onClick={() => setMobileOpen(false)}>
                    <LogIn className="mr-2 h-4 w-4" /> Connexion
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Link to="/inscription" onClick={() => setMobileOpen(false)}>
                    <UserPlus className="mr-2 h-4 w-4" /> Inscription
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
