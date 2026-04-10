import { ReactNode } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
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
        <aside className="hidden lg:flex flex-col w-[240px] flex-shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 overflow-hidden border-r border-border/40 bg-card/20">
          <div className="flex-1 overflow-y-auto py-4 px-2.5 overscroll-contain scrollbar-hide">
            {sidebarLinks.map((group, gi) => (
              <div key={gi} className={group.section ? "mt-7" : ""}>
                {group.section && (
                  <h3 className="px-3 mb-2.5 text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground/60">
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
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 group/link ${
                          isActive
                            ? "bg-primary/10 text-primary font-semibold shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={`h-[18px] w-[18px] transition-transform duration-200 group-hover/link:scale-110 ${isActive ? 'text-primary' : ''}`} />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-border/30">
            <Link
              to="/upload"
              className="flex items-center justify-center gap-2 w-full bg-gradient-gold hover:opacity-90 text-primary-foreground font-bold text-sm rounded-xl px-4 py-3 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-95"
            >
              <Upload className="h-4 w-4" />
              Upload Music
            </Link>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto h-[calc(100vh-3.5rem)] overscroll-contain scroll-smooth">
          <div className="pb-[140px] md:pb-[80px]">
            <PageTransition key={location.pathname}>
              {children}
            </PageTransition>
            <footer className="border-t border-border/30 py-5 px-4 mt-10">
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] text-muted-foreground/50">
                <span>© {new Date().getFullYear()} SudaGospel</span>
                <Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms & Conditions</Link>
                <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                <Link to="/dmca" className="hover:text-primary transition-colors">DMCA</Link>
                <Link to="/copyright" className="hover:text-primary transition-colors">Copyright</Link>
                <Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
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
