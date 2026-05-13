import { Home, Compass, Search, Library, Newspaper } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import SearchOverlay from "./SearchOverlay";

const tabs = [
  { to: "/", icon: Home, label: "Feed", end: true },
  { to: "/music", icon: Compass, label: "Browse" },
  { to: "__search__", icon: Search, label: "Search" },
  { to: "/library", icon: Library, label: "My Library" },
  { to: "/news", icon: Newspaper, label: "News" },
];

const BottomNav = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background md:hidden safe-area-bottom">
        <div className="flex items-stretch justify-around">
          {tabs.map((item) => {
            const Icon = item.icon;
            if (item.to === "__search__") {
              return (
                <button
                  key={item.label}
                  onClick={() => setSearchOpen(true)}
                  className="relative flex flex-col items-center justify-center gap-1 flex-1 min-h-[58px] px-1 py-2 text-[10px] font-semibold tracking-wide text-muted-foreground/70 active:text-primary active:scale-90 transition-all"
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} />
                  <span className="leading-none">{item.label}</span>
                </button>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-1 flex-1 min-h-[58px] px-1 py-2 text-[10px] font-semibold tracking-wide transition-all duration-200 active:scale-90 ${
                    isActive ? "text-primary" : "text-muted-foreground/70"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 1.8} fill={isActive ? "currentColor" : "none"} />
                    <span className="leading-none">{item.label}</span>
                    {isActive && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default BottomNav;
