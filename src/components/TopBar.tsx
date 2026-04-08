import { Search, Crown } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import SearchOverlay from "./SearchOverlay";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useAuth } from "@/hooks/use-auth";

const TopBar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: settings } = useSiteSettings();
  const { user } = useAuth();

  const siteName = settings?.site_name || "Sudagospel";

  return (
    <>
      <header className="sticky top-0 z-50 h-14 border-b border-border/30 bg-background/80 backdrop-blur-2xl">
        <div className="flex h-full items-center justify-between gap-3 px-3 lg:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group active:scale-95 transition-transform">
            <div className="h-9 w-9 rounded-xl bg-gradient-gold flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
              <span className="text-primary-foreground font-heading font-black text-sm">SG</span>
            </div>
            <span className="font-heading text-lg font-extrabold text-foreground hidden sm:block tracking-tight">
              {siteName}
            </span>
          </Link>

          {/* Center search — desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2.5 rounded-full bg-muted/40 border border-border/50 px-4 py-2.5 text-sm text-muted-foreground/60 hover:bg-muted/60 hover:border-primary/20 hover:text-muted-foreground transition-all"
            >
              <Search className="h-4 w-4" />
              <span>Search songs, artists...</span>
              <kbd className="ml-auto hidden lg:inline-flex items-center gap-0.5 rounded border border-border/50 bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/50">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden rounded-full h-10 w-10 flex items-center justify-center text-muted-foreground active:text-foreground active:scale-90 transition-all"
            >
              <Search className="h-[22px] w-[22px]" />
            </button>
            <ThemeToggle />
            <Link
              to="/subscription"
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary/80 transition-all px-3 py-2 rounded-full border border-primary/20 hover:border-primary/40 hover:bg-primary/5"
            >
              <Crown className="h-3.5 w-3.5" />
              Premium
            </Link>
            {user ? (
              <Link
                to="/profile"
                className="h-9 w-9 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold text-xs active:scale-90 transition-all ring-2 ring-primary/20 hover:ring-primary/40"
              >
                {user.email?.[0]?.toUpperCase() || "U"}
              </Link>
            ) : (
              <Link
                to="/auth"
                className="text-sm font-bold text-primary-foreground bg-primary active:bg-primary/80 active:scale-95 transition-all px-4 py-2 rounded-full hover:shadow-lg hover:shadow-primary/30"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </header>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default TopBar;
