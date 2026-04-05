import { Home, Music, Users, User, Youtube } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/music", icon: Music, label: "Explore" },
  { to: "/videos", icon: Youtube, label: "Videos" },
  { to: "/artists", icon: Users, label: "Artists" },
  { to: "/profile", icon: User, label: "You" },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-xl md:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-1.5 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
