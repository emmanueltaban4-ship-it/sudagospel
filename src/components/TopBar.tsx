import { Search, Upload, Menu, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import logo from "@/assets/logo.png";
import ThemeToggle from "./ThemeToggle";
import SearchOverlay from "./SearchOverlay";
import { useSiteSettings } from "@/hooks/use-site-settings";

const navLinks = [
  { to: "/", label: "DISCOVER" },
  { to: "/playlists", label: "PLAYLISTS" },
  { to: "/news", label: "NEWS" },
];

const TopBar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: settings } = useSiteSettings();

  const siteName = settings?.site_name || "Sudagospel";
  const logoUrl = settings?.logo_url || "";

  return (
    <>
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={logoUrl || logo} alt={siteName} className="h-7 w-7 rounded object-contain" />
            <span className="font-heading text-lg font-extrabold text-primary hidden sm:block">
              {siteName}
            </span>
          </Link>

          {/* Search bar - desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Search for artists, songs, albums!</span>
            </button>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-bold tracking-wide transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            <ThemeToggle />
            <Link
              to="/upload"
              className="hidden sm:inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-full px-4 py-2 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              UPLOAD
            </Link>
          </div>
        </div>
      </header>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default TopBar;
