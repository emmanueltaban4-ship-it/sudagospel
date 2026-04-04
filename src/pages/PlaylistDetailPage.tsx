import { useMemo } from "react";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { useParams, useNavigate } from "react-router-dom";
import { usePlaylistSongs, useRemoveFromPlaylist } from "@/hooks/use-playlists";
import { usePlayer, Track } from "@/hooks/use-player";
import { Play, Pause, Music, Trash2, ArrowLeft, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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
    }));
  }, [playlistSongs]);

  const queue: Track[] = useMemo(
    () => songs.map((s) => ({ id: s.id, title: s.title, artist: s.artist, fileUrl: s.fileUrl, coverUrl: s.coverUrl })),
    [songs]
  );

  const handlePlay = (song: (typeof songs)[0]) => {
    if (currentTrack?.id === song.id) {
      togglePlay();
    } else {
      play({ id: song.id, title: song.title, artist: song.artist, fileUrl: song.fileUrl, coverUrl: song.coverUrl }, queue);
    }
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      play({ id: songs[0].id, title: songs[0].title, artist: songs[0].artist, fileUrl: songs[0].fileUrl, coverUrl: songs[0].coverUrl }, queue);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gospel-dark via-background to-gospel-dark">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-[120px]" />
          </div>
          <div className="relative container py-6 md:py-10">
            <button onClick={() => navigate("/playlists")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4 text-sm">
              <ArrowLeft className="h-4 w-4" /> Back to Playlists
            </button>
            <div className="flex items-end gap-4">
              <div className="h-28 w-28 md:h-40 md:w-40 rounded-xl bg-gradient-to-br from-primary/60 to-primary/20 flex items-center justify-center shadow-2xl flex-shrink-0">
                <ListMusic className="h-12 w-12 md:h-16 md:w-16 text-primary-foreground/70" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Playlist</p>
                <h1 className="font-heading text-2xl md:text-4xl font-extrabold text-foreground">{playlist?.name || "..."}</h1>
                <p className="text-muted-foreground text-sm mt-1">{songs.length} songs</p>
                {songs.length > 0 && (
                  <Button onClick={handlePlayAll} size="sm" className="mt-3">
                    <Play className="h-4 w-4 mr-1 fill-current" /> Play All
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Song list */}
        <div className="container py-6">
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
            <div className="space-y-1">
              {songs.map((song, index) => {
                const isCurrent = currentTrack?.id === song.id;
                return (
                  <div
                    key={song.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer group ${
                      isCurrent ? "bg-primary/10" : "hover:bg-card/80"
                    }`}
                    onClick={() => handlePlay(song)}
                  >
                    <span className="text-sm font-bold text-muted-foreground w-6 text-center tabular-nums">
                      {index + 1}
                    </span>
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                      {song.coverUrl ? (
                        <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center">
                          <Music className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {isCurrent && isPlaying ? (
                          <Pause className="h-4 w-4 text-white" />
                        ) : (
                          <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-heading font-semibold text-sm truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>
                        {song.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (id) removeFromPlaylist.mutate({ playlistId: id, songId: song.id });
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
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
