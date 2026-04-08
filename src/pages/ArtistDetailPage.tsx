import { useParams, useNavigate, Link } from "react-router-dom";
import { artistSlug } from "@/lib/artist-slug";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer, Track } from "@/hooks/use-player";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Music, CheckCircle, Play, Pause, Shuffle,
  Download, Share2, Clock, TrendingUp, Disc3, UserPlus, UserCheck,
  MoreHorizontal, Heart
} from "lucide-react";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { useFollowArtist } from "@/hooks/use-follows";
import { toast } from "sonner";
import { useState, useMemo, useRef, useEffect } from "react";

type SortMode = "popular" | "newest" | "title";

const ArtistDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [bannerOffset, setBannerOffset] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setBannerOffset(window.scrollY * 0.4);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const sortedSongs = useMemo(() => {
    if (!songs) return [];
    const copy = [...songs];
    switch (sortMode) {
      case "popular": return copy.sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
      case "newest": return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "title": return copy.sort((a, b) => a.title.localeCompare(b.title));
      default: return copy;
    }
  }, [songs, sortMode]);

  const displayedSongs = showAllTracks ? sortedSongs : sortedSongs.slice(0, 5);

  const queue: Track[] = useMemo(() =>
    sortedSongs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: (s.artists as any)?.name || "Unknown",
      fileUrl: s.file_url,
      coverUrl: s.cover_url || undefined,
    })), [sortedSongs]);

  const totalPlays = songs?.reduce((sum, s) => sum + (s.play_count || 0), 0) || 0;
  const totalDownloads = songs?.reduce((sum, s) => sum + (s.download_count || 0), 0) || 0;
  const { isFollowing, followerCount, toggleFollow } = useFollowArtist(artistId || "");

  const canonicalUrl = artist ? `https://sudagospel.lovable.app/artist/${artistSlug(artist.name)}` : undefined;
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
      "@context": "https://schema.org",
      "@type": "MusicGroup",
      name: artist.name,
      url: canonicalUrl,
      genre: artist.genre || "Gospel",
      image: artist.avatar_url || undefined,
      description: seoDescription,
      numberOfItems: songCount,
    } : undefined,
  });

  const handlePlayAll = () => {
    if (queue.length === 0) return;
    play(queue[0], queue);
  };

  const handleShuffle = () => {
    if (queue.length === 0) return;
    const shuffled = [...queue].sort(() => Math.random() - 0.5);
    play(shuffled[0], shuffled);
    toast.success("Shuffling songs");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: artist?.name, text: `Check out ${artist?.name} on Sudagospel`, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  const formatTime = (s: number | null) => {
    if (!s) return "--:--";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-[320px] bg-muted" />
          <div className="px-4 -mt-16">
            <div className="h-32 w-32 rounded-full bg-muted border-4 border-background" />
            <div className="mt-4 h-8 w-48 bg-muted rounded" />
            <div className="mt-2 h-4 w-32 bg-muted rounded" />
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

  return (
    <Layout>
      <div className="pb-28">
        {/* === COVER BANNER with parallax === */}
        <div ref={heroRef} className="relative h-[300px] md:h-[380px] overflow-hidden">
          <div
            className="absolute inset-0 w-full h-[140%]"
            style={{ transform: `translateY(-${bannerOffset}px)` }}
          >
            {artist.avatar_url ? (
              <img
                src={artist.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/60 via-secondary/40 to-background" />
            )}
          </div>
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-10 h-10 w-10 rounded-full glass flex items-center justify-center text-foreground hover:bg-card/80 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full glass flex items-center justify-center text-foreground hover:bg-card/80 transition-colors"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        {/* === ARTIST INFO overlapping banner === */}
        <div className="relative px-4 lg:px-8 -mt-24 md:-mt-28 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
            {/* Artist avatar */}
            <div className="relative flex-shrink-0">
              <div className="h-36 w-36 md:h-44 md:w-44 rounded-full overflow-hidden border-4 border-background shadow-[0_8px_40px_rgba(0,0,0,0.5)] ring-2 ring-primary/20">
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-5xl font-heading font-bold text-primary-foreground">
                    {artist.name[0]}
                  </div>
                )}
              </div>
              {artist.is_verified && (
                <div className="absolute bottom-1 right-1 bg-primary rounded-full p-1.5 shadow-lg border-[3px] border-background glow-gold">
                  <CheckCircle className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 text-center sm:text-left pb-1">
              {artist.is_verified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                  <CheckCircle className="h-3 w-3" /> Verified Artist
                </span>
              )}
              <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-foreground leading-tight">
                {artist.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 justify-center sm:justify-start text-sm text-muted-foreground">
                {artist.genre && (
                  <span className="bg-muted px-2.5 py-0.5 rounded-full text-xs font-medium">{artist.genre}</span>
                )}
                <span>{formatCount(followerCount)} followers</span>
                <span className="text-foreground/20">•</span>
                <span>{formatCount(totalPlays)} streams</span>
              </div>
            </div>
          </div>

          {/* === ACTION BUTTONS === */}
          <div className="flex items-center gap-3 mt-6 flex-wrap justify-center sm:justify-start">
            <button
              onClick={handlePlayAll}
              className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg glow-gold hover:scale-110 active:scale-95 transition-all flex-shrink-0"
              disabled={queue.length === 0}
            >
              <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
            </button>
            <Button
              onClick={handleShuffle}
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5 border-border/50 hover:border-primary/40 hover:text-primary transition-all"
              disabled={queue.length === 0}
            >
              <Shuffle className="h-4 w-4" /> Shuffle
            </Button>
            <Button
              onClick={() => toggleFollow()}
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className={`rounded-full gap-1.5 transition-all ${
                isFollowing
                  ? "border-primary/30 text-primary hover:bg-primary/10"
                  : "bg-primary text-primary-foreground hover:scale-105 glow-gold"
              }`}
            >
              {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>

          {/* === STATS ROW === */}
          <div className="grid grid-cols-4 gap-3 mt-6 p-4 rounded-2xl bg-card/60 border border-border/50">
            {[
              { label: "Songs", value: songCount },
              { label: "Streams", value: totalPlays },
              { label: "Downloads", value: totalDownloads },
              { label: "Followers", value: followerCount },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-heading text-xl md:text-2xl font-bold text-foreground">{formatCount(stat.value)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* === TOP SONGS === */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold text-foreground">Top Songs</h2>
              <div className="flex items-center gap-1">
                {(["popular", "newest", "title"] as SortMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSortMode(mode)}
                    className={`text-[11px] px-2.5 py-1 rounded-full transition-all font-medium capitalize ${
                      sortMode === mode
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-0.5">
              {displayedSongs.map((song, index) => {
                const artistName = (song.artists as any)?.name || "Unknown";
                const isCurrentSong = currentTrack?.id === song.id;

                return (
                  <div
                    key={song.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${
                      isCurrentSong ? "bg-primary/10 border border-primary/20" : "hover:bg-card/80"
                    }`}
                    onClick={() => {
                      if (isCurrentSong) togglePlay();
                      else play({ id: song.id, title: song.title, artist: artistName, fileUrl: song.file_url, coverUrl: song.cover_url || undefined }, queue);
                    }}
                  >
                    {/* Number / play indicator */}
                    <div className="w-6 flex-shrink-0 text-center">
                      {isCurrentSong && isPlaying ? (
                        <div className="flex items-center justify-center gap-[2px]">
                          <span className="inline-block w-[3px] h-3 bg-primary rounded-full animate-pulse" />
                          <span className="inline-block w-[3px] h-4 bg-primary rounded-full animate-pulse [animation-delay:150ms]" />
                          <span className="inline-block w-[3px] h-2 bg-primary rounded-full animate-pulse [animation-delay:300ms]" />
                        </div>
                      ) : (
                        <>
                          <span className="text-sm text-muted-foreground tabular-nums group-hover:hidden">{index + 1}</span>
                          <Play className="h-4 w-4 text-foreground hidden group-hover:block mx-auto" fill="currentColor" />
                        </>
                      )}
                    </div>

                    {/* Cover */}
                    <div className="h-11 w-11 rounded-lg overflow-hidden flex-shrink-0 bg-muted shadow-sm">
                      {song.cover_url ? (
                        <img src={song.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                          {song.title[0]}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/song/${song.id}`} onClick={(e) => e.stopPropagation()}>
                        <p className={`text-sm font-semibold truncate hover:underline ${isCurrentSong ? "text-primary" : "text-foreground"}`}>
                          {song.title}
                        </p>
                      </Link>
                      <p className="text-[11px] text-muted-foreground">{formatCount(song.play_count || 0)} streams</p>
                    </div>

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

            {sortedSongs.length > 5 && (
              <button
                onClick={() => setShowAllTracks(!showAllTracks)}
                className="mt-4 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {showAllTracks ? "Show less" : `See all ${sortedSongs.length} songs`}
              </button>
            )}

            {sortedSongs.length === 0 && (
              <div className="flex flex-col items-center py-16 text-center">
                <Music className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">No songs uploaded yet</p>
              </div>
            )}
          </section>

          {/* === ALBUMS === */}
          {albums && albums.length > 0 && (
            <section className="mt-8">
              <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Disc3 className="h-5 w-5 text-primary" /> Albums
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    className="group cursor-pointer flex-shrink-0 w-36 md:w-44"
                    onClick={() => navigate(`/album/${album.id}`)}
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-muted shadow-md group-hover:shadow-xl transition-shadow">
                      {album.cover_url ? (
                        <img src={album.cover_url} alt={album.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center">
                          <Disc3 className="h-10 w-10 text-primary/40" />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shadow-xl glow-gold">
                          <Play className="h-4 w-4 text-primary-foreground fill-primary-foreground ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{album.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{album.genre || "Album"}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* === ABOUT === */}
          <section className="mt-8">
            <h2 className="font-heading text-lg font-bold text-foreground mb-4">About {artist.name}</h2>
            <div className="rounded-2xl bg-card/60 border border-border/50 overflow-hidden">
              {artist.avatar_url && (
                <div className="h-40 overflow-hidden">
                  <img src={artist.avatar_url} alt="" className="w-full h-full object-cover opacity-60" />
                </div>
              )}
              <div className="p-5">
                {artist.bio ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">{artist.bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No bio available yet.</p>
                )}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
                  <span className="text-sm font-bold text-foreground">{formatCount(followerCount)}</span>
                  <span className="text-xs text-muted-foreground">monthly listeners</span>
                </div>
                {artist.is_verified && (
                  <div className="flex items-center gap-2 mt-3">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <p className="text-xs text-muted-foreground">Verified by Sudagospel</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* === YOUTUBE === */}
          {artist.youtube_channel_url && (
            <section className="mt-8">
              <YouTubeEmbed channelUrl={artist.youtube_channel_url} artistName={artist.name} />
            </section>
          )}
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default ArtistDetailPage;
