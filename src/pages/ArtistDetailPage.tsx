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
  Download, Share2, Clock, TrendingUp, Disc3, UserPlus, UserCheck
} from "lucide-react";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { useFollowArtist } from "@/hooks/use-follows";
import { toast } from "sonner";
import { useState, useMemo } from "react";

type SortMode = "popular" | "newest" | "title";

const ArtistDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [showAllTracks, setShowAllTracks] = useState(false);

  const { data: artist, isLoading } = useQuery({
    queryKey: ["artist", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*");
      if (error) throw error;
      // Match by slugified name
      const match = data?.find((a) => artistSlug(a.name) === slug);
      if (!match) throw new Error("Artist not found");
      return match;
    },
    enabled: !!slug,
  });

  const { data: songs } = useQuery({
    queryKey: ["artist-songs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(name, avatar_url)")
        .eq("artist_id", id!)
        .eq("is_approved", true)
        .order("play_count", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
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
  const { isFollowing, followerCount, toggleFollow } = useFollowArtist(id!);

  useDocumentMeta({
    title: artist?.name || "Artist",
    description: artist?.bio || `Listen to ${artist?.name || "this artist"}'s music on Sudagospel.`,
    ogImage: artist?.avatar_url || undefined,
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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
        {/* === HERO BANNER === */}
        <div className="relative overflow-hidden min-h-[280px] md:min-h-[340px]">
          {/* Background */}
          <div className="absolute inset-0">
            {artist.avatar_url ? (
              <img src={artist.avatar_url} alt="" className="h-full w-full object-cover scale-110 blur-[80px] opacity-60" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/50 to-secondary/30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/50 to-background" />
          </div>

          <div className="relative px-4 lg:px-8 pt-4 pb-8">
            <button
              onClick={() => navigate(-1)}
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-foreground/70 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            {/* Artist info - horizontal layout */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 max-w-4xl mx-auto">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="h-40 w-40 md:h-52 md:w-52 rounded-full overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
                  {artist.avatar_url ? (
                    <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-6xl font-heading font-bold text-primary-foreground">
                      {artist.name[0]}
                    </div>
                  )}
                </div>
                {artist.is_verified && (
                  <div className="absolute bottom-2 right-2 bg-primary rounded-full p-2 shadow-lg border-[3px] border-background">
                    <CheckCircle className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  {artist.is_verified && (
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Verified Artist
                    </span>
                  )}
                </div>
                <h1 className="font-heading text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground mt-1 leading-tight">
                  {artist.name}
                </h1>
                <div className="flex items-center gap-4 mt-3 justify-center md:justify-start text-sm text-muted-foreground">
                  {artist.genre && <span>{artist.genre}</span>}
                  <span>{songs?.length || 0} songs</span>
                  <span>{followerCount.toLocaleString()} followers</span>
                  <span>{totalPlays.toLocaleString()} plays</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === CONTROLS === */}
        <div className="px-4 lg:px-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 py-5">
            <button
              onClick={handlePlayAll}
              className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 hover:bg-primary/90 transition-all flex-shrink-0"
              disabled={queue.length === 0}
            >
              <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
            </button>
            <Button
              onClick={handleShuffle}
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground rounded-full"
              disabled={queue.length === 0}
            >
              <Shuffle className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => toggleFollow()}
              variant={isFollowing ? "outline" : "default"}
              className={`rounded-full gap-2 text-sm ${isFollowing ? "border-primary/30 text-primary" : "bg-primary text-primary-foreground"}`}
            >
              {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Button
              onClick={handleShare}
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground rounded-full"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Bio */}
          {artist.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-2xl">{artist.bio}</p>
          )}

          {/* === POPULAR TRACKS === */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold text-foreground">Popular</h2>
              <div className="flex items-center gap-1.5">
                {(["popular", "newest", "title"] as SortMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSortMode(mode)}
                    className={`text-[11px] px-2.5 py-1 rounded-full transition-colors font-medium capitalize ${
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all cursor-pointer group ${
                      isCurrentSong ? "bg-primary/10" : "hover:bg-card"
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
                    <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0 bg-muted">
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
                        <p className={`text-sm font-medium truncate hover:underline ${isCurrentSong ? "text-primary" : "text-foreground"}`}>
                          {song.title}
                        </p>
                      </Link>
                    </div>

                    {/* Play count */}
                    <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
                      {(song.play_count || 0).toLocaleString()}
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
                        fetch(song.file_url)
                          .then(r => r.blob())
                          .then(blob => {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${song.title} - ${artistName}.mp3`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            toast.success("Download started!");
                          })
                          .catch(() => toast.error("Download failed."));
                      }}
                      className="p-1.5 rounded-full text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
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
                className="mt-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
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
          </div>

          {/* === DISCOGRAPHY GRID === */}
          {songs && songs.length > 0 && (
            <div className="mb-8">
              <h2 className="font-heading text-lg font-bold text-foreground mb-4">Discography</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {songs.slice(0, 8).map((song) => {
                  const isCurrentSong = currentTrack?.id === song.id;
                  return (
                    <div
                      key={song.id}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/song/${song.id}`)}
                    >
                      <div className="relative aspect-square rounded-md overflow-hidden mb-2 bg-muted">
                        {song.cover_url ? (
                          <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center text-2xl font-heading font-bold text-primary-foreground">
                            {song.title[0]}
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-xl">
                            {isCurrentSong && isPlaying ? (
                              <Pause className="h-4 w-4 text-primary-foreground" />
                            ) : (
                              <Play className="h-4 w-4 text-primary-foreground fill-primary-foreground ml-0.5" />
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(song.play_count || 0).toLocaleString()} plays
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === YOUTUBE SECTION === */}
          {artist.youtube_channel_url && (
            <YouTubeEmbed channelUrl={artist.youtube_channel_url} artistName={artist.name} />
          )}

          {/* === STATS SECTION === */}
          <div className="rounded-xl bg-card/50 border border-border p-5">
            <h2 className="font-heading text-sm font-bold text-foreground mb-4 uppercase tracking-wider">About</h2>
            {artist.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{artist.bio}</p>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="font-heading text-2xl font-bold text-foreground">{songs?.length || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Songs</p>
              </div>
              <div className="text-center">
                <p className="font-heading text-2xl font-bold text-foreground">{totalPlays.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Plays</p>
              </div>
              <div className="text-center">
                <p className="font-heading text-2xl font-bold text-foreground">{totalDownloads.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Downloads</p>
              </div>
            </div>
            {artist.is_verified && (
              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border">
                <CheckCircle className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Verified by Sudagospel</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <MiniPlayer />
    </Layout>
  );
};

export default ArtistDetailPage;
