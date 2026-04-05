import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { usePlayer, Track } from "@/hooks/use-player";
import { artistPath } from "@/lib/artist-slug";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Headphones, Play, Pause, Download, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

const MostListenedPage = () => {
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();

  useDocumentMeta({
    title: "Most Listened",
    description: "The most played gospel songs on Sudagospel — discover South Sudan's top gospel hits.",
    keywords: "most played gospel songs, South Sudan gospel, top songs, Sudagospel charts",
  });

  const { data: songs, isLoading } = useQuery({
    queryKey: ["most-listened"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(name, avatar_url)")
        .eq("is_approved", true)
        .order("play_count", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const queue: Track[] = useMemo(
    () =>
      (songs || []).map((s) => ({
        id: s.id,
        title: s.title,
        artist: (s.artists as any)?.name || "Unknown",
        fileUrl: s.file_url,
        coverUrl: s.cover_url || undefined,
      })),
    [songs]
  );

  const formatTime = (s: number | null) => {
    if (!s) return "--:--";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <Layout>
      <div className="container py-6 pb-28">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <Headphones className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground">
              Most Listened
            </h1>
            <p className="text-sm text-muted-foreground">
              Top {songs?.length || 0} most played songs
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-0.5 max-w-3xl">
            {songs?.map((song, index) => {
              const artistName = (song.artists as any)?.name || "Unknown";
              const isCurrentSong = currentTrack?.id === song.id;
              const isTop3 = index < 3;

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
                  {/* Rank */}
                  <div className="w-8 flex-shrink-0 text-center">
                    {isCurrentSong && isPlaying ? (
                      <div className="flex items-center justify-center gap-[2px]">
                        <span className="inline-block w-[3px] h-3 bg-primary rounded-full animate-pulse" />
                        <span className="inline-block w-[3px] h-4 bg-primary rounded-full animate-pulse [animation-delay:150ms]" />
                        <span className="inline-block w-[3px] h-2 bg-primary rounded-full animate-pulse [animation-delay:300ms]" />
                      </div>
                    ) : (
                      <>
                        <span className={`text-sm font-heading font-bold tabular-nums group-hover:hidden ${
                          isTop3 ? "text-primary" : "text-muted-foreground"
                        }`}>
                          {index + 1}
                        </span>
                        <Play className="h-4 w-4 text-foreground hidden group-hover:block mx-auto" fill="currentColor" />
                      </>
                    )}
                  </div>

                  {/* Cover */}
                  <div className="h-11 w-11 rounded overflow-hidden flex-shrink-0 bg-muted">
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
                    <Link
                      to={artistPath(artistName)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors truncate block"
                    >
                      {artistName}
                    </Link>
                  </div>

                  {/* Play count with chart icon */}
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span className="tabular-nums">{(song.play_count || 0).toLocaleString()}</span>
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
                      fetch(song.file_url)
                        .then((r) => r.blob())
                        .then((blob) => {
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
        )}
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default MostListenedPage;
