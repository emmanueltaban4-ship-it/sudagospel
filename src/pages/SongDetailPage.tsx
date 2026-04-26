import { useParams, useNavigate, Link } from "react-router-dom";
import { artistPath } from "@/lib/artist-slug";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSongComments } from "@/hooks/use-music-data";
import { useLikeSong, usePostComment, useDeleteComment } from "@/hooks/use-engagement";
import { usePlayer } from "@/hooks/use-player";
import { useAuth } from "@/hooks/use-auth";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import AdBanner from "@/components/AdBanner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Play, Pause, Heart, Download, Share2, ArrowLeft,
  MessageCircle, Send, Trash2, Clock, Music, FileText,
  SkipBack, SkipForward, MoreHorizontal
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { downloadFile } from "@/lib/download";
import { formatDistanceToNow } from "date-fns";
import ShareDialog from "@/components/ShareDialog";
import CountdownTimer from "@/components/CountdownTimer";
import RepostButton from "@/components/RepostButton";
import ShareStoryCard from "@/components/ShareStoryCard";
import CommentThread from "@/components/CommentThread";
import { Sparkles } from "lucide-react";

const SongDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { play, currentTrack, isPlaying, togglePlay, currentTime, duration, seek, next, prev } = usePlayer();
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "lyrics" | "comments">("details");
  const [storyOpen, setStoryOpen] = useState(false);

  const { data: song, isLoading } = useQuery({
    queryKey: ["song", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(id, name, avatar_url, genre)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: relatedSongs } = useQuery({
    queryKey: ["related-songs", id, song?.artist_id, song?.genre],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(name, avatar_url)")
        .eq("is_approved", true)
        .neq("id", id!)
        .or(`artist_id.eq.${song!.artist_id}${song!.genre ? `,genre.eq.${song!.genre}` : ""}`)
        .order("play_count", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
    enabled: !!song,
  });

  const { data: comments } = useSongComments(id!);
  const { isLiked, likeCount, toggleLike } = useLikeSong(id!);
  const postComment = usePostComment(id!);
  const deleteComment = useDeleteComment();

  const artist = (song as any)?.artists;
  const artistName = artist?.name || "Unknown Artist";

  const songSeoDescription = song?.description
    ? `${song.description.slice(0, 140)}${song.description.length > 140 ? "…" : ""}`
    : song
      ? `Listen to ${song.title} by ${artistName}. Stream and download free South Sudanese gospel music on Sudagospel.`
      : undefined;
  const songCanonicalUrl = song ? `https://sudagospel.com/song/${song.id}` : undefined;

  useDocumentMeta({
    title: song ? `${song.title} by ${artistName}` : undefined,
    description: songSeoDescription,
    ogTitle: song ? `${song.title} by ${artistName}` : undefined,
    ogDescription: songSeoDescription,
    ogImage: song?.cover_url || undefined,
    ogType: "music.song",
    canonicalUrl: songCanonicalUrl,
    keywords: song ? `${song.title}, ${artistName}, South Sudan gospel, ${song.genre || "gospel"}, Sudagospel, download` : undefined,
    jsonLd: song ? {
      "@context": "https://schema.org",
      "@type": "MusicRecording",
      name: song.title,
      url: songCanonicalUrl,
      genre: song.genre || "Gospel",
      image: song.cover_url || undefined,
      description: songSeoDescription,
      byArtist: { "@type": "MusicGroup", name: artistName },
      duration: song.duration_seconds ? `PT${Math.floor(song.duration_seconds / 60)}M${song.duration_seconds % 60}S` : undefined,
    } : undefined,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!song) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <Music className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Song not found</p>
        </div>
      </Layout>
    );
  }

  const isCurrentTrack = currentTrack?.id === song.id;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const ogShareUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-share?type=song&id=${song.id}`;

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handlePlay = () => {
    if (isCurrentTrack) togglePlay();
    else play({ id: song.id, title: song.title, artist: artistName, fileUrl: song.file_url, coverUrl: song.cover_url || undefined });
  };

  const handleDownload = async () => {
    if (user) {
      supabase.from("song_downloads").insert({ song_id: song.id, user_id: user.id }).then(() => {});
    }
    supabase.rpc('increment_download_count', { song_uuid: song.id }).then(() => {});
    await downloadFile(song.file_url, `${song.title} - ${artistName}.mp3`);
  };


  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    postComment.mutate(commentText.trim(), { onSuccess: () => setCommentText("") });
  };

  const playRelated = (s: any) => {
    play({ id: s.id, title: s.title, artist: (s.artists as any)?.name || "Unknown", fileUrl: s.file_url, coverUrl: s.cover_url || undefined });
  };

  const tabs = [
    { key: "details" as const, label: "Details", icon: Music },
    { key: "lyrics" as const, label: "Lyrics", icon: FileText },
    { key: "comments" as const, label: `Comments (${comments?.length || 0})`, icon: MessageCircle },
  ];

  return (
    <Layout>
      <div className="pb-28">
        {/* === HERO === */}
        <div className="relative overflow-hidden">
          {/* Gradient background from cover */}
          <div className="absolute inset-0">
            {song.cover_url ? (
              <img src={song.cover_url} alt="" className="h-full w-full object-cover scale-125 blur-[60px] opacity-50" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/40 to-secondary/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
          </div>

          <div className="relative px-4 lg:px-8 pt-4 pb-8">
            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-foreground/70 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            {/* Horizontal layout on desktop */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 max-w-4xl mx-auto">
              {/* Cover art */}
              <div className="w-52 h-52 md:w-56 md:h-56 rounded-lg overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)] flex-shrink-0">
                {song.cover_url ? (
                  <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Music className="h-16 w-16 text-primary-foreground/80" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-center md:text-left">
                {(song as any).release_status === "scheduled" && (song as any).scheduled_release_at && (
                  <div className="mb-3 flex justify-center md:justify-start">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Coming Soon</span>
                    </div>
                  </div>
                )}
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Song</p>
                <h1 className="font-heading text-2xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
                  {song.title}
                </h1>
                <div className="flex items-center gap-2 mt-3 justify-center md:justify-start flex-wrap">
                  <Link
                    to={artistPath(artist?.name || '')}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <div className="h-6 w-6 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {artist?.avatar_url ? (
                        <img src={artist.avatar_url} alt={artistName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                          {artistName[0]}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{artistName}</span>
                  </Link>
                  {song.genre && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-sm text-muted-foreground">{song.genre}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{(song.play_count || 0).toLocaleString()} plays</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(song.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Countdown Timer for scheduled songs */}
        {(song as any).release_status === "scheduled" && (song as any).scheduled_release_at && (
          <div className="px-4 lg:px-8 max-w-4xl mx-auto py-6">
            <div className="rounded-xl bg-card border border-primary/20 p-6 text-center">
              <p className="text-sm font-bold text-foreground mb-4">Releasing in</p>
              <div className="flex justify-center">
                <CountdownTimer targetDate={(song as any).scheduled_release_at} />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                This song will be available on {new Date((song as any).scheduled_release_at).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        )}

        {/* === CONTROLS BAR === */}
        <div className="px-4 lg:px-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 py-5">
            {/* Big play button */}
            <button
              onClick={handlePlay}
              className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 hover:bg-primary/90 transition-all flex-shrink-0"
            >
              {isCurrentTrack && isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
              )}
            </button>

            {/* Skip */}
            <button onClick={prev} className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              <SkipBack className="h-5 w-5" />
            </button>
            <button onClick={next} className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              <SkipForward className="h-5 w-5" />
            </button>

            {/* Like */}
            <button
              onClick={() => toggleLike()}
              className={`transition-colors ${isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? "fill-primary" : ""}`} />
            </button>

            <span className="text-xs text-muted-foreground">{likeCount}</span>

            <div className="flex-1" />

            {/* Actions */}
            <RepostButton songId={song.id} />
            <Button variant="ghost" size="icon" onClick={handleDownload} className="text-muted-foreground hover:text-foreground rounded-full">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setStoryOpen(true)} className="text-muted-foreground hover:text-foreground rounded-full" aria-label="Share to story">
              <Sparkles className="h-5 w-5" />
            </Button>
            <ShareDialog
              title={song.title}
              artist={artistName}
              coverUrl={song.cover_url || undefined}
              shareUrl={ogShareUrl}
              type="song"
            />
            <TestLinkPreview type="song" id={song.id} />
            <ShareStoryCard
              open={storyOpen}
              onOpenChange={setStoryOpen}
              songTitle={song.title}
              artistName={artistName}
              coverUrl={song.cover_url || undefined}
            />
          </div>

          {/* Progress bar */}
          {isCurrentTrack && (
            <div className="mb-6">
              <div
                className="h-1 rounded-full bg-muted cursor-pointer group hover:h-1.5 transition-all"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  seek(((e.clientX - rect.left) / rect.width) * duration);
                }}
              >
                <div
                  className="h-full rounded-full bg-primary relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
                </div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground tabular-nums">{formatTime(currentTime)}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* === TABS === */}
          <div className="border-b border-border mb-6">
            <div className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
                    activeTab === tab.key
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {activeTab === "details" && (
            <div className="space-y-5">
              {song.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{song.description}</p>
              )}

              {/* Artist card */}
              <Link
                to={artistPath(artist?.name || '')}
                className="flex items-center gap-3 rounded-lg bg-card/60 p-4 hover:bg-card transition-colors group"
              >
                <div className="h-14 w-14 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {artist?.avatar_url ? (
                    <img src={artist.avatar_url} alt={artistName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground">
                      {artistName[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Artist</p>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{artistName}</p>
                </div>
              </Link>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Plays", value: song.play_count?.toLocaleString() || "0" },
                  { label: "Downloads", value: song.download_count?.toLocaleString() || "0" },
                  { label: "Likes", value: likeCount.toString() },
                  { label: "Comments", value: (comments?.length || 0).toString() },
                ].map((stat) => (
                  <div key={stat.label} className="text-center py-3 rounded-lg bg-card/40">
                    <p className="font-heading text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "lyrics" && (
            <div>
              {(song as any).lyrics ? (
                <div className="text-sm text-foreground/90 leading-[1.8] whitespace-pre-line font-body max-w-lg">
                  {(song as any).lyrics}
                </div>
              ) : (
                <div className="flex flex-col items-center py-16 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Lyrics not available</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Lyrics haven't been added for this song yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <CommentThread songId={song.id} />
          )}

          {/* Ad Space */}
          <div className="mt-8">
            <AdBanner position="song_detail" />
          </div>

          {/* === RELATED SONGS === */}
          {relatedSongs && relatedSongs.length > 0 && (
            <div className="mt-10">
              <h2 className="font-heading text-lg font-bold text-foreground mb-4">You might also like</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {relatedSongs.map((rs) => {
                  const rArtist = (rs.artists as any)?.name || "Unknown";
                  const isRPlaying = currentTrack?.id === rs.id && isPlaying;
                  return (
                    <div
                      key={rs.id}
                      className="group cursor-pointer"
                      onClick={() => playRelated(rs)}
                    >
                      <div className="relative aspect-square rounded-md overflow-hidden mb-2 bg-muted">
                        {rs.cover_url ? (
                          <img src={rs.cover_url} alt={rs.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center">
                            <Music className="h-8 w-8 text-primary-foreground/60" />
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-xl">
                            {isRPlaying ? <Pause className="h-4 w-4 text-primary-foreground" /> : <Play className="h-4 w-4 text-primary-foreground fill-primary-foreground ml-0.5" />}
                          </div>
                        </div>
                      </div>
                      <Link to={`/song/${rs.id}`} onClick={(e) => e.stopPropagation()}>
                        <p className="text-sm font-semibold text-foreground truncate hover:underline">{rs.title}</p>
                      </Link>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{rArtist}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <MiniPlayer />
    </Layout>
  );
};

export default SongDetailPage;
