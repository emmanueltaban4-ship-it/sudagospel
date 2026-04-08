import { Home, Search, Library, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/music", icon: Search, label: "Search" },
  { to: "/library", icon: Library, label: "Library" },
  { to: "/profile", icon: User, label: "Profile" },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-2xl md:hidden safe-area-bottom">
      <div className="flex items-stretch justify-around px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[56px] px-3 py-2 text-[11px] font-semibold transition-all duration-200 active:scale-90 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-primary glow-gold" />
                )}
                <div className={isActive ? "drop-shadow-[0_0_8px_hsl(45_90%_55%/0.4)]" : ""}>
                  <item.icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
