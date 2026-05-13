import { useMemo, useState, useRef } from "react";
import { songPath } from "@/lib/song-slug";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer, Track } from "@/hooks/use-player";
import { useMyFollowedArtists } from "@/hooks/use-follows";
import { artistPath } from "@/lib/artist-slug";
import { toast } from "sonner";
import {
  Headphones, Music, Heart, ListMusic, TrendingUp, Clock, Play, Pause,
  CheckCircle2, Circle, Award, Flame, Star, Crown, ShieldCheck, Sparkles,
  Share2, Copy, Camera, ChevronRight, Disc3, UserPlus,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  userId: string;
  profile: any;
  followerCount?: number;
  isArtist?: boolean;
  onProfileUpdated?: () => void;
}

/* ─── Section header ─── */
const SectionHeader = ({ icon: Icon, title, action }: { icon: any; title: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-3 px-1">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="font-heading text-[13px] font-extrabold text-foreground uppercase tracking-wider">{title}</h3>
    </div>
    {action}
  </div>
);

/* ═══════════════ COVER BANNER UPLOADER ═══════════════ */
export const CoverBanner = ({ userId, bannerUrl, onUpdated }: { userId: string; bannerUrl?: string | null; onUpdated?: () => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Banner must be under 5 MB"); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/banner-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updErr } = await supabase.from("profiles").update({ banner_url: urlData.publicUrl }).eq("user_id", userId);
      if (updErr) throw updErr;
      toast.success("Cover banner updated");
      onUpdated?.();
    } catch (e: any) { toast.error(e.message || "Upload failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="relative h-32 sm:h-44 md:h-52 overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-background">
      {bannerUrl && (
        <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-background/70 backdrop-blur-md text-foreground text-[11px] font-semibold px-3 py-1.5 border border-border/40 active:scale-95 transition-transform"
      >
        <Camera className="h-3.5 w-3.5" /> {bannerUrl ? "Change cover" : "Add cover"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
      />
    </div>
  );
};

/* ═══════════════ PROFILE COMPLETION ═══════════════ */
export const ProfileCompletion = ({ profile, followingCount }: { profile: any; followingCount: number }) => {
  const items = [
    { label: "Add a display name", done: !!profile?.display_name && profile.display_name.length > 1 },
    { label: "Upload a profile photo", done: !!profile?.avatar_url },
    { label: "Write a short bio", done: !!profile?.bio && profile.bio.length > 4 },
    { label: "Add a cover banner", done: !!profile?.banner_url },
    { label: "Follow at least one artist", done: followingCount > 0 },
  ];
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);
  if (pct === 100) return null;
  return (
    <div className="rounded-2xl bg-card/70 border border-border/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[13px] font-extrabold text-foreground">Complete your profile</p>
          <p className="text-[11px] text-muted-foreground">{done} of {items.length} done · {pct}%</p>
        </div>
        <div className="relative h-12 w-12">
          <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 94.2} 94.2`} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-foreground">{pct}%</span>
        </div>
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2 text-[12px]">
            {it.done ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground/40" />}
            <span className={it.done ? "text-muted-foreground line-through" : "text-foreground"}>{it.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ═══════════════ LISTENING STATS ═══════════════ */
export const ListeningStats = ({ userId }: { userId: string }) => {
  const { data } = useQuery({
    queryKey: ["listening-stats", userId],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: history } = await supabase
        .from("user_listening_history")
        .select("song_id, played_at, songs(duration_seconds, genre, artist_id, artists(name))")
        .eq("user_id", userId)
        .gte("played_at", since)
        .limit(1000);
      const rows = (history || []) as any[];
      const totalSeconds = rows.reduce((s, r) => s + (r.songs?.duration_seconds || 0), 0);
      const minutes = Math.round(totalSeconds / 60);
      const genreMap = new Map<string, number>();
      const artistMap = new Map<string, number>();
      rows.forEach((r) => {
        const g = r.songs?.genre;
        const an = r.songs?.artists?.name;
        if (g) genreMap.set(g, (genreMap.get(g) || 0) + 1);
        if (an) artistMap.set(an, (artistMap.get(an) || 0) + 1);
      });
      const topGenre = [...genreMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
      const topArtist = [...artistMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
      return { minutes, plays: rows.length, topGenre, topArtist };
    },
    enabled: !!userId,
  });

  return (
    <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-card/60 to-card/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-[11px] uppercase tracking-widest font-extrabold text-foreground">Your last 30 days</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="font-heading text-2xl font-black text-foreground tabular-nums leading-none">{(data?.minutes ?? 0).toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Minutes listened</p>
        </div>
        <div>
          <p className="font-heading text-2xl font-black text-foreground tabular-nums leading-none">{(data?.plays ?? 0).toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Songs played</p>
        </div>
        <div>
          <p className="text-[13px] font-extrabold text-primary truncate">{data?.topGenre || "—"}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Top genre</p>
        </div>
        <div>
          <p className="text-[13px] font-extrabold text-primary truncate">{data?.topArtist || "—"}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Top artist</p>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════ BADGES ═══════════════ */
export const BadgesRow = ({ profile, isArtist, followerCount, totalLikes, followingCount }: { profile: any; isArtist?: boolean; followerCount?: number; totalLikes: number; followingCount: number }) => {
  const badges = useMemo(() => {
    const list: { icon: any; label: string; color: string; earned: boolean }[] = [];
    list.push({ icon: Sparkles, label: "Early Supporter", color: "text-yellow-400", earned: !!profile?.created_at && new Date(profile.created_at) < new Date("2026-06-01") });
    list.push({ icon: ShieldCheck, label: "Verified", color: "text-blue-400", earned: !!isArtist && !!profile?.is_verified });
    list.push({ icon: Heart, label: "Tastemaker", color: "text-pink-400", earned: totalLikes >= 10 });
    list.push({ icon: Flame, label: "Top Listener", color: "text-orange-400", earned: false }); // computed below
    list.push({ icon: UserPlus, label: "Connected", color: "text-emerald-400", earned: followingCount >= 3 });
    list.push({ icon: Star, label: "Rising Artist", color: "text-primary", earned: !!isArtist && (followerCount || 0) >= 50 });
    return list;
  }, [profile, isArtist, followerCount, totalLikes, followingCount]);

  return (
    <div>
      <SectionHeader icon={Award} title="Badges" />
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {badges.map((b) => (
          <div
            key={b.label}
            className={`flex-shrink-0 w-[90px] flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
              b.earned
                ? "bg-card/80 border-border/60"
                : "bg-card/20 border-border/30 opacity-40 grayscale"
            }`}
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center bg-background ${b.earned ? b.color : "text-muted-foreground"}`}>
              <b.icon className="h-6 w-6" fill={b.earned ? "currentColor" : "none"} />
            </div>
            <span className={`text-[10px] font-bold text-center leading-tight ${b.earned ? "text-foreground" : "text-muted-foreground"}`}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════ SHARE PROFILE ═══════════════ */
export const ShareProfileButton = ({ profile, userId }: { profile: any; userId: string }) => {
  const handle = (profile?.display_name || "user").toLowerCase().replace(/\s+/g, "-");
  const url = `${window.location.origin}/u/${handle}-${userId.slice(0, 6)}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast.success("Profile link copied"); }
    catch { toast.error("Could not copy"); }
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-full font-semibold gap-1.5 h-9 px-4 border-border/60 bg-card/40 backdrop-blur">
          <Share2 className="h-3.5 w-3.5" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Share your profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl bg-muted/40 p-3 flex items-center gap-2">
            <span className="text-xs font-mono text-foreground truncate flex-1">{url}</span>
            <Button onClick={copy} size="sm" className="rounded-full bg-primary text-primary-foreground gap-1.5 h-8 px-3">
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          </div>
          <img
            alt="QR code to your profile"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}&bgcolor=0f0f0f&color=ffffff&margin=10`}
            className="mx-auto h-48 w-48 rounded-xl border border-border/40"
          />
          <p className="text-[11px] text-muted-foreground text-center">Anyone can scan this code to open your profile.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════ HORIZONTAL CARD ROW ═══════════════ */
const SmallCard = ({ to, cover, title, subtitle, fallback, onPlay, isPlaying }: any) => (
  <div className="flex-shrink-0 w-[130px] group">
    <Link to={to} className="block">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted shadow-md mb-2">
        {cover ? <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" /> : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">{fallback}</div>
        )}
        {onPlay && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPlay(); }}
            className="absolute bottom-2 right-2 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/30 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
          >
            {isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4 ml-0.5" fill="currentColor" />}
          </button>
        )}
      </div>
      <p className="text-[12px] font-bold text-foreground truncate group-hover:text-primary transition-colors">{title}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>}
    </Link>
  </div>
);

/* ═══════════════ RECENTLY PLAYED ═══════════════ */
export const RecentlyPlayedRow = () => {
  const { recentlyPlayed, currentTrack, isPlaying, togglePlay, play } = usePlayer();
  if (!recentlyPlayed || recentlyPlayed.length === 0) return null;
  return (
    <div>
      <SectionHeader icon={Clock} title="Recently played" />
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {recentlyPlayed.slice(0, 12).map((t: Track) => {
          const current = currentTrack?.id === t.id;
          return (
            <SmallCard
              key={t.id}
              to={songPath(t.id, t.title)}
              cover={t.coverUrl}
              title={t.title}
              subtitle={t.artist}
              fallback={<Music className="h-8 w-8 text-muted-foreground/40" />}
              onPlay={() => (current ? togglePlay() : play(t))}
              isPlaying={current && isPlaying}
            />
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════ LIKED SONGS ═══════════════ */
export const LikedSongsRow = ({ userId }: { userId: string }) => {
  const { data } = useQuery({
    queryKey: ["my-liked-songs-row", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("song_likes")
        .select("created_at, songs(id, title, cover_url, file_url, artists(name))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      return (data || []).map((r: any) => r.songs).filter(Boolean);
    },
    enabled: !!userId,
  });
  const { currentTrack, isPlaying, togglePlay, play } = usePlayer();
  if (!data || data.length === 0) return null;
  return (
    <div>
      <SectionHeader icon={Heart} title="Liked songs" action={
        <Link to="/library" className="text-[11px] font-semibold text-muted-foreground hover:text-primary flex items-center gap-1">See all <ChevronRight className="h-3 w-3" /></Link>
      } />
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {data.map((s: any) => {
          const current = currentTrack?.id === s.id;
          return (
            <SmallCard
              key={s.id}
              to={songPath(s.id, s.title)}
              cover={s.cover_url}
              title={s.title}
              subtitle={s.artists?.name}
              fallback={<Heart className="h-7 w-7 text-primary/50" fill="currentColor" />}
              onPlay={() => {
                const t: Track = { id: s.id, title: s.title, artist: s.artists?.name || "Unknown", fileUrl: s.file_url, coverUrl: s.cover_url || undefined };
                current ? togglePlay() : play(t);
              }}
              isPlaying={current && isPlaying}
            />
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════ MY PLAYLISTS ═══════════════ */
export const MyPlaylistsRow = ({ userId }: { userId: string }) => {
  const { data } = useQuery({
    queryKey: ["my-playlists-row", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("playlists")
        .select("id, name, cover_url, description, playlist_songs(count)")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!userId,
  });
  if (!data || data.length === 0) return null;
  return (
    <div>
      <SectionHeader icon={ListMusic} title="My playlists" action={
        <Link to="/playlists" className="text-[11px] font-semibold text-muted-foreground hover:text-primary flex items-center gap-1">See all <ChevronRight className="h-3 w-3" /></Link>
      } />
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {data.map((p: any) => (
          <SmallCard
            key={p.id}
            to={`/playlist/${p.id}`}
            cover={p.cover_url}
            title={p.name}
            subtitle={`${(p.playlist_songs as any)?.[0]?.count || 0} songs`}
            fallback={<Disc3 className="h-8 w-8 text-muted-foreground/40" />}
          />
        ))}
      </div>
    </div>
  );
};

/* ═══════════════ FOLLOWING + SUGGESTIONS ═══════════════ */
export const FollowingRow = ({ userId }: { userId: string }) => {
  const { data: followed } = useMyFollowedArtists();
  const followedIds = (followed || []).map((a: any) => a.id);
  const { data: suggested } = useQuery({
    queryKey: ["artist-suggestions", userId, followedIds.length],
    queryFn: async () => {
      const q = supabase
        .from("artists")
        .select("id, name, avatar_url, is_verified")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(8);
      const { data } = await q;
      return (data || []).filter((a) => !followedIds.includes(a.id)).slice(0, 6);
    },
    enabled: !!userId,
  });

  const hasFollowed = followed && followed.length > 0;
  const hasSuggested = suggested && suggested.length > 0;
  if (!hasFollowed && !hasSuggested) return null;

  return (
    <div>
      <SectionHeader icon={Headphones} title={hasFollowed ? "Following" : "Suggested artists"} action={
        <Link to="/artists" className="text-[11px] font-semibold text-muted-foreground hover:text-primary flex items-center gap-1">Browse <ChevronRight className="h-3 w-3" /></Link>
      } />
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {(hasFollowed ? followed : suggested)!.map((a: any) => (
          <Link key={a.id} to={artistPath(a.name)} className="flex-shrink-0 flex flex-col items-center gap-2 w-[76px] group">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-muted ring-2 ring-transparent group-hover:ring-primary/50 transition-all shadow-md">
              {a.avatar_url ? (
                <img src={a.avatar_url} alt={a.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-base font-extrabold text-primary-foreground">{a.name?.[0]}</div>
              )}
            </div>
            <span className="text-[11px] font-semibold text-foreground truncate w-full text-center group-hover:text-primary transition-colors">{a.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════ ALL EXTRAS WRAPPER ═══════════════ */
const ProfileExtras = ({ userId, profile, followerCount, isArtist, onProfileUpdated }: Props) => {
  const { data: totalLikes = 0 } = useQuery({
    queryKey: ["my-likes-count-extras", userId],
    queryFn: async () => {
      const { count } = await supabase.from("song_likes").select("*", { count: "exact", head: true }).eq("user_id", userId);
      return count ?? 0;
    },
    enabled: !!userId,
  });
  const { data: followed } = useMyFollowedArtists();
  const followingCount = followed?.length ?? 0;

  return (
    <div className="px-4 lg:px-8 mt-6">
      <div className="max-w-2xl mx-auto space-y-7">
        <ProfileCompletion profile={profile} followingCount={followingCount} />
        <ListeningStats userId={userId} />
        <BadgesRow profile={profile} isArtist={isArtist} followerCount={followerCount} totalLikes={totalLikes} followingCount={followingCount} />
        <RecentlyPlayedRow />
        <LikedSongsRow userId={userId} />
        <MyPlaylistsRow userId={userId} />
        <FollowingRow userId={userId} />
      </div>
    </div>
  );
};

export default ProfileExtras;
