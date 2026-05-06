import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { usePlayer, Track } from "@/hooks/use-player";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Link } from "react-router-dom";
import { artistPath } from "@/lib/artist-slug";
import { Play, Pause, Clock, Music, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const NewSongsPage = () => {
  useDocumentMeta({
    title: "New Songs",
    description:
      "Discover the latest gospel songs uploaded to Sudagospel. Fresh music from South Sudan's gospel artists.",
    keywords: "new gospel songs, latest South Sudan music, fresh gospel, Sudagospel",
  });

  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();

  const { data: songs, isLoading } = useQuery({
    queryKey: ["new-songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(id, name, avatar_url)")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const queue: Track[] =
    songs?.map((s) => ({
      id: s.id,
      title: s.title,
      artist: (s.artists as any)?.name || "Unknown",
      fileUrl: s.file_url,
      coverUrl: s.cover_url || undefined,
    })) || [];

  const handlePlay = (song: (typeof songs extends (infer T)[] | undefined ? T : never)) => {
    const track: Track = {
      id: song.id,
      title: song.title,
      artist: (song.artists as any)?.name || "Unknown",
      fileUrl: song.file_url,
      coverUrl: song.cover_url || undefined,
    };
    if (currentTrack?.id === song.id) {
      togglePlay();
    } else {
      play(track, queue);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 pb-28">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground">
                New Songs
              </h1>
              <p className="text-sm text-muted-foreground">
                Recently uploaded tracks
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : songs && songs.length > 0 ? (
          <div className="rounded-xl border border-border overflow-hidden">
            {songs.map((song, i) => {
              const artist = (song.artists as any);
              const isCurrentSong = currentTrack?.id === song.id;
              return (
                <div
                  key={song.id}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group ${
                    i < songs.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  {/* Play button */}
                  <button
                    onClick={() => handlePlay(song)}
                    className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative"
                  >
                    {song.cover_url ? (
                      <img src={song.cover_url} alt="" className="h-full w-full object-cover" / loading="lazy" decoding="async">
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Music className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isCurrentSong && isPlaying ? (
                        <Pause className="h-4 w-4 text-white" />
                      ) : (
                        <Play className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/song/${song.id}`}
                      className="text-sm font-medium text-foreground truncate block hover:underline"
                    >
                      {song.title}
                    </Link>
                    <Link
                      to={artistPath(artist?.name || "")}
                      className="text-xs text-muted-foreground hover:text-foreground truncate block"
                    >
                      {artist?.name || "Unknown Artist"}
                    </Link>
                  </div>

                  {/* Time ago */}
                  <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(song.created_at), { addSuffix: true })}
                  </div>

                  {/* Genre badge */}
                  {song.genre && (
                    <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {song.genre}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Sparkles className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">No Songs Yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Check back soon for new music uploads!
            </p>
          </div>
        )}
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default NewSongsPage;
