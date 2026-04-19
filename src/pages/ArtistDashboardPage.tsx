import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Headphones, Download, Users, Music, TrendingUp, Play, Calendar,
  Rocket, Share2, Edit3, BadgeCheck, Disc3, Video, ChevronRight,
  ArrowUpRight, Eye, Heart, BarChart3, Sparkles, Link as LinkIcon,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import ShareKit from "@/components/ShareKit";
import { artistPath } from "@/lib/artist-slug";

const ArtistDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const { data: myArtist, isLoading: artistLoading } = useQuery({
    queryKey: ["studio-artist", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("artists").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: songs = [] } = useQuery({
    queryKey: ["studio-songs", myArtist?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("id, title, cover_url, play_count, download_count, is_approved, release_status, scheduled_release_at, created_at")
        .eq("artist_id", myArtist!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!myArtist,
  });

  const songIds = useMemo(() => songs.map((s) => s.id), [songs]);

  const { data: followerCount = 0 } = useQuery({
    queryKey: ["studio-followers", myArtist?.id],
    queryFn: async () => {
      const { count } = await supabase.from("artist_follows").select("*", { count: "exact", head: true }).eq("artist_id", myArtist!.id);
      return count ?? 0;
    },
    enabled: !!myArtist,
  });

  const { data: followerHistory = [] } = useQuery({
    queryKey: ["studio-follower-history", myArtist?.id, range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_follows")
        .select("created_at")
        .eq("artist_id", myArtist!.id)
        .gte("created_at", subDays(new Date(), range).toISOString());
      if (error) throw error;
      return data;
    },
    enabled: !!myArtist,
  });

  const { data: downloadHistory = [] } = useQuery({
    queryKey: ["studio-downloads", songIds, range],
    queryFn: async () => {
      if (songIds.length === 0) return [];
      const { data, error } = await supabase
        .from("song_downloads")
        .select("created_at, song_id")
        .in("song_id", songIds)
        .gte("created_at", subDays(new Date(), range).toISOString());
      if (error) throw error;
      return data;
    },
    enabled: songIds.length > 0,
  });

  const { data: likeHistory = [] } = useQuery({
    queryKey: ["studio-likes", songIds, range],
    queryFn: async () => {
      if (songIds.length === 0) return [];
      const { data, error } = await supabase
        .from("song_likes")
        .select("created_at, song_id")
        .in("song_id", songIds)
        .gte("created_at", subDays(new Date(), range).toISOString());
      if (error) throw error;
      return data;
    },
    enabled: songIds.length > 0,
  });

  const { data: albumCount = 0 } = useQuery({
    queryKey: ["studio-albums", myArtist?.id],
    queryFn: async () => {
      const { count } = await supabase.from("albums").select("*", { count: "exact", head: true }).eq("artist_id", myArtist!.id);
      return count ?? 0;
    },
    enabled: !!myArtist,
  });

  const { data: videoCount = 0 } = useQuery({
    queryKey: ["studio-videos", myArtist?.id],
    queryFn: async () => {
      const { count } = await supabase.from("videos").select("*", { count: "exact", head: true }).eq("artist_id", myArtist!.id);
      return count ?? 0;
    },
    enabled: !!myArtist,
  });

  // Aggregate stats
  const totalPlays = songs.reduce((s, x) => s + (x.play_count || 0), 0);
  const totalDownloads = songs.reduce((s, x) => s + (x.download_count || 0), 0);
  const approvedSongs = songs.filter((s) => s.is_approved && s.release_status === "published");
  const scheduledSongs = songs.filter((s) => s.release_status === "scheduled");
  const pendingSongs = songs.filter((s) => !s.is_approved && s.release_status === "published");

  // Build daily series
  const dailySeries = useMemo(() => {
    const days: Record<string, { date: string; downloads: number; likes: number; followers: number }> = {};
    for (let i = range - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM d");
      days[d] = { date: d, downloads: 0, likes: 0, followers: 0 };
    }
    downloadHistory.forEach((row) => {
      const d = format(startOfDay(new Date(row.created_at)), "MMM d");
      if (days[d]) days[d].downloads++;
    });
    likeHistory.forEach((row) => {
      const d = format(startOfDay(new Date(row.created_at)), "MMM d");
      if (days[d]) days[d].likes++;
    });
    followerHistory.forEach((row) => {
      const d = format(startOfDay(new Date(row.created_at)), "MMM d");
      if (days[d]) days[d].followers++;
    });
    return Object.values(days);
  }, [downloadHistory, likeHistory, followerHistory, range]);

  const topSongs = useMemo(() => {
    return [...songs]
      .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
      .slice(0, 5);
  }, [songs]);

  // Recent followers
  const newFollowersInRange = followerHistory.length;
  const newDownloadsInRange = downloadHistory.length;
  const newLikesInRange = likeHistory.length;

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
        <div className="px-4 py-10 max-w-6xl mx-auto">
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 overflow-hidden flex-shrink-0 ring-2 ring-primary/20">
              {myArtist.avatar_url ? (
                <img src={myArtist.avatar_url} alt={myArtist.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center"><Music className="h-7 w-7 text-primary" /></div>
              )}
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-primary">Artist Studio</p>
              <h1 className="font-heading text-2xl md:text-3xl font-extrabold flex items-center gap-2">
                {myArtist.name}
                {myArtist.is_verified && <BadgeCheck className="h-5 w-5 text-primary fill-primary/20" />}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5">
              <Link to={artistPath({ id: myArtist.id, name: myArtist.name })}><Eye className="h-4 w-4" />Public page</Link>
            </Button>
            <Button asChild size="sm" className="rounded-xl gap-1.5 bg-gradient-gold text-primary-foreground">
              <Link to="/upload"><Music className="h-4 w-4" />Upload</Link>
            </Button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={Headphones} label="Total plays" value={totalPlays.toLocaleString()} accent="text-primary" />
          <KpiCard icon={Download} label="Downloads" value={totalDownloads.toLocaleString()} delta={newDownloadsInRange ? `+${newDownloadsInRange} (${range}d)` : undefined} />
          <KpiCard icon={Users} label="Followers" value={followerCount.toLocaleString()} delta={newFollowersInRange ? `+${newFollowersInRange} (${range}d)` : undefined} />
          <KpiCard icon={Music} label="Songs" value={songs.length.toLocaleString()} hint={`${approvedSongs.length} live · ${pendingSongs.length} pending · ${scheduledSongs.length} scheduled`} />
        </div>

        {/* Range selector */}
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Performance</h2>
          <div className="flex items-center gap-1 rounded-xl bg-muted/40 p-1">
            {[7, 30, 90].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r as 7 | 30 | 90)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${range === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-3">
          <Card className="p-4 rounded-2xl border-border/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Downloads & Likes</p>
              <span className="text-xs text-muted-foreground">{range} days</span>
            </div>
            <div className="h-48">
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
            <div className="h-48">
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

        {/* Top songs + Promotion tools */}
        <div className="grid md:grid-cols-3 gap-3">
          <Card className="md:col-span-2 p-4 rounded-2xl border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Top Songs</h3>
              <Link to="/profile" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">Manage all <ChevronRight className="h-3 w-3" /></Link>
            </div>
            {topSongs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No songs yet. <Link to="/upload" className="text-primary font-semibold">Upload your first track</Link>.</p>
            ) : (
              <div className="space-y-1">
                {topSongs.map((song, i) => (
                  <Link
                    key={song.id}
                    to={`/song/${song.id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition group"
                  >
                    <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                    <div className="h-11 w-11 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {song.cover_url ? <img src={song.cover_url} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><Music className="h-4 w-4 text-primary" /></div>}
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
            <h3 className="font-heading font-bold mb-3 flex items-center gap-2"><Rocket className="h-4 w-4 text-primary" />Promotion</h3>
            <div className="space-y-2">
              <ActionRow icon={Rocket} label="Boost a song" hint="Reach more listeners" to="/profile" />
              <ActionRow icon={LinkIcon} label="Pre-save links" hint={scheduledSongs.length > 0 ? `${scheduledSongs.length} scheduled` : "For scheduled releases"} to="/profile" />
              <ActionRow icon={Share2} label="Share kit" hint="Promo links & embeds" onClick={() => {}} />
              <div className="pt-2 mt-2 border-t border-border/40">
                <ShareKit
                  url={`${window.location.origin}${artistPath({ id: myArtist.id, name: myArtist.name })}`}
                  title={`${myArtist.name} on Sudagospel`}
                  description={`Listen to ${myArtist.name} — gospel music on Sudagospel`}
                  trigger={
                    <Button variant="outline" size="sm" className="w-full rounded-xl gap-1.5">
                      <Share2 className="h-3.5 w-3.5" /> Open share kit
                    </Button>
                  }
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Catalog summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryTile icon={Music} label="Songs" count={songs.length} to="/profile" />
          <SummaryTile icon={Disc3} label="Albums" count={albumCount} to="/profile" />
          <SummaryTile icon={Video} label="Videos" count={videoCount} to="/profile" />
          <SummaryTile icon={Calendar} label="Scheduled" count={scheduledSongs.length} to="/profile" highlight={scheduledSongs.length > 0} />
        </div>

        {/* Scheduled tracks promo */}
        {scheduledSongs.length > 0 && (
          <Card className="p-4 rounded-2xl border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <h3 className="font-heading font-bold mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Upcoming Releases</h3>
            <div className="space-y-2">
              {scheduledSongs.map((song) => (
                <div key={song.id} className="flex items-center gap-3 p-2 rounded-xl bg-background/60">
                  <div className="h-11 w-11 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {song.cover_url ? <img src={song.cover_url} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><Music className="h-4 w-4 text-primary" /></div>}
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
                    description={`Pre-save "${song.title}" by ${myArtist.name} — out ${song.scheduled_release_at ? format(new Date(song.scheduled_release_at), "MMM d") : "soon"}`}
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
      <MiniPlayer />
    </Layout>
  );
};

const KpiCard = ({ icon: Icon, label, value, delta, hint, accent }: { icon: any; label: string; value: string; delta?: string; hint?: string; accent?: string }) => (
  <Card className="p-4 rounded-2xl border-border/50 hover:border-primary/30 transition">
    <div className="flex items-center justify-between mb-2">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <Icon className={`h-4 w-4 ${accent || "text-muted-foreground"}`} />
    </div>
    <p className="font-heading font-extrabold text-2xl">{value}</p>
    {delta && <p className="text-[11px] text-primary font-semibold mt-1">{delta}</p>}
    {hint && <p className="text-[10px] text-muted-foreground mt-1 truncate">{hint}</p>}
  </Card>
);

const ActionRow = ({ icon: Icon, label, hint, to, onClick }: { icon: any; label: string; hint: string; to?: string; onClick?: () => void }) => {
  const content = (
    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition cursor-pointer group">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{label}</p>
        <p className="text-[11px] text-muted-foreground truncate">{hint}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : <button type="button" onClick={onClick} className="w-full text-left">{content}</button>;
};

const SummaryTile = ({ icon: Icon, label, count, to, highlight }: { icon: any; label: string; count: number; to: string; highlight?: boolean }) => (
  <Link to={to} className={`p-4 rounded-2xl border transition flex flex-col items-start gap-2 ${highlight ? "border-primary/40 bg-primary/5" : "border-border/50 hover:border-primary/30 bg-card"}`}>
    <Icon className={`h-5 w-5 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
    <div>
      <p className="font-heading font-extrabold text-xl">{count}</p>
      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
    </div>
  </Link>
);

export default ArtistDashboardPage;
