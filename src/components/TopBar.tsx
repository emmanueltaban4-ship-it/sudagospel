import { Search, Upload, Crown } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
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
      <header className="sticky top-0 z-50 h-14 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex h-full items-center justify-between gap-4 px-4 lg:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-extrabold text-sm">SG</span>
            </div>
            <span className="font-heading text-lg font-extrabold text-foreground hidden sm:block tracking-tight">
              {siteName}
            </span>
          </Link>

          {/* Center search — desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2 rounded-full bg-muted/60 border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:border-muted-foreground/20 transition-all"
            >
              <Search className="h-4 w-4" />
              <span>Search songs, artists...</span>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            <ThemeToggle />
            <Link
              to="/subscription"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-3 py-1.5"
            >
              <Crown className="h-3.5 w-3.5" />
              Premium
            </Link>
            {user ? (
              <Link
                to="/profile"
                className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-xs hover:bg-primary/20 transition-colors"
              >
                {user.email?.[0]?.toUpperCase() || "U"}
              </Link>
            ) : (
              <Link
                to="/auth"
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-3 py-1.5"
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
