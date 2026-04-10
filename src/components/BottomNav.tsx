import { Home, Search, Library, User, Video } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/music", icon: Search, label: "Search" },
  { to: "/videos", icon: Video, label: "Videos" },
  { to: "/library", icon: Library, label: "Library" },
  { to: "/profile", icon: User, label: "Profile" },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-background/90 backdrop-blur-2xl md:hidden safe-area-bottom">
      <div className="flex items-stretch justify-around px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[56px] px-3 py-2 text-[10px] font-bold tracking-wide transition-all duration-200 active:scale-90 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground/60"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-b-full bg-primary shadow-[0_2px_12px_hsl(43_96%_56%/0.5)]" />
                )}
                <div className={`transition-all duration-200 ${isActive ? "scale-110" : ""}`}>
                  <item.icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="leading-none uppercase">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
