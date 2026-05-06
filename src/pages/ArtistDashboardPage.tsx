import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Headphones, Download, Users, Music, TrendingUp, Calendar,
  Rocket, Share2, BadgeCheck, Disc3, Video, ChevronRight,
  ArrowUpRight, Eye, Heart, BarChart3, Sparkles, Link as LinkIcon,
  LayoutDashboard, DollarSign, Settings as SettingsIcon, Library,
  CheckCircle2, Clock, AlertCircle, Wallet, Crown, Coins, Save,
  ExternalLink, ArrowDownToLine, Info, Palette, UserCog, Bell,
  ShieldCheck, Megaphone, Pin, ListOrdered, Trash2, EyeOff,
} from "lucide-react";
import BrandingSection from "@/components/artist-dashboard/BrandingSection";
import CollaborationSection from "@/components/artist-dashboard/CollaborationSection";
import PromotionSection from "@/components/artist-dashboard/PromotionSection";
import NotificationsSection from "@/components/artist-dashboard/NotificationsSection";
import RightsSection from "@/components/artist-dashboard/RightsSection";
import LinksSection from "@/components/artist-dashboard/LinksSection";
import TopTracksManager from "@/components/artist-dashboard/TopTracksManager";
import ScheduleCalendar from "@/components/artist-dashboard/ScheduleCalendar";
import { useBulkSongAction } from "@/hooks/use-artist-management";
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import ShareKit from "@/components/ShareKit";
import BoostSongDialog from "@/components/BoostSongDialog";
import { artistPath } from "@/lib/artist-slug";
import { useArtistBalance, useArtistEarnings, useArtistPayouts, formatCents } from "@/hooks/use-monetization";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Section = "overview" | "branding" | "music" | "toptracks" | "monetization" | "audience" | "links" | "collaboration" | "promotion" | "notifications" | "rights" | "settings";

type NavItem = { id: Section; label: string; icon: any };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Studio",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "music", label: "Music", icon: Library },
      { id: "toptracks", label: "Top Tracks", icon: Pin },
      { id: "audience", label: "Fans", icon: Users },
    ],
  },
  {
    label: "Profile",
    items: [
      { id: "branding", label: "Branding", icon: Palette },
      { id: "links", label: "Links", icon: LinkIcon },
      { id: "collaboration", label: "Collaborators", icon: UserCog },
    ],
  },
  {
    label: "Grow",
    items: [
      { id: "monetization", label: "Monetization", icon: DollarSign },
      { id: "promotion", label: "Promotion", icon: Megaphone },
      { id: "notifications", label: "Activity", icon: Bell },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "rights", label: "Rights", icon: ShieldCheck },
      { id: "settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

const NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

const ArtistDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("overview");
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const { data: myArtist, isLoading: artistLoading } = useQuery({
    queryKey: ["studio-artist", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("artists").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="font-heading text-2xl font-extrabold mb-2">Artist Studio</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign in to access your artist analytics and tools.</p>
          <Button onClick={() => navigate("/auth")} className="rounded-xl">Sign in</Button>
        </div>
        <MiniPlayer />
      </Layout>
    );
  }

  if (artistLoading) {
    return (
      <Layout>
        <div className="px-4 py-10 max-w-7xl mx-auto">
          <div className="h-8 w-48 bg-muted/40 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted/30 rounded-2xl animate-pulse" />)}
          </div>
        </div>
        <MiniPlayer />
      </Layout>
    );
  }

  if (!myArtist) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <Music className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="font-heading text-2xl font-extrabold mb-2">Become an Artist</h1>
          <p className="text-sm text-muted-foreground mb-6">Create your artist profile to access the Studio dashboard with analytics, promotion tools, and more.</p>
          <Button onClick={() => navigate("/profile")} className="rounded-xl">Set up artist profile</Button>
        </div>
        <MiniPlayer />
      </Layout>
    );
  }

  const activeNav = NAV.find((n) => n.id === section);

  return (
    <Layout>
      {/* Hero header with cover gradient */}
      <div className="relative overflow-hidden border-b border-border/50">
        {/* Cover image / gradient backdrop */}
        <div className="absolute inset-0 -z-10">
          {myArtist.cover_url ? (
            <>
              <img src={myArtist.cover_url} alt="" className="h-full w-full object-cover opacity-40"  loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
            </>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 via-background to-secondary/15" />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-3 md:px-6 pt-5 md:pt-8 pb-4 md:pb-6">
          <div className="flex items-start md:items-center gap-3 md:gap-5">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 overflow-hidden flex-shrink-0 ring-2 ring-background shadow-xl shadow-primary/10">
              {myArtist.avatar_url ? (
                <img src={myArtist.avatar_url} alt={myArtist.name} className="h-full w-full object-cover"  loading="lazy" decoding="async" />
              ) : (
                <div className="h-full w-full flex items-center justify-center"><Music className="h-8 w-8 text-primary" /></div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] md:text-[11px] font-bold tracking-[0.18em] uppercase text-primary flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Creator Studio
              </p>
              <h1 className="font-heading text-2xl md:text-4xl font-extrabold flex items-center gap-2 truncate mt-0.5">
                <span className="truncate">{myArtist.name}</span>
                {myArtist.is_verified && <BadgeCheck className="h-5 w-5 md:h-6 md:w-6 text-primary fill-primary/20 flex-shrink-0" />}
              </h1>
              <p className="hidden md:block text-sm text-muted-foreground mt-1">
                Manage your music, grow your audience, and track every play.
              </p>
            </div>
            <div className="hidden md:flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5 backdrop-blur bg-background/60">
                <Link to={artistPath(myArtist.name)}><Eye className="h-4 w-4" />View profile</Link>
              </Button>
              <Button asChild size="sm" className="rounded-xl gap-1.5 shadow-lg shadow-primary/20">
                <Link to="/upload"><Music className="h-4 w-4" />Upload</Link>
              </Button>
            </div>
          </div>

          {/* Mobile quick actions */}
          <div className="md:hidden grid grid-cols-2 gap-2 mt-4">
            <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5 backdrop-blur bg-background/60 h-9">
              <Link to={artistPath(myArtist.name)}><Eye className="h-4 w-4" />Profile</Link>
            </Button>
            <Button asChild size="sm" className="rounded-xl gap-1.5 shadow-lg shadow-primary/20 h-9">
              <Link to="/upload"><Music className="h-4 w-4" />Upload</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        {/* Mobile chip nav */}
        <nav className="md:hidden -mx-3 px-3 mb-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 w-max min-w-full">
            {NAV.map((n) => {
              const active = section === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setSection(n.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition border",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  )}
                >
                  <n.icon className="h-3.5 w-3.5" />
                  {n.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile section title */}
        {activeNav && (
          <div className="md:hidden mb-3 flex items-center gap-2">
            <activeNav.icon className="h-4 w-4 text-primary" />
            <h2 className="font-heading font-extrabold text-lg">{activeNav.label}</h2>
          </div>
        )}

        <div className="md:grid md:grid-cols-[240px_1fr] md:gap-8">
          {/* Desktop grouped sidebar */}
          <aside className="hidden md:block">
            <nav className="sticky top-20 space-y-5">
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground/70 px-3 mb-1.5">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((n) => {
                      const active = section === n.id;
                      return (
                        <button
                          key={n.id}
                          onClick={() => setSection(n.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition relative group",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          )}
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
                          )}
                          <n.icon className={cn("h-4 w-4", active && "text-primary")} />
                          {n.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <Separator />
              <Link
                to="/upload"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-md shadow-primary/20"
              >
                <Music className="h-4 w-4" />
                Upload track
              </Link>
            </nav>
          </aside>

          {/* Section content */}
          <main className="min-w-0">
            {section === "overview" && <OverviewSection artist={myArtist} range={range} setRange={setRange} />}
            {section === "branding" && <BrandingSection artist={myArtist} />}
            {section === "music" && <MusicSection artist={myArtist} />}
            {section === "toptracks" && <TopTracksManager artist={myArtist} />}
            {section === "links" && <LinksSection artist={myArtist} />}
            {section === "monetization" && <MonetizationSection artist={myArtist} />}
            {section === "audience" && <AudienceSection artist={myArtist} range={range} setRange={setRange} />}
            {section === "collaboration" && <CollaborationSection artist={myArtist} />}
            {section === "promotion" && <PromotionSection artist={myArtist} />}
            {section === "notifications" && <NotificationsSection />}
            {section === "rights" && <RightsSection artist={myArtist} />}
            {section === "settings" && <SettingsSection artist={myArtist} />}
          </main>
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

/* ======================== OVERVIEW ======================== */

const OverviewSection = ({ artist, range, setRange }: { artist: any; range: 7 | 30 | 90; setRange: (r: 7 | 30 | 90) => void }) => {
  const { data: songs = [] } = useQuery({
    queryKey: ["studio-songs", artist.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("id, title, cover_url, play_count, download_count, is_approved, release_status, scheduled_release_at, created_at, genre, download_price_cents, is_paid_download")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const songIds = useMemo(() => songs.map((s) => s.id), [songs]);

  const { data: followerCount = 0 } = useQuery({
    queryKey: ["studio-followers", artist.id],
    queryFn: async () => {
      const { count } = await supabase.from("artist_follows").select("*", { count: "exact", head: true }).eq("artist_id", artist.id);
      return count ?? 0;
    },
  });

  const { data: followerHistory = [] } = useQuery({
    queryKey: ["studio-follower-history", artist.id, range],
    queryFn: async () => {
      const { data } = await supabase
        .from("artist_follows")
        .select("created_at")
        .eq("artist_id", artist.id)
        .gte("created_at", subDays(new Date(), range).toISOString());
      return data ?? [];
    },
  });

  const { data: downloadHistory = [] } = useQuery({
    queryKey: ["studio-downloads", songIds, range],
    queryFn: async () => {
      if (songIds.length === 0) return [];
      const { data } = await supabase
        .from("song_downloads")
        .select("created_at, song_id")
        .in("song_id", songIds)
        .gte("created_at", subDays(new Date(), range).toISOString());
      return data ?? [];
    },
    enabled: songIds.length > 0,
  });

  const { data: likeHistory = [] } = useQuery({
    queryKey: ["studio-likes", songIds, range],
    queryFn: async () => {
      if (songIds.length === 0) return [];
      const { data } = await supabase
        .from("song_likes")
        .select("created_at, song_id")
        .in("song_id", songIds)
        .gte("created_at", subDays(new Date(), range).toISOString());
      return data ?? [];
    },
    enabled: songIds.length > 0,
  });

  const { data: playHistory = [] } = useQuery({
    queryKey: ["studio-plays", songIds, range],
    queryFn: async () => {
      if (songIds.length === 0) return [];
      const { data } = await supabase
        .from("user_listening_history")
        .select("played_at, song_id")
        .in("song_id", songIds)
        .gte("played_at", subDays(new Date(), range).toISOString());
      return data ?? [];
    },
    enabled: songIds.length > 0,
  });

  const totalPlays = songs.reduce((s, x) => s + (x.play_count || 0), 0);
  const totalDownloads = songs.reduce((s, x) => s + (x.download_count || 0), 0);
  const approvedSongs = songs.filter((s) => s.is_approved && s.release_status === "published");
  const scheduledSongs = songs.filter((s) => s.release_status === "scheduled");
  const pendingSongs = songs.filter((s) => !s.is_approved && s.release_status === "published");

  const dailySeries = useMemo(() => {
    const days: Record<string, { date: string; downloads: number; likes: number; followers: number; plays: number }> = {};
    for (let i = range - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM d");
      days[d] = { date: d, downloads: 0, likes: 0, followers: 0, plays: 0 };
    }
    downloadHistory.forEach((row: any) => {
      const d = format(startOfDay(new Date(row.created_at)), "MMM d");
      if (days[d]) days[d].downloads++;
    });
    likeHistory.forEach((row: any) => {
      const d = format(startOfDay(new Date(row.created_at)), "MMM d");
      if (days[d]) days[d].likes++;
    });
    followerHistory.forEach((row: any) => {
      const d = format(startOfDay(new Date(row.created_at)), "MMM d");
      if (days[d]) days[d].followers++;
    });
    playHistory.forEach((row: any) => {
      const d = format(startOfDay(new Date(row.played_at)), "MMM d");
      if (days[d]) days[d].plays++;
    });
    return Object.values(days);
  }, [downloadHistory, likeHistory, followerHistory, playHistory, range]);

  const topSongs = useMemo(() => [...songs].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 5), [songs]);

  const genreBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    songs.forEach((s) => {
      const g = s.genre || "Other";
      counts[g] = (counts[g] || 0) + (s.play_count || 0);
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [songs]);

  const newFollowersInRange = followerHistory.length;
  const newDownloadsInRange = downloadHistory.length;
  const newPlaysInRange = playHistory.length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Headphones} label="Total plays" value={totalPlays.toLocaleString()} delta={newPlaysInRange ? `+${newPlaysInRange.toLocaleString()} (${range}d)` : undefined} accent="text-primary" />
        <KpiCard icon={Download} label="Downloads" value={totalDownloads.toLocaleString()} delta={newDownloadsInRange ? `+${newDownloadsInRange} (${range}d)` : undefined} />
        <KpiCard icon={Users} label="Followers" value={followerCount.toLocaleString()} delta={newFollowersInRange ? `+${newFollowersInRange} (${range}d)` : undefined} />
        <KpiCard icon={Music} label="Released" value={approvedSongs.length.toLocaleString()} hint={`${pendingSongs.length} pending · ${scheduledSongs.length} scheduled`} />
      </div>

      {/* Range */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Performance</h2>
        <div className="flex items-center gap-1 rounded-xl bg-muted/40 p-1">
          {[7, 30, 90].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r as 7 | 30 | 90)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition",
                range === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Plays line chart - hero */}
      <Card className="p-4 rounded-2xl border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plays</p>
            <p className="font-heading font-extrabold text-2xl mt-1">{newPlaysInRange.toLocaleString()}</p>
          </div>
          <span className="text-xs text-muted-foreground">last {range} days</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailySeries}>
              <defs>
                <linearGradient id="pl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={28} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="plays" stroke="hsl(var(--primary))" fill="url(#pl)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Charts grid */}
      <div className="grid md:grid-cols-2 gap-3">
        <Card className="p-4 rounded-2xl border-border/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Downloads & Likes</p>
            <span className="text-xs text-muted-foreground">{range} days</span>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySeries}>
                <defs>
                  <linearGradient id="dl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={28} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="downloads" stroke="hsl(var(--primary))" fill="url(#dl)" strokeWidth={2} />
                <Area type="monotone" dataKey="likes" stroke="hsl(var(--secondary))" fill="url(#lk)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-border/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Followers</p>
            <span className="text-xs text-muted-foreground">{range} days</span>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={28} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="followers" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top songs + Genre breakdown */}
      <div className="grid md:grid-cols-3 gap-3">
        <Card className="md:col-span-2 p-4 rounded-2xl border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Top Songs</h3>
            <span className="text-xs text-muted-foreground">All-time plays</span>
          </div>
          {topSongs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No songs yet. <Link to="/upload" className="text-primary font-semibold">Upload your first track</Link>.</p>
          ) : (
            <div className="space-y-1">
              {topSongs.map((song, i) => (
                <Link key={song.id} to={`/song/${song.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition group">
                  <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                  <div className="h-11 w-11 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {song.cover_url ? <img src={song.cover_url} alt="" className="h-full w-full object-cover"  loading="lazy" decoding="async" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><Music className="h-4 w-4 text-primary" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{song.title}</p>
                    <p className="text-[11px] text-muted-foreground">{(song.play_count || 0).toLocaleString()} plays · {(song.download_count || 0).toLocaleString()} downloads</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 rounded-2xl border-border/50">
          <h3 className="font-heading font-bold mb-3 flex items-center gap-2"><Disc3 className="h-4 w-4 text-primary" />By Genre</h3>
          {genreBreakdown.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No data yet</p>
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genreBreakdown} dataKey="value" nameKey="name" innerRadius={36} outerRadius={64} paddingAngle={2}>
                    {genreBreakdown.map((_, i) => <Cell key={i} fill={`hsl(var(--${["primary","secondary","accent","primary","secondary"][i%5]}))`} fillOpacity={0.85 - i*0.12} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-2 space-y-1">
            {genreBreakdown.slice(0, 4).map((g) => (
              <div key={g.name} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate">{g.name}</span>
                <span className="font-semibold">{g.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Scheduled releases */}
      {scheduledSongs.length > 0 && (
        <Card className="p-4 rounded-2xl border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <h3 className="font-heading font-bold mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Upcoming Releases</h3>
          <div className="space-y-2">
            {scheduledSongs.map((song) => (
              <div key={song.id} className="flex items-center gap-3 p-2 rounded-xl bg-background/60">
                <div className="h-11 w-11 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {song.cover_url ? <img src={song.cover_url} alt="" className="h-full w-full object-cover"  loading="lazy" decoding="async" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><Music className="h-4 w-4 text-primary" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{song.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Releases {song.scheduled_release_at ? format(new Date(song.scheduled_release_at), "MMM d, yyyy 'at' p") : "soon"}
                  </p>
                </div>
                <ShareKit
                  url={`${window.location.origin}/presave/${song.id}`}
                  title={`Pre-save "${song.title}"`}
                  description={`Pre-save "${song.title}" by ${artist.name}`}
                  trigger={
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5 flex-shrink-0">
                      <LinkIcon className="h-3.5 w-3.5" />Pre-save
                    </Button>
                  }
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

/* ======================== MUSIC ======================== */

const MusicSection = ({ artist }: { artist: any }) => {
  const [filter, setFilter] = useState<"all" | "live" | "pending" | "scheduled" | "calendar">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const bulk = useBulkSongAction();

  const { data: songs = [], isLoading } = useQuery({
    queryKey: ["studio-songs-full", artist.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("id, title, cover_url, play_count, download_count, is_approved, release_status, scheduled_release_at, created_at, genre, is_paid_download, download_price_cents")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: albumCount = 0 } = useQuery({
    queryKey: ["studio-albums", artist.id],
    queryFn: async () => {
      const { count } = await supabase.from("albums").select("*", { count: "exact", head: true }).eq("artist_id", artist.id);
      return count ?? 0;
    },
  });

  const { data: videoCount = 0 } = useQuery({
    queryKey: ["studio-videos", artist.id],
    queryFn: async () => {
      const { count } = await supabase.from("videos").select("*", { count: "exact", head: true }).eq("artist_id", artist.id);
      return count ?? 0;
    },
  });

  const filtered = useMemo(() => {
    if (filter === "all" || filter === "calendar") return songs;
    if (filter === "live") return songs.filter((s) => s.is_approved && s.release_status === "published");
    if (filter === "pending") return songs.filter((s) => !s.is_approved && s.release_status === "published");
    if (filter === "scheduled") return songs.filter((s) => s.release_status === "scheduled");
    return songs;
  }, [songs, filter]);

  const counts = {
    all: songs.length,
    live: songs.filter((s) => s.is_approved && s.release_status === "published").length,
    pending: songs.filter((s) => !s.is_approved && s.release_status === "published").length,
    scheduled: songs.filter((s) => s.release_status === "scheduled").length,
  };

  const toggleSel = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((s) => s.id)));
  };
  const runBulk = (action: "delete" | "unpublish" | "publish") => {
    if (action === "delete" && !window.confirm(`Delete ${selected.size} track(s)? This is permanent.`)) return;
    bulk.mutate({ song_ids: Array.from(selected), action }, {
      onSuccess: () => setSelected(new Set()),
    });
  };

  return (
    <div className="space-y-4">
      {/* Catalog tiles */}
      <div className="grid grid-cols-3 gap-3">
        <CatalogTile icon={Music} label="Songs" count={songs.length} />
        <CatalogTile icon={Disc3} label="Albums" count={albumCount} />
        <CatalogTile icon={Video} label="Videos" count={videoCount} />
      </div>

      {filter === "calendar" ? (
        <>
          <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1 overflow-x-auto">
            {(["all", "live", "pending", "scheduled", "calendar"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition flex items-center gap-1",
                  filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f === "calendar" && <Calendar className="h-3 w-3" />}
                {f === "calendar" ? "Calendar" : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f]})`}
              </button>
            ))}
          </div>
          <ScheduleCalendar artistId={artist.id} />
        </>
      ) : (
        <Card className="rounded-2xl border-border/50 overflow-hidden">
          <div className="p-3 md:p-4 border-b border-border/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h3 className="font-heading font-bold flex items-center gap-2"><Library className="h-4 w-4 text-primary" />Your Music</h3>
            <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1 overflow-x-auto">
              {(["all", "live", "pending", "scheduled", "calendar"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition flex items-center gap-1",
                    filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f === "calendar" && <Calendar className="h-3 w-3" />}
                  {f === "calendar" ? "Calendar" : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f]})`}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="px-3 md:px-4 py-2 bg-primary/10 border-b border-primary/30 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-primary">{selected.size} selected</span>
              <div className="ml-auto flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => runBulk("publish")}>
                  <CheckCircle2 className="h-3 w-3" /> Publish
                </Button>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => runBulk("unpublish")}>
                  <EyeOff className="h-3 w-3" /> Unpublish
                </Button>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-destructive hover:text-destructive" onClick={() => runBulk("delete")}>
                  <Trash2 className="h-3 w-3" /> Delete
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(new Set())}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <Music className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No tracks in this view yet.</p>
              <Button asChild size="sm" className="rounded-xl"><Link to="/upload">Upload a track</Link></Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {/* Select all */}
              <div className="px-3 md:px-4 py-2 flex items-center gap-3 text-xs text-muted-foreground bg-muted/20">
                <Checkbox
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onCheckedChange={toggleAll}
                />
                <span className="font-semibold">Select all</span>
                {artist.pinned_song_id && (
                  <span className="ml-auto flex items-center gap-1 text-primary">
                    <Pin className="h-3 w-3" /> Pinned song set
                  </span>
                )}
              </div>
              {filtered.map((song) => {
                const isPinned = artist.pinned_song_id === song.id;
                return (
                  <div key={song.id} className={cn("p-3 md:p-4 flex items-center gap-3 hover:bg-muted/30 transition", selected.has(song.id) && "bg-primary/5")}>
                    <Checkbox
                      checked={selected.has(song.id)}
                      onCheckedChange={() => toggleSel(song.id)}
                    />
                    <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
                      {song.cover_url ? <img src={song.cover_url} alt="" className="h-full w-full object-cover"  loading="lazy" decoding="async" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><Music className="h-4 w-4 text-primary" /></div>}
                      {isPinned && <div className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center"><Pin className="h-2.5 w-2.5 text-primary-foreground fill-primary-foreground" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/song/${song.id}`} className="block">
                        <p className="text-sm font-semibold truncate hover:text-primary transition">{song.title}</p>
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <SongStatusBadge song={song} />
                        {song.is_paid_download && (
                          <Badge variant="outline" className="h-4 text-[9px] px-1.5 gap-0.5 border-primary/40 text-primary">
                            <Coins className="h-2.5 w-2.5" />{formatCents(song.download_price_cents || 0)}
                          </Badge>
                        )}
                        {song.genre && <span className="text-[10px] text-muted-foreground">{song.genre}</span>}
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-[11px] text-muted-foreground flex-shrink-0">
                      <div className="flex items-center gap-1"><Headphones className="h-3 w-3" />{(song.play_count || 0).toLocaleString()}</div>
                      <div className="flex items-center gap-1"><Download className="h-3 w-3" />{(song.download_count || 0).toLocaleString()}</div>
                    </div>
                    <BoostSongDialog songId={song.id} songTitle={song.title}>
                      <Button size="sm" variant="ghost" className="rounded-lg h-8 px-2 gap-1 text-xs">
                        <Rocket className="h-3.5 w-3.5" />
                        <span className="hidden md:inline">Boost</span>
                      </Button>
                    </BoostSongDialog>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

const SongStatusBadge = ({ song }: { song: any }) => {
  if (song.release_status === "scheduled") {
    return <Badge variant="outline" className="h-4 text-[9px] px-1.5 gap-0.5 border-secondary/40 text-secondary"><Clock className="h-2.5 w-2.5" />Scheduled</Badge>;
  }
  if (!song.is_approved) {
    return <Badge variant="outline" className="h-4 text-[9px] px-1.5 gap-0.5 border-accent/40 text-accent"><AlertCircle className="h-2.5 w-2.5" />Pending</Badge>;
  }
  return <Badge variant="outline" className="h-4 text-[9px] px-1.5 gap-0.5 border-primary/40 text-primary"><CheckCircle2 className="h-2.5 w-2.5" />Live</Badge>;
};

/* ======================== MONETIZATION ======================== */

const MonetizationSection = ({ artist }: { artist: any }) => {
  const qc = useQueryClient();
  const { data: balance } = useArtistBalance(artist.id);
  const { data: earnings = [] } = useArtistEarnings(artist.id);
  const { data: payouts = [] } = useArtistPayouts(artist.id);

  const { data: supporterCount = 0 } = useQuery({
    queryKey: ["studio-supporters", artist.id],
    queryFn: async () => {
      const { count } = await supabase.from("supporter_subscriptions").select("*", { count: "exact", head: true }).eq("artist_id", artist.id).eq("status", "active");
      return count ?? 0;
    },
  });

  const { data: songs = [] } = useQuery({
    queryKey: ["studio-songs-prices", artist.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("songs")
        .select("id, title, cover_url, is_paid_download, download_price_cents")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [tipEnabled, setTipEnabled] = useState(artist.tip_jar_enabled);
  const [supporterEnabled, setSupporterEnabled] = useState(artist.supporter_enabled);
  const [supporterPrice, setSupporterPrice] = useState(((artist.supporter_price_cents || 299) / 100).toFixed(2));

  const saveSettings = useMutation({
    mutationFn: async () => {
      const cents = Math.round(parseFloat(supporterPrice || "0") * 100);
      if (cents < 99) throw new Error("Supporter tier must be at least $0.99/mo");
      const { error } = await supabase
        .from("artists")
        .update({ tip_jar_enabled: tipEnabled, supporter_enabled: supporterEnabled, supporter_price_cents: cents })
        .eq("id", artist.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Monetization settings saved");
      qc.invalidateQueries({ queryKey: ["studio-artist"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {/* Balance hero */}
      <Card className="p-5 rounded-2xl border-border/50 bg-gradient-to-br from-primary/10 via-card to-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-primary mb-1">Available balance</p>
            <p className="font-heading font-extrabold text-4xl">{formatCents(balance?.balance_cents || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Earned {formatCents(balance?.total_earned_cents || 0)} · Paid {formatCents(balance?.total_paid_cents || 0)}
            </p>
          </div>
          <Wallet className="h-8 w-8 text-primary/60" />
        </div>
        <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border/50 flex items-start gap-2">
          <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground">
            Payouts are processed manually by Sudagospel via bank transfer or mobile money. Reach out from the contact page to request your payout.
          </p>
        </div>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard icon={Crown} label="Supporters" value={supporterCount.toLocaleString()} accent="text-primary" />
        <KpiCard icon={Coins} label="Transactions" value={earnings.length.toLocaleString()} />
        <KpiCard icon={ArrowDownToLine} label="Payouts received" value={payouts.length.toLocaleString()} />
      </div>

      {/* Settings */}
      <Card className="p-4 md:p-5 rounded-2xl border-border/50">
        <h3 className="font-heading font-bold mb-4 flex items-center gap-2"><SettingsIcon className="h-4 w-4 text-primary" />Monetization Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Label className="text-sm font-semibold">Tip jar</Label>
              <p className="text-[11px] text-muted-foreground">Let fans send you one-time tips of any amount.</p>
            </div>
            <Switch checked={tipEnabled} onCheckedChange={setTipEnabled} />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Label className="text-sm font-semibold">Supporter subscriptions</Label>
              <p className="text-[11px] text-muted-foreground">Recurring monthly support from your biggest fans.</p>
            </div>
            <Switch checked={supporterEnabled} onCheckedChange={setSupporterEnabled} />
          </div>
          {supporterEnabled && (
            <div className="ml-0 pl-3 border-l-2 border-primary/30">
              <Label htmlFor="sup-price" className="text-xs font-semibold">Monthly price (USD)</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  id="sup-price"
                  type="number"
                  min="0.99"
                  step="0.01"
                  value={supporterPrice}
                  onChange={(e) => setSupporterPrice(e.target.value)}
                  className="max-w-[120px] h-9"
                />
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
            </div>
          )}
          <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending} className="rounded-xl gap-1.5 w-full md:w-auto">
            <Save className="h-4 w-4" />{saveSettings.isPending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </Card>

      {/* Per-song pricing */}
      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h3 className="font-heading font-bold flex items-center gap-2"><Coins className="h-4 w-4 text-primary" />Paid Downloads</h3>
          <p className="text-[11px] text-muted-foreground mt-1">Toggle paid downloads per track and set the price fans pay.</p>
        </div>
        {songs.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No tracks yet.</p>
        ) : (
          <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
            {songs.map((song) => <SongPriceRow key={song.id} song={song} />)}
          </div>
        )}
      </Card>

      {/* Earnings ledger */}
      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h3 className="font-heading font-bold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Earnings</h3>
          <p className="text-[11px] text-muted-foreground mt-1">Latest 100 transactions.</p>
        </div>
        {earnings.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No earnings yet. Share your tip jar to start receiving support.</p>
        ) : (
          <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
            {earnings.map((e: any) => (
              <div key={e.id} className="p-3 flex items-center gap-3 text-sm">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  e.source === "tip" ? "bg-primary/10 text-primary" :
                  e.source === "song_purchase" ? "bg-secondary/10 text-secondary" :
                  "bg-accent/10 text-accent"
                )}>
                  {e.source === "tip" ? <Heart className="h-4 w-4" /> : e.source === "song_purchase" ? <Download className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold capitalize truncate">
                    {e.source.replace(/_/g, " ")}
                    {e.songs?.title && <span className="text-muted-foreground font-normal"> · {e.songs.title}</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{format(new Date(e.created_at), "MMM d, yyyy 'at' p")}</p>
                </div>
                <p className="font-bold text-primary flex-shrink-0">+{formatCents(e.amount_cents, e.currency?.toUpperCase() || "USD")}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Payout history */}
      {payouts.length > 0 && (
        <Card className="rounded-2xl border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-heading font-bold flex items-center gap-2"><ArrowDownToLine className="h-4 w-4 text-primary" />Payout History</h3>
          </div>
          <div className="divide-y divide-border/50">
            {payouts.map((p: any) => (
              <div key={p.id} className="p-3 flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.payout_method || "Manual payout"}</p>
                  <p className="text-[11px] text-muted-foreground">{format(new Date(p.paid_at), "MMM d, yyyy")} {p.reference && `· ${p.reference}`}</p>
                </div>
                <p className="font-bold flex-shrink-0">{formatCents(p.amount_cents, p.currency?.toUpperCase() || "USD")}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

const SongPriceRow = ({ song }: { song: any }) => {
  const qc = useQueryClient();
  const [paid, setPaid] = useState(song.is_paid_download);
  const [price, setPrice] = useState(((song.download_price_cents || 99) / 100).toFixed(2));

  const save = useMutation({
    mutationFn: async () => {
      const cents = Math.round(parseFloat(price || "0") * 100);
      if (paid && cents < 49) throw new Error("Paid downloads must be at least $0.49");
      const { error } = await supabase
        .from("songs")
        .update({ is_paid_download: paid, download_price_cents: cents })
        .eq("id", song.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Updated "${song.title}"`);
      qc.invalidateQueries({ queryKey: ["studio-songs-prices"] });
      qc.invalidateQueries({ queryKey: ["studio-songs-full"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-3 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
        {song.cover_url ? <img src={song.cover_url} alt="" className="h-full w-full object-cover"  loading="lazy" decoding="async" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><Music className="h-3.5 w-3.5 text-primary" /></div>}
      </div>
      <p className="flex-1 min-w-0 text-sm font-semibold truncate">{song.title}</p>
      <Switch checked={paid} onCheckedChange={setPaid} />
      {paid && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">$</span>
          <Input
            type="number"
            min="0.49"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-20 h-8 text-sm"
          />
        </div>
      )}
      <Button size="sm" variant="ghost" onClick={() => save.mutate()} disabled={save.isPending} className="rounded-lg h-8 px-2">
        <Save className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

/* ======================== AUDIENCE ======================== */

const AudienceSection = ({ artist, range, setRange }: { artist: any; range: 7 | 30 | 90; setRange: (r: 7 | 30 | 90) => void }) => {
  const { data: followers = [] } = useQuery({
    queryKey: ["studio-followers-list", artist.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("artist_follows")
        .select("user_id, created_at")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false })
        .limit(100);
      const userIds = (data ?? []).map((f) => f.user_id);
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);
      const map = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return (data ?? []).map((f) => ({ ...f, profile: map.get(f.user_id) }));
    },
  });

  const { data: scheduledSongs = [] } = useQuery({
    queryKey: ["studio-scheduled", artist.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("songs")
        .select("id, title, scheduled_release_at")
        .eq("artist_id", artist.id)
        .eq("release_status", "scheduled")
        .order("scheduled_release_at", { ascending: true });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard icon={Users} label="Followers" value={followers.length >= 100 ? "100+" : followers.length.toLocaleString()} accent="text-primary" />
        <KpiCard icon={Calendar} label="Scheduled" value={scheduledSongs.length.toLocaleString()} />
        <KpiCard icon={Rocket} label="Boosts" value="—" hint="Coming soon" />
      </div>

      {/* Promotion */}
      <Card className="p-4 md:p-5 rounded-2xl border-border/50">
        <h3 className="font-heading font-bold mb-3 flex items-center gap-2"><Rocket className="h-4 w-4 text-primary" />Promotion Tools</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <ShareKit
            url={`${window.location.origin}${artistPath(artist.name)}`}
            title={`${artist.name} on Sudagospel`}
            description={`Listen to ${artist.name} — gospel music on Sudagospel`}
            trigger={
              <Card className="p-4 rounded-xl border-border/50 hover:border-primary/40 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Share2 className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Share kit</p>
                    <p className="text-[11px] text-muted-foreground">Promo links & embeds for your profile</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            }
          />
          <Link to="/upload">
            <Card className="p-4 rounded-xl border-border/50 hover:border-primary/40 transition cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Calendar className="h-4 w-4 text-primary" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Schedule a release</p>
                  <p className="text-[11px] text-muted-foreground">Build hype with pre-save links</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        </div>
      </Card>

      {/* Pre-save links */}
      {scheduledSongs.length > 0 && (
        <Card className="p-4 rounded-2xl border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <h3 className="font-heading font-bold mb-3 flex items-center gap-2"><LinkIcon className="h-4 w-4 text-primary" />Pre-save Links</h3>
          <div className="space-y-2">
            {scheduledSongs.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-background/60">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground">Out {s.scheduled_release_at ? format(new Date(s.scheduled_release_at), "MMM d, yyyy") : "soon"}</p>
                </div>
                <ShareKit
                  url={`${window.location.origin}/presave/${s.id}`}
                  title={`Pre-save "${s.title}"`}
                  description={`Pre-save "${s.title}" by ${artist.name}`}
                  trigger={<Button size="sm" variant="outline" className="rounded-xl gap-1.5"><Share2 className="h-3.5 w-3.5" />Share</Button>}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Followers list */}
      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h3 className="font-heading font-bold flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Recent Followers</h3>
          <p className="text-[11px] text-muted-foreground mt-1">Latest 100 fans who followed you.</p>
        </div>
        {followers.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No followers yet — share your profile to start growing your audience.</p>
        ) : (
          <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
            {followers.map((f: any) => (
              <div key={f.user_id + f.created_at} className="p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {f.profile?.avatar_url ? <img src={f.profile.avatar_url} alt="" className="h-full w-full object-cover"  loading="lazy" decoding="async" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><Users className="h-3.5 w-3.5 text-primary" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{f.profile?.display_name || "Anonymous fan"}</p>
                  <p className="text-[11px] text-muted-foreground">Followed {format(new Date(f.created_at), "MMM d, yyyy")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

/* ======================== SETTINGS ======================== */

const SettingsSection = ({ artist }: { artist: any }) => {
  return (
    <div className="space-y-4">
      <Card className="p-4 md:p-5 rounded-2xl border-border/50">
        <h3 className="font-heading font-bold mb-3">Artist Profile</h3>
        <p className="text-sm text-muted-foreground mb-4">Edit your artist name, bio, avatar, cover image, and social links from your profile page.</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="rounded-xl gap-1.5"><Link to="/profile"><SettingsIcon className="h-4 w-4" />Edit profile</Link></Button>
          <Button asChild size="sm" variant="outline" className="rounded-xl gap-1.5"><Link to={artistPath(artist.name)}><Eye className="h-4 w-4" />Preview public page</Link></Button>
        </div>
      </Card>

      <Card className="p-4 md:p-5 rounded-2xl border-border/50">
        <h3 className="font-heading font-bold mb-3">Verification</h3>
        {artist.is_verified ? (
          <div className="flex items-center gap-2 text-sm text-primary font-semibold">
            <BadgeCheck className="h-5 w-5" />Your account is verified
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">Get the verified badge to confirm your identity to fans. Submit a request from your profile page.</p>
            <Button asChild size="sm" variant="outline" className="rounded-xl"><Link to="/profile">Request verification</Link></Button>
          </>
        )}
      </Card>

      <Card className="p-4 md:p-5 rounded-2xl border-border/50">
        <h3 className="font-heading font-bold mb-3">Help & Support</h3>
        <p className="text-sm text-muted-foreground mb-4">Need help with payouts, takedowns, or copyright? Get in touch.</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="rounded-xl"><Link to="/contact">Contact us</Link></Button>
          <Button asChild size="sm" variant="outline" className="rounded-xl"><Link to="/copyright">Copyright</Link></Button>
          <Button asChild size="sm" variant="outline" className="rounded-xl"><Link to="/dmca">DMCA</Link></Button>
        </div>
      </Card>
    </div>
  );
};

/* ======================== SHARED ======================== */

const KpiCard = ({ icon: Icon, label, value, delta, hint, accent }: { icon: any; label: string; value: string; delta?: string; hint?: string; accent?: string }) => (
  <Card className="relative overflow-hidden p-4 rounded-2xl border-border/50 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition group">
    <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-primary/5 group-hover:bg-primary/10 transition" />
    <div className="relative flex items-center justify-between mb-2">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center bg-muted/60", accent && "bg-primary/10")}>
        <Icon className={cn("h-3.5 w-3.5", accent || "text-muted-foreground")} />
      </div>
    </div>
    <p className="relative font-heading font-extrabold text-2xl tracking-tight">{value}</p>
    {delta && (
      <p className="relative text-[11px] text-primary font-semibold mt-1 flex items-center gap-1">
        <ArrowUpRight className="h-3 w-3" />{delta}
      </p>
    )}
    {hint && <p className="relative text-[10px] text-muted-foreground mt-1 truncate">{hint}</p>}
  </Card>
);

const CatalogTile = ({ icon: Icon, label, count }: { icon: any; label: string; count: number }) => (
  <Card className="p-4 rounded-2xl border-border/50 flex flex-col items-start gap-2">
    <Icon className="h-5 w-5 text-primary" />
    <div>
      <p className="font-heading font-extrabold text-xl">{count}</p>
      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
    </div>
  </Card>
);

export default ArtistDashboardPage;
