import { Search, Crown, Menu } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import SearchOverlay from "./SearchOverlay";
import NotificationBell from "./NotificationBell";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Home, TrendingUp, Clock, Users, ListMusic, Newspaper, Crown as CrownIcon,
  Upload, Trophy, Headphones, Download, Library, Video, Settings, Vote,
} from "lucide-react";

const drawerLinks = [
  { section: null, items: [
    { to: "/", icon: Home, label: "Home" },
    { to: "/music", icon: TrendingUp, label: "Explore" },
    { to: "/artists", icon: Users, label: "Artists" },
    { to: "/most-listened", icon: Headphones, label: "Top Songs" },
    { to: "/new-songs", icon: Clock, label: "New Songs" },
    { to: "/hall-of-fame", icon: Trophy, label: "Hall of Fame" },
  ]},
  { section: "Your Library", items: [
    { to: "/library", icon: Library, label: "Library" },
    { to: "/playlists", icon: ListMusic, label: "Playlists" },
    { to: "/downloads", icon: Download, label: "Downloads" },
    { to: "/videos", icon: Video, label: "Videos" },
    { to: "/vote", icon: Vote, label: "Vote" },
    { to: "/news", icon: Newspaper, label: "News" },
    { to: "/subscription", icon: CrownIcon, label: "Premium" },
    { to: "/artist-dashboard", icon: Upload, label: "Artist Studio" },
  ]},
  { section: "More", items: [
    { to: "/admin", icon: Settings, label: "Admin Panel" },
  ]},
];

const TopBar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: settings } = useSiteSettings();
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const siteName = settings?.site_name || "Sudagospel";

  return (
    <>
      <header className="sticky top-0 z-50 h-14 border-b border-border/30 bg-background/80 backdrop-blur-2xl">
        <div className="flex h-full items-center justify-between gap-3 px-3 lg:px-6">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden rounded-full h-10 w-10 flex items-center justify-center text-muted-foreground active:text-foreground active:scale-90 transition-all"
          >
            <Menu className="h-[22px] w-[22px]" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group active:scale-95 transition-transform">
            <img src={logoImg} alt="Sudagospel" className="h-9 object-contain" />
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
            <NotificationBell />
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
                className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center active:scale-90 transition-all ring-2 ring-primary/20 hover:ring-primary/40"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                    {(profile?.display_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
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

      {/* Mobile navigation drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-background border-r border-border/40">
          <SheetHeader className="p-4 pb-3 border-b border-border/30">
            {user ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                    {(profile?.display_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{profile?.display_name || user.email?.split("@")[0]}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            ) : (
              <SheetTitle className="flex items-center gap-2">
                <img src={logoImg} alt="Sudagospel" className="h-8 object-contain" />
                <span className="text-base font-bold">{siteName}</span>
              </SheetTitle>
            )}
          </SheetHeader>
          <nav className="flex-1 overflow-y-auto py-3 px-2">
            {drawerLinks.map((group, gi) => (
              <div key={gi} className={group.section ? "mt-5" : ""}>
                {group.section && (
                  <h3 className="px-3 mb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground/60">
                    {group.section}
                  </h3>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      onClick={() => setDrawerOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={`h-[18px] w-[18px] ${isActive ? 'text-primary' : ''}`} />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Upload button at bottom */}
          <div className="p-3 border-t border-border/30">
            <Link
              to="/upload"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-xl px-4 py-3 transition-all active:scale-95"
            >
              <Upload className="h-4 w-4" />
              Upload Music
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default TopBar;
