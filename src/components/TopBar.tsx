import { Bell, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import logo from "@/assets/logo.png";
import ThemeToggle from "./ThemeToggle";
import SearchOverlay from "./SearchOverlay";

const TopBar = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-lg">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Sudagospel" className="h-8 w-8" />
            <span className="font-heading text-lg font-bold text-gradient-brand">
              Sudagospel
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {["Music", "Artists", "News"].map((item) => (
              <Link
                key={item}
                to={`/${item.toLowerCase()}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            <ThemeToggle />
            <button className="rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
          </div>
        </div>
      </header>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default TopBar;
