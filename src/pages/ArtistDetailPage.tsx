import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer, Track } from "@/hooks/use-player";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Music, CheckCircle, Play, Pause, Shuffle,
  Heart, Download, Share2, Clock, TrendingUp, Disc3, ListMusic
} from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";

type SortMode = "popular" | "newest" | "title";

const ArtistDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();
  const [sortMode, setSortMode] = useState<SortMode>("popular");

  const { data: artist, isLoading } = useQuery({
    queryKey: ["artist", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
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
      case "popular":
        return copy.sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
      case "newest":
        return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "title":
        return copy.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return copy;
    }
  }, [songs, sortMode]);

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
        <div className="container py-16 text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!artist) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Artist not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Banner */}
      <div className="relative overflow-hidden">
        {/* Background blur from avatar */}
        <div className="absolute inset-0">
          {artist.avatar_url ? (
            <img
              src={artist.avatar_url}
              alt=""
              className="h-full w-full object-cover scale-110 blur-3xl opacity-30"
            />
          ) : (
            <div className="h-full w-full bg-gradient-brand opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>

        <div className="relative container max-w-2xl pt-4 pb-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors bg-card/50 backdrop-blur-sm rounded-full px-3 py-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex flex-col items-center">
            {/* Avatar with ring animation */}
            <div className="relative mb-5">
              <div className="h-32 w-32 md:h-36 md:w-36 rounded-full overflow-hidden ring-[3px] ring-primary/30 ring-offset-4 ring-offset-background shadow-2xl">
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-brand flex items-center justify-center text-5xl font-heading font-bold text-primary-foreground">
                    {artist.name[0]}
                  </div>
                )}
              </div>
              {artist.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 shadow-lg border-2 border-background">
                  <CheckCircle className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Name & Genre */}
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground text-center">
              {artist.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {artist.genre && (
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
                  {artist.genre}
                </span>
              )}
              {artist.is_verified && (
                <span className="inline-block rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary border border-secondary/20">
                  Verified Artist
                </span>
              )}
            </div>

            {artist.bio && (
              <p className="mt-4 text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
                {artist.bio}
              </p>
            )}

            {/* Stats Bar */}
            <div className="flex items-center gap-6 mt-5 px-6 py-3 rounded-2xl bg-card/80 backdrop-blur-sm border border-border shadow-sm">
              <div className="flex flex-col items-center">
                <span className="font-heading text-lg font-bold text-foreground">{songs?.length || 0}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Songs</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center">
                <span className="font-heading text-lg font-bold text-foreground">{totalPlays.toLocaleString()}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Plays</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center">
                <span className="font-heading text-lg font-bold text-foreground">{totalDownloads.toLocaleString()}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Downloads</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-5">
              <Button
                onClick={handlePlayAll}
                className="gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg px-6"
                disabled={queue.length === 0}
              >
                <Play className="h-4 w-4" fill="currentColor" /> Play All
              </Button>
              <Button
                onClick={handleShuffle}
                variant="outline"
                className="gap-2 rounded-full border-primary/30 text-primary hover:bg-primary/10"
                disabled={queue.length === 0}
              >
                <Shuffle className="h-4 w-4" /> Shuffle
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                size="icon"
                className="rounded-full border-border text-muted-foreground hover:text-foreground"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-2xl pb-32">
        <Tabs defaultValue="tracks" className="mt-2">
          <TabsList className="w-full bg-card border border-border rounded-xl h-11 p-1">
            <TabsTrigger value="tracks" className="flex-1 gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-semibold">
              <ListMusic className="h-3.5 w-3.5" /> Tracks
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex-1 gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-semibold">
              <TrendingUp className="h-3.5 w-3.5" /> Popular
            </TabsTrigger>
            <TabsTrigger value="about" className="flex-1 gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-semibold">
              <Disc3 className="h-3.5 w-3.5" /> About
            </TabsTrigger>
          </TabsList>

          {/* All Tracks Tab */}
          <TabsContent value="tracks" className="mt-4">
            {/* Sort controls */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground">Sort by:</span>
              {(["popular", "newest", "title"] as SortMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors font-medium capitalize ${
                    sortMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Track list */}
            <div className="space-y-1">
              {sortedSongs.map((song, index) => {
                const artistName = (song.artists as any)?.name || "Unknown";
                const isCurrentSong = currentTrack?.id === song.id;

                return (
                  <div
                    key={song.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group ${
                      isCurrentSong
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-card border border-transparent hover:border-border"
                    }`}
                    onClick={() => {
                      if (isCurrentSong) {
                        togglePlay();
                      } else {
                        play(
                          { id: song.id, title: song.title, artist: artistName, fileUrl: song.file_url, coverUrl: song.cover_url || undefined },
                          queue
                        );
                      }
                    }}
                  >
                    {/* Track number / play indicator */}
                    <div className="w-7 flex-shrink-0 text-center">
                      {isCurrentSong && isPlaying ? (
                        <div className="flex items-center justify-center gap-[2px]">
                          <span className="inline-block w-[3px] h-3 bg-primary rounded-full animate-pulse" />
                          <span className="inline-block w-[3px] h-4 bg-primary rounded-full animate-pulse [animation-delay:150ms]" />
                          <span className="inline-block w-[3px] h-2 bg-primary rounded-full animate-pulse [animation-delay:300ms]" />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium group-hover:hidden">
                          {index + 1}
                        </span>
                      )}
                      {!(isCurrentSong && isPlaying) && (
                        <Play className="h-3.5 w-3.5 text-primary hidden group-hover:block mx-auto" fill="currentColor" />
                      )}
                    </div>

                    {/* Cover thumbnail */}
                    <div className="h-11 w-11 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {song.cover_url ? (
                        <img src={song.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-gradient-brand flex items-center justify-center text-xs font-bold text-primary-foreground">
                          {song.title[0]}
                        </div>
                      )}
                    </div>

                    {/* Song info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isCurrentSong ? "text-primary" : "text-foreground"}`}>
                        {song.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(song.play_count || 0).toLocaleString()} plays
                      </p>
                    </div>

                    {/* Duration & actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {formatTime(song.duration_seconds)}
                      </span>
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
                        className="p-1.5 rounded-full text-muted-foreground hover:text-secondary opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {sortedSongs.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-12">No songs uploaded yet</p>
            )}
          </TabsContent>

          {/* Popular Tab - Grid view */}
          <TabsContent value="popular" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {songs
                ?.sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
                .slice(0, 6)
                .map((song) => {
                  const artistName = (song.artists as any)?.name || "Unknown";
                  return (
                    <div
                      key={song.id}
                      onClick={() => navigate(`/song/${song.id}`)}
                      className="group rounded-xl overflow-hidden bg-card border border-border hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5"
                    >
                      <div className="relative aspect-square overflow-hidden">
                        {song.cover_url ? (
                          <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="h-full w-full bg-gradient-brand flex items-center justify-center text-3xl font-heading font-bold text-primary-foreground">
                            {song.title[0]}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <div className="flex items-center gap-1 text-white text-xs">
                            <Play className="h-3 w-3" fill="currentColor" />
                            {(song.play_count || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-heading font-semibold text-sm truncate text-card-foreground">{song.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{(song.play_count || 0).toLocaleString()} plays</p>
                      </div>
                    </div>
                  );
                })}
            </div>
            {(!songs || songs.length === 0) && (
              <p className="text-center text-sm text-muted-foreground py-12">No songs yet</p>
            )}
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-4 space-y-5">
            <div className="rounded-2xl bg-card border border-border p-5">
              <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
                <Disc3 className="h-4 w-4 text-primary" /> About {artist.name}
              </h3>
              {artist.bio ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{artist.bio}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No bio available yet. This artist hasn't added a description.
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-card border border-border p-5">
              <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-muted/50 p-4 text-center">
                  <Music className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="font-heading text-xl font-bold text-foreground">{songs?.length || 0}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Songs</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4 text-center">
                  <Play className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="font-heading text-xl font-bold text-foreground">{totalPlays.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Plays</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4 text-center">
                  <Download className="h-5 w-5 text-secondary mx-auto mb-1" />
                  <p className="font-heading text-xl font-bold text-foreground">{totalDownloads.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Downloads</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4 text-center">
                  <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                  <p className="font-heading text-xl font-bold text-foreground">
                    {artist.genre || "N/A"}
                  </p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Genre</p>
                </div>
              </div>
            </div>

            {artist.is_verified && (
              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Verified Artist</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This artist's identity has been verified by the Sudagospel team.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <MiniPlayer />
    </Layout>
  );
};

export default ArtistDetailPage;
