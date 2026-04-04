import { ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import {
  Home,
  TrendingUp,
  Clock,
  Users,
  ListMusic,
  BarChart3,
  Newspaper,
} from "lucide-react";

const sidebarLinks = [
  { section: "BROWSE", items: [
    { to: "/", icon: Home, label: "Home" },
    { to: "/music", icon: TrendingUp, label: "Trending Songs" },
    { to: "/music?sort=recent", icon: Clock, label: "Recently Added" },
    { to: "/artists", icon: Users, label: "Artists" },
  ]},
  { section: "LIBRARY", items: [
    { to: "/playlists", icon: ListMusic, label: "Playlists" },
    { to: "/news", icon: Newspaper, label: "News" },
  ]},
];

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-border bg-background overflow-y-auto py-4">
          {sidebarLinks.map((group) => (
            <div key={group.section} className="mb-4 px-4">
              <h3 className="text-[10px] font-bold tracking-widest text-primary mb-2">
                {group.section}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </aside>
        
        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
};

export default Layout;
