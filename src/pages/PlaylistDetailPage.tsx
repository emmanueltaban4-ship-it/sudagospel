import { useMemo } from "react";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { useParams, useNavigate } from "react-router-dom";
import { usePlaylistSongs, useRemoveFromPlaylist } from "@/hooks/use-playlists";
import { usePlayer, Track } from "@/hooks/use-player";
import { Play, Pause, Music, Trash2, ArrowLeft, ListMusic, Shuffle, MoreHorizontal, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const PlaylistDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();
  const removeFromPlaylist = useRemoveFromPlaylist();

  const { data: playlist } = useQuery({
    queryKey: ["playlist", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: playlistSongs, isLoading } = usePlaylistSongs(id!);

  const songs = useMemo(() => {
    if (!playlistSongs) return [];
    return playlistSongs.map((ps: any) => ({
      id: ps.songs.id,
      title: ps.songs.title,
      artist: ps.songs.artists?.name || "Unknown",
      fileUrl: ps.songs.file_url,
      coverUrl: ps.songs.cover_url || "",
      genre: ps.songs.genre || "",
      duration: ps.songs.duration_seconds || null,
    }));
  }, [playlistSongs]);

  const queue: Track[] = useMemo(
    () => songs.map((s) => ({ id: s.id, title: s.title, artist: s.artist, fileUrl: s.fileUrl, coverUrl: s.coverUrl })),
    [songs]
  );

  const handlePlay = (song: (typeof songs)[0]) => {
    if (currentTrack?.id === song.id) togglePlay();
    else play({ id: song.id, title: song.title, artist: song.artist, fileUrl: song.fileUrl, coverUrl: song.coverUrl }, queue);
  };

  const handlePlayAll = () => {
    if (songs.length > 0) play({ id: songs[0].id, title: songs[0].title, artist: songs[0].artist, fileUrl: songs[0].fileUrl, coverUrl: songs[0].coverUrl }, queue);
  };

  const handleShuffle = () => {
    if (songs.length === 0) return;
    const shuffled = [...queue].sort(() => Math.random() - 0.5);
    play(shuffled[0], shuffled);
    toast.success("Shuffling playlist");
  };

  const formatTime = (s: number | null) => {
    if (!s) return "--:--";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const totalDuration = songs.reduce((sum, s) => sum + (s.duration || 0), 0);

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-28">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0">
            {playlist?.cover_url ? (
              <img src={playlist.cover_url} alt="" className="w-full h-full object-cover blur-[80px] opacity-40 scale-110"  loading="lazy" decoding="async" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 via-secondary/20 to-background" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 to-background" />
          </div>

          <div className="relative px-4 lg:px-8 py-6 md:py-10 max-w-4xl mx-auto">
            <button
              onClick={() => navigate("/playlists")}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
              {/* Playlist cover */}
              <div className="h-40 w-40 md:h-52 md:w-52 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/60 to-primary/20 flex items-center justify-center shadow-2xl flex-shrink-0">
                {playlist?.cover_url ? (
                  <img src={playlist.cover_url} alt={playlist.name} className="h-full w-full object-cover"  loading="lazy" decoding="async" />
                ) : (
                  <ListMusic className="h-16 w-16 md:h-20 md:w-20 text-primary-foreground/50" />
                )}
              </div>

              <div className="text-center sm:text-left pb-1">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Playlist</p>
                <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-foreground leading-tight">
                  {playlist?.name || "..."}
                </h1>
                {playlist?.description && (
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">{playlist.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start text-sm text-muted-foreground">
                  <span>{songs.length} songs</span>
                  {totalDuration > 0 && (
                    <>
                      <span className="text-foreground/20">•</span>
                      <span>{Math.floor(totalDuration / 60)} min</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {songs.length > 0 && (
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handlePlayAll}
                  className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg glow-gold hover:scale-110 active:scale-95 transition-all"
                >
                  <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                </button>
                <Button onClick={handleShuffle} variant="outline" size="sm" className="rounded-full gap-1.5 border-border/50">
                  <Shuffle className="h-4 w-4" /> Shuffle
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Song list */}
        <div className="px-4 lg:px-8 max-w-4xl mx-auto py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-12 w-12 rounded-lg bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 w-1/2 bg-muted rounded mb-1" />
                    <div className="h-3 w-1/3 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : songs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Music className="h-16 w-16 text-muted-foreground/20 mb-4" />
              <h3 className="font-heading text-lg font-bold mb-1">No songs yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Add songs from the Music page</p>
              <Button variant="outline" onClick={() => navigate("/music")}>Browse Music</Button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {/* Column header */}
              <div className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b border-border/30 mb-1">
                <span className="w-6 text-center">#</span>
                <span className="w-11" />
                <span className="flex-1">Title</span>
                <span className="hidden sm:block w-12 text-right"><Clock className="h-3 w-3 inline" /></span>
                <span className="w-10" />
              </div>

              {songs.map((song, index) => {
                const isCurrent = currentTrack?.id === song.id;
                return (
                  <div
                    key={song.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${
                      isCurrent ? "bg-primary/10 border border-primary/20" : "hover:bg-card/80"
                    }`}
                    onClick={() => handlePlay(song)}
                  >
                    <div className="w-6 flex-shrink-0 text-center">
                      {isCurrent && isPlaying ? (
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

                    <div className="relative h-11 w-11 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                      {song.coverUrl ? (
                        <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/40 to-secondary/20 flex items-center justify-center">
                          <Music className="h-5 w-5 text-primary-foreground/60" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className={`font-heading font-semibold text-sm truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>
                        {song.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                    </div>

                    <span className="text-xs text-muted-foreground tabular-nums hidden sm:block w-12 text-right">
                      {formatTime(song.duration)}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (id) removeFromPlaylist.mutate({ playlistId: id, songId: song.id });
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default PlaylistDetailPage;
