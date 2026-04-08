import { ReactNode } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import PageTransition from "./PageTransition";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import {
  Home, TrendingUp, Clock, Users, ListMusic, Newspaper, Crown,
  Upload, Trophy, Headphones, Download, Library,
} from "lucide-react";

const sidebarLinks = [
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
    { to: "/news", icon: Newspaper, label: "News" },
    { to: "/subscription", icon: Crown, label: "Premium" },
    { to: "/artist-dashboard", icon: Upload, label: "Artist Studio" },
  ]},
];

const Layout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-[240px] flex-shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 overflow-hidden border-r border-border bg-card/30">
          <div className="flex-1 overflow-y-auto py-3 px-2 overscroll-contain">
            {sidebarLinks.map((group, gi) => (
              <div key={gi} className={group.section ? "mt-6" : ""}>
                {group.section && (
                  <h3 className="px-3 mb-2 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                    {group.section}
                  </h3>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`
                      }
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-border">
            <Link
              to="/upload"
              className="flex items-center justify-center gap-2 w-full bg-gradient-gold hover:opacity-90 text-primary-foreground font-bold text-sm rounded-xl px-4 py-2.5 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
            >
              <Upload className="h-4 w-4" />
              Upload Music
            </Link>
          </div>
        </aside>
        
        {/* Main content — proper bottom padding for mini player + bottom nav on mobile */}
        <main className="flex-1 min-w-0 overflow-y-auto h-[calc(100vh-3.5rem)] overscroll-contain scroll-smooth">
          <div className="pb-[140px] md:pb-[80px]">
            <PageTransition key={location.pathname}>
              {children}
            </PageTransition>
            <footer className="border-t border-border py-4 px-4 mt-8">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>© {new Date().getFullYear()} SudaGospel</span>
                <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                <Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
              </div>
            </footer>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default Layout;
