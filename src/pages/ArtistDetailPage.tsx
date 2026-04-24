import { useParams, useNavigate, Link } from "react-router-dom";
import { artistSlug } from "@/lib/artist-slug";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer, Track } from "@/hooks/use-player";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Music, CheckCircle, Play, Pause, Shuffle,
  Download, Share2, Disc3, UserPlus, UserCheck, MoreHorizontal, BadgeCheck, Radio,
  Pin, ShoppingBag, Calendar, Heart, Globe, Link as LinkIconLucide, ExternalLink,
} from "lucide-react";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { useFollowArtist } from "@/hooks/use-follows";
import ShareDialog from "@/components/ShareDialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { useArtistLinks, useTopTracks } from "@/hooks/use-artist-management";

const linkTypeIcon = (t: string) => {
  switch (t) {
    case "merch": return ShoppingBag;
    case "tour": return Calendar;
    case "donate": return Heart;
    case "website": return Globe;
    default: return LinkIconLucide;
  }
};

type TabKey = "all" | "top-tracks" | "albums";

const ArtistDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verifyReason, setVerifyReason] = useState("");

  const { data: artist, isLoading } = useQuery({
    queryKey: ["artist", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("artists").select("*");
      if (error) throw error;
      const match = data?.find((a) => artistSlug(a.name) === slug);
      if (!match) throw new Error("Artist not found");
      return match;
    },
    enabled: !!slug,
  });

  const artistId = artist?.id;
  const isOwnProfile = !!user && !!artist?.user_id && user.id === artist.user_id;

  const { data: verificationStatus } = useQuery({
    queryKey: ["verification-status", artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verification_requests")
        .select("status")
        .eq("artist_id", artistId!)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isOwnProfile && !artist?.is_verified,
  });

  const requestVerification = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("verification_requests").insert({
        artist_id: artistId!,
        user_id: user!.id,
        reason: verifyReason.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Verification request submitted!");
      setShowVerifyForm(false);
      setVerifyReason("");
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const { data: songs } = useQuery({
    queryKey: ["artist-songs", artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(name, avatar_url)")
        .eq("artist_id", artistId!)
        .eq("is_approved", true)
        .order("play_count", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!artistId,
  });

  const { data: albums } = useQuery({
    queryKey: ["artist-albums", artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("albums")
        .select("*")
        .eq("artist_id", artistId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!artistId,
  });

  const topSongs = useMemo(() => {
    if (!songs) return [];
    return [...songs].sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
  }, [songs]);

  const displayedSongs = showAllTracks ? topSongs : topSongs.slice(0, 5);

  const queue: Track[] = useMemo(() =>
    topSongs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: (s.artists as any)?.name || "Unknown",
      fileUrl: s.file_url,
      coverUrl: s.cover_url || undefined,
    })), [topSongs]);

  const totalPlays = songs?.reduce((sum, s) => sum + (s.play_count || 0), 0) || 0;
  const totalDownloads = songs?.reduce((sum, s) => sum + (s.download_count || 0), 0) || 0;
  const { isFollowing, followerCount, toggleFollow } = useFollowArtist(artistId || "");

  const canonicalUrl = artist ? `https://sudagospel.com/artist/${artistSlug(artist.name)}` : undefined;
  const songCount = songs?.length || 0;
  const seoDescription = artist?.bio
    ? `${artist.bio.slice(0, 140)}${artist.bio.length > 140 ? "…" : ""}`
    : `Listen to ${artist?.name || "this artist"}'s ${songCount} gospel songs on Sudagospel.`;

  useDocumentMeta({
    title: artist?.name || "Artist",
    description: seoDescription,
    ogImage: artist?.avatar_url || undefined,
    ogType: "music.musician",
    canonicalUrl,
    keywords: artist ? `${artist.name}, South Sudan gospel, gospel music, ${artist.genre || "gospel"}, Sudagospel` : undefined,
    jsonLd: artist ? {
      "@context": "https://schema.org", "@type": "MusicGroup",
      name: artist.name, url: canonicalUrl, genre: artist.genre || "Gospel",
      image: artist.avatar_url || undefined, description: seoDescription, numberOfItems: songCount,
    } : undefined,
  });

  const handlePlayAll = () => { if (queue.length > 0) play(queue[0], queue); };
  const handleShuffle = () => {
    if (queue.length === 0) return;
    const shuffled = [...queue].sort(() => Math.random() - 0.5);
    play(shuffled[0], shuffled);
    toast.success("Shuffling songs");
  };
  const artistShareUrl = `https://sudagospel.com/artist/${artist?.id}`;

  const formatTime = (s: number | null) => {
    if (!s) return "--:--";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-[220px] md:h-[280px] bg-muted" />
          <div className="px-4 lg:px-8 max-w-6xl mx-auto flex flex-col md:flex-row gap-6 -mt-16">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-muted border-4 border-background flex-shrink-0" />
            <div className="flex-1 pt-20">
              <div className="h-8 w-48 bg-muted rounded mb-2" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!artist) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <Music className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Artist not found</p>
        </div>
      </Layout>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "top-tracks", label: "Top Tracks" },
    { key: "albums", label: "Albums" },
  ];

  return (
    <Layout>
      <div className="pb-28">
        {/* === COVER BANNER === */}
        <div className="relative h-[220px] md:h-[320px] overflow-hidden bg-card">
          {(artist as any).cover_url || artist.avatar_url ? (
            <img src={(artist as any).cover_url || artist.avatar_url!} alt="" className="h-full w-full object-cover object-top" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/30 via-secondary/20 to-background" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

          {/* Nav buttons */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-10 h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <ShareDialog
              title={artist?.name || "Artist"}
              coverUrl={artist?.avatar_url || undefined}
              shareUrl={artistShareUrl}
              type="artist"
              trigger={
                <button className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors active:scale-95">
                  <Share2 className="h-5 w-5" />
                </button>
              }
            />
            <button className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors active:scale-95">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* === PROFILE SECTION (Audiomack-style: left sidebar + right content) === */}
        <div className="px-4 lg:px-8 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-0 md:gap-8">
            {/* LEFT SIDEBAR */}
            <div className="flex-shrink-0 md:w-[260px] -mt-16 md:-mt-20 relative z-10">
              {/* Avatar */}
              <div className="h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden border-4 border-background shadow-2xl mx-auto md:mx-0">
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-heading font-bold text-primary-foreground">
                    {artist.name[0]}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="mt-4 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
                    {artist.name}
                  </h1>
                  {artist.is_verified && (
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" fill="hsl(var(--primary))" stroke="hsl(var(--primary-foreground))" />
                  )}
                </div>
                {artist.genre && (
                  <p className="text-sm text-muted-foreground mt-0.5">@{artistSlug(artist.name)}</p>
                )}
              </div>

              {/* Follow + Action buttons */}
              <div className="mt-4 flex items-center gap-2 justify-center md:justify-start flex-wrap">
                <button
                  onClick={() => toggleFollow()}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 ${
                    isFollowing
                      ? "border-2 border-primary text-primary hover:bg-primary/10"
                      : "bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {isFollowing ? "Following" : "Follow"}
                  </span>
                </button>
                {queue.length > 0 && (
                  <>
                    <button
                      onClick={handlePlayAll}
                      className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md shadow-primary/30"
                    >
                      <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
                    </button>
                    <button
                      onClick={handleShuffle}
                      className="h-10 w-10 rounded-full bg-card border border-border/50 text-muted-foreground flex items-center justify-center hover:text-foreground hover:scale-105 active:scale-95 transition-all"
                      aria-label="Shuffle"
                    >
                      <Shuffle className="h-4 w-4" />
                    </button>
                    <Link
                      to={`/radio/${artistId}`}
                      className="h-10 px-4 rounded-full bg-card border border-border/50 text-foreground text-sm font-bold flex items-center gap-1.5 hover:bg-muted active:scale-95 transition-all"
                    >
                      <Radio className="h-4 w-4 text-secondary" /> Radio
                    </Link>
                  </>
                )}
              </div>

              {/* Verification Request */}
              {isOwnProfile && !artist.is_verified && (
                <div className="mt-4">
                  {verificationStatus?.status === "pending" ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                      <BadgeCheck className="h-4 w-4 text-primary" />
                      Verification pending...
                    </div>
                  ) : verificationStatus?.status === "rejected" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-full w-full"
                      onClick={() => setShowVerifyForm(true)}
                    >
                      <BadgeCheck className="h-3.5 w-3.5" /> Reapply for Verification
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-full w-full"
                      onClick={() => setShowVerifyForm(true)}
                    >
                      <BadgeCheck className="h-3.5 w-3.5" /> Request Verification
                    </Button>
                  )}

                  {showVerifyForm && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        placeholder="Why should you be verified? (optional)"
                        value={verifyReason}
                        onChange={(e) => setVerifyReason(e.target.value)}
                        rows={3}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="rounded-full flex-1"
                          onClick={() => requestVerification.mutate()}
                          disabled={requestVerification.isPending}
                        >
                          Submit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowVerifyForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="mt-6 space-y-4 border-t border-border/50 pt-5 text-center md:text-left">
                <div>
                  <p className="font-heading text-2xl font-extrabold text-foreground">{formatCount(followerCount)}</p>
                  <p className="text-sm text-primary font-medium">Followers</p>
                </div>
                <div>
                  <p className="font-heading text-2xl font-extrabold text-foreground">{formatCount(totalPlays)}</p>
                  <p className="text-sm text-primary font-medium">Total Plays</p>
                </div>
                <div>
                  <p className="font-heading text-2xl font-extrabold text-foreground">{formatCount(totalDownloads)}</p>
                  <p className="text-sm text-primary font-medium">Downloads</p>
                </div>
              </div>

              {/* Bio */}
              {artist.bio && (
                <div className="mt-5 border-t border-border/50 pt-5">
                  <p className="text-sm text-muted-foreground leading-relaxed">{artist.bio}</p>
                </div>
              )}

              {/* Member since */}
              <div className="mt-5 border-t border-border/50 pt-5 text-center md:text-left hidden md:block">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Member Since: </span>
                  {new Date(artist.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* RIGHT CONTENT */}
            <div className="flex-1 min-w-0 mt-6 md:mt-0">
              {/* Tabs */}
              <div className="border-b border-border/50 flex gap-0 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all relative ${
                      activeTab === tab.key
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="mt-6">
                {/* ALL TAB / TOP TRACKS TAB */}
                {(activeTab === "all" || activeTab === "top-tracks") && (
                  <div>
                    {/* Highlighted albums (only on All tab) */}
                    {activeTab === "all" && albums && albums.length > 0 && (
                      <div className="mb-8">
                        <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground mb-4">
                          HIGHLIGHTED
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                          {albums.slice(0, 4).map((album) => (
                            <div
                              key={album.id}
                              className="group cursor-pointer flex-shrink-0 w-36 md:w-44"
                              onClick={() => navigate(`/album/${album.id}`)}
                            >
                              <div className="aspect-square rounded-lg overflow-hidden bg-muted shadow-md group-hover:shadow-xl transition-all">
                                {album.cover_url ? (
                                  <img src={album.cover_url} alt={album.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                ) : (
                                  <div className="h-full w-full bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center">
                                    <Disc3 className="h-10 w-10 text-primary/40" />
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2 text-center">{artist.name}</p>
                              <div className="flex items-center gap-1 justify-center">
                                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{album.title}</p>
                                <span className="text-[8px] font-bold uppercase px-1 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">{(album as any).album_type || "album"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Top Tracks */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
                          TOP TRACKS
                        </h2>
                        {activeTab === "all" && topSongs.length > 5 && (
                          <button
                            onClick={() => setActiveTab("top-tracks")}
                            className="text-xs font-bold text-primary hover:text-primary/80 uppercase tracking-wider transition-colors"
                          >
                            VIEW ALL
                          </button>
                        )}
                      </div>

                      {topSongs.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-center">
                          <Music className="h-12 w-12 text-muted-foreground/20 mb-3" />
                          <p className="text-muted-foreground">{artist.name} has no content yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-0">
                          {displayedSongs.map((song, index) => {
                            const artistName = (song.artists as any)?.name || "Unknown";
                            const isCurrentSong = currentTrack?.id === song.id;

                            return (
                              <div
                                key={song.id}
                                className={`flex items-center gap-3 px-2 py-3 rounded-lg transition-all cursor-pointer group border-b border-border/20 last:border-0 ${
                                  isCurrentSong ? "bg-primary/8" : "hover:bg-card/60"
                                }`}
                                onClick={() => {
                                  if (isCurrentSong) togglePlay();
                                  else play({ id: song.id, title: song.title, artist: artistName, fileUrl: song.file_url, coverUrl: song.cover_url || undefined }, queue);
                                }}
                              >
                                {/* Cover */}
                                <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                                  {song.cover_url ? (
                                    <img src={song.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                                  ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center">
                                      <Music className="h-5 w-5 text-primary-foreground/60" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isCurrentSong && isPlaying ? (
                                      <Pause className="h-4 w-4 text-white" />
                                    ) : (
                                      <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                                    )}
                                  </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <Link to={`/song/${song.id}`} onClick={(e) => e.stopPropagation()}>
                                    <p className={`text-sm font-semibold truncate hover:underline ${isCurrentSong ? "text-primary" : "text-foreground"}`}>
                                      {song.title}
                                    </p>
                                  </Link>
                                  <p className="text-xs text-muted-foreground truncate">{artistName}</p>
                                </div>

                                {/* Play count */}
                                <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
                                  {formatCount(song.play_count || 0)} plays
                                </span>

                                {/* Duration */}
                                <span className="text-xs text-muted-foreground tabular-nums hidden sm:block w-12 text-right">
                                  {formatTime(song.duration_seconds)}
                                </span>

                                {/* Download */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast.info("Preparing download...");
                                    fetch(song.file_url).then(r => r.blob()).then(blob => {
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement("a");
                                      a.href = url; a.download = `${song.title} - ${artistName}.mp3`;
                                      document.body.appendChild(a); a.click(); document.body.removeChild(a);
                                      URL.revokeObjectURL(url);
                                      toast.success("Download started!");
                                    }).catch(() => toast.error("Download failed."));
                                  }}
                                  className="p-2 rounded-full text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {activeTab === "top-tracks" && topSongs.length > 5 && !showAllTracks && (
                        <button
                          onClick={() => setShowAllTracks(true)}
                          className="mt-4 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                        >
                          Show all {topSongs.length} tracks
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ALBUMS TAB */}
                {activeTab === "albums" && (
                  <div>
                    {albums && albums.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {albums.map((album) => (
                          <div
                            key={album.id}
                            className="group cursor-pointer"
                            onClick={() => navigate(`/album/${album.id}`)}
                          >
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted shadow-md group-hover:shadow-xl transition-all">
                              {album.cover_url ? (
                                <img src={album.cover_url} alt={album.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                              ) : (
                                <div className="h-full w-full bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center">
                                  <Disc3 className="h-12 w-12 text-primary/40" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">{artist.name}</p>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{album.title}</p>
                              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">{(album as any).album_type || "album"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-16 text-center">
                        <Disc3 className="h-12 w-12 text-muted-foreground/20 mb-3" />
                        <p className="text-muted-foreground">No albums yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* YouTube section */}
        {artist.youtube_channel_url && (
          <div className="px-4 lg:px-8 max-w-6xl mx-auto mt-8">
            <YouTubeEmbed channelUrl={artist.youtube_channel_url} artistName={artist.name} />
          </div>
        )}
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default ArtistDetailPage;
