import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer, Track } from "@/hooks/use-player";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { artistPath } from "@/lib/artist-slug";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadFile } from "@/lib/download";
import {
  ArrowLeft, Music, Play, Pause, Shuffle, Download, Share2, Disc3, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";

const AlbumDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();

  const { data: album, isLoading } = useQuery({
    queryKey: ["album", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("albums")
        .select("*, artists(id, name, avatar_url)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: songs } = useQuery({
    queryKey: ["album-songs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(name, avatar_url)")
        .eq("album_id", id!)
        .eq("is_approved", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const queue: Track[] = useMemo(() =>
    (songs || []).map((s) => ({
      id: s.id,
      title: s.title,
      artist: (s.artists as any)?.name || "Unknown",
      fileUrl: s.file_url,
      coverUrl: s.cover_url || album?.cover_url || undefined,
    })), [songs, album]);

  const totalPlays = songs?.reduce((sum, s) => sum + (s.play_count || 0), 0) || 0;
  const totalDuration = songs?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;
  const artist = album?.artists as any;
  const albumType = (album as any)?.album_type || "album";

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h} hr ${m} min`;
    return `${m} min ${s} sec`;
  };

  const handleDownloadAll = async () => {
    if (!songs || songs.length === 0) return;
    toast.info(`Downloading ${songs.length} tracks...`);
    for (const song of songs) {
      const songArtist = (song.artists as any)?.name || "Unknown";
      await downloadFile(song.file_url, `${song.title} - ${songArtist}.mp3`);
      await new Promise((r) => setTimeout(r, 500));
    }
  };

  useDocumentMeta({
    title: album ? `${album.title} - ${artist?.name || "Album"}` : "Album",
    description: album?.description || `Listen to ${album?.title || "this album"} on Sudagospel`,
  });

  const handlePlayAll = () => {
    if (queue.length === 0) return;
    play(queue[0], queue);
  };

  const handleShuffle = () => {
    if (queue.length === 0) return;
    const shuffled = [...queue].sort(() => Math.random() - 0.5);
    play(shuffled[0], shuffled);
    toast.success("Shuffling album");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: album?.title, text: `Check out ${album?.title} on Sudagospel`, url });
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

  if (!album) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <Disc3 className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Album not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pb-28">
        {/* Hero */}
        <div className="relative overflow-hidden min-h-[260px] md:min-h-[320px]">
          <div className="absolute inset-0">
            {album.cover_url ? (
              <img src={album.cover_url} alt="" className="h-full w-full object-cover scale-110 blur-[80px] opacity-60" / loading="lazy" decoding="async">
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

            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 max-w-4xl mx-auto">
              <div className="flex-shrink-0">
                <div className="h-48 w-48 md:h-56 md:w-56 rounded-xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
                  {album.cover_url ? (
                    <img src={album.cover_url} alt={album.title} className="h-full w-full object-cover" / loading="lazy" decoding="async">
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Disc3 className="h-20 w-20 text-primary-foreground/50" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{albumType}</span>
                  <Badge variant="outline" className="text-[9px] uppercase">{albumType}</Badge>
                </div>
                <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-foreground mt-1 leading-tight">
                  {album.title}
                </h1>
                <div className="flex items-center gap-3 mt-3 justify-center md:justify-start text-sm text-muted-foreground flex-wrap">
                  {artist && (
                    <Link to={artistPath(artist.name)} className="hover:text-primary transition-colors font-medium">
                      {artist.name}
                    </Link>
                  )}
                  <span>{songs?.length || 0} songs</span>
                  {totalDuration > 0 && <span>{formatDuration(totalDuration)}</span>}
                  <span>{totalPlays.toLocaleString()} plays</span>
                  {album.release_date && <span>{new Date(album.release_date).getFullYear()}</span>}
                </div>
                {album.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{album.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 lg:px-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 py-5">
            <button
              onClick={handlePlayAll}
              className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 hover:bg-primary/90 transition-all flex-shrink-0"
              disabled={queue.length === 0}
            >
              <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
            </button>
            <Button onClick={handleShuffle} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full" disabled={queue.length === 0}>
              <Shuffle className="h-5 w-5" />
            </Button>
            <Button onClick={handleDownloadAll} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full" disabled={!songs || songs.length === 0} title="Download all tracks">
              <Download className="h-5 w-5" />
            </Button>
            <Button onClick={handleShare} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Track list */}
          <div className="space-y-0.5">
            {(songs || []).map((song, index) => {
              const songArtist = (song.artists as any)?.name || "Unknown";
              const isCurrentSong = currentTrack?.id === song.id;

              return (
                <div
                  key={song.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all cursor-pointer group ${
                    isCurrentSong ? "bg-primary/10" : "hover:bg-card"
                  }`}
                  onClick={() => {
                    if (isCurrentSong) togglePlay();
                    else play({ id: song.id, title: song.title, artist: songArtist, fileUrl: song.file_url, coverUrl: song.cover_url || album.cover_url || undefined }, queue);
                  }}
                >
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

                  <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0 bg-muted">
                    {(song.cover_url || album.cover_url) ? (
                      <img src={song.cover_url || album.cover_url!} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                        {song.title[0]}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link to={`/song/${song.id}`} onClick={(e) => e.stopPropagation()}>
                      <p className={`text-sm font-medium truncate hover:underline ${isCurrentSong ? "text-primary" : "text-foreground"}`}>
                        {song.title}
                      </p>
                    </Link>
                  </div>

                  <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
                    {(song.play_count || 0).toLocaleString()}
                  </span>

                  <span className="text-xs text-muted-foreground tabular-nums hidden sm:block w-12 text-right">
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
                          a.download = `${song.title} - ${songArtist}.mp3`;
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

          {(!songs || songs.length === 0) && (
            <div className="flex flex-col items-center py-16 text-center">
              <Music className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No songs in this album yet</p>
            </div>
          )}
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default AlbumDetailPage;
