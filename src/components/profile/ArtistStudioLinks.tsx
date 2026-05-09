import { Link } from "react-router-dom";
import { LinkIcon, DollarSign, Pin, Wallet, ChevronRight, Megaphone, Palette, BarChart3 } from "lucide-react";

const links = [
  { icon: LinkIcon, label: "Social & streaming links", desc: "Spotify, YouTube, Instagram, merch, donate", to: "/artist-dashboard" },
  { icon: DollarSign, label: "Tip jar & supporter pricing", desc: "Enable tips, set monthly supporter price", to: "/artist-dashboard" },
  { icon: Pin, label: "Pinned song & top tracks", desc: "Choose what fans see first on your page", to: "/artist-dashboard" },
  { icon: Wallet, label: "Payouts & earnings", desc: "Track balance, request a payout", to: "/artist-dashboard" },
  { icon: Palette, label: "Branding (cover, accent color)", desc: "Customize your public artist page", to: "/artist-dashboard" },
  { icon: Megaphone, label: "Promotion & boosts", desc: "Boost songs to homepage", to: "/artist-dashboard" },
  { icon: BarChart3, label: "Analytics", desc: "Plays, fans, listening trends", to: "/artist-dashboard" },
];

const ArtistStudioLinks = () => (
  <div className="rounded-xl bg-card border border-border p-4 space-y-1">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-heading text-sm font-bold text-foreground">Artist Studio</h3>
      <Link to="/artist-dashboard" className="text-xs text-primary hover:underline">Open studio →</Link>
    </div>
    {links.map(({ icon: Icon, label, desc, to }) => (
      <Link
        key={label}
        to={to}
        className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/60 transition-colors group"
      >
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{label}</p>
          <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      </Link>
    ))}
  </div>
);

export default ArtistStudioLinks;
