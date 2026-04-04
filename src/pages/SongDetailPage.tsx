import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSongComments } from "@/hooks/use-music-data";
import { useLikeSong, usePostComment, useDeleteComment } from "@/hooks/use-engagement";
import { usePlayer } from "@/hooks/use-player";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play, Pause, Heart, Download, Share2, ArrowLeft,
  MessageCircle, Send, Trash2, Clock, Music, FileText,
  SkipBack, SkipForward, User
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const SongDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { play, currentTrack, isPlaying, togglePlay, currentTime, duration, seek, next, prev } = usePlayer();
  const [commentText, setCommentText] = useState("");

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

  // Related songs: same artist or same genre
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
        .limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!song,
  });

  const { data: comments } = useSongComments(id!);
  const { isLiked, likeCount, toggleLike } = useLikeSong(id!);
  const postComment = usePostComment(id!);
  const deleteComment = useDeleteComment();

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!song) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Song not found</p>
        </div>
      </Layout>
    );
  }

  const artist = song.artists as any;
  const artistName = artist?.name || "Unknown Artist";
  const isCurrentTrack = currentTrack?.id === song.id;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      play({
        id: song.id,
        title: song.title,
        artist: artistName,
        fileUrl: song.file_url,
        coverUrl: song.cover_url || undefined,
      });
    }
  };

  const handleDownload = async () => {
    toast.info("Preparing download...");
    try {
      const response = await fetch(song.file_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${song.title} - ${artistName}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (user) {
        supabase.from("song_downloads").insert({ song_id: song.id, user_id: user.id }).then(() => {});
      }
      toast.success("Download started!");
    } catch {
      toast.error("Download failed. Please try again.");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: song.title, text: `Listen to ${song.title} by ${artistName}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    postComment.mutate(commentText.trim(), {
      onSuccess: () => setCommentText(""),
    });
  };

  const playRelated = (s: any) => {
    const rArtist = (s.artists as any)?.name || "Unknown";
    play({
      id: s.id,
      title: s.title,
      artist: rArtist,
      fileUrl: s.file_url,
      coverUrl: s.cover_url || undefined,
    });
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-4 pb-32">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Hero section with blurred background */}
        <div className="relative rounded-2xl overflow-hidden mb-6">
          {/* Blurred background */}
          <div className="absolute inset-0">
            {song.cover_url ? (
              <img src={song.cover_url} alt="" className="h-full w-full object-cover blur-2xl scale-110 opacity-40" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/30 to-secondary/30" />
            )}
            <div className="absolute inset-0 bg-background/60 dark:bg-background/70" />
          </div>

          <div className="relative flex flex-col items-center py-8 px-4">
            {/* Cover art */}
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-xl overflow-hidden shadow-2xl border-2 border-background/50 mb-5">
              {song.cover_url ? (
                <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Music className="h-16 w-16 text-primary-foreground/80" />
                </div>
              )}
            </div>

            {/* Song info */}
            <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground text-center leading-tight">
              {song.title}
            </h1>
            <Link
              to={`/artist/${artist?.id}`}
              className="mt-1 text-sm text-primary hover:underline font-medium flex items-center gap-1"
            >
              <User className="h-3 w-3" />
              {artistName}
            </Link>
            {song.genre && (
              <span className="mt-2 inline-block rounded-full bg-secondary/15 px-3 py-0.5 text-xs font-semibold text-secondary">
                {song.genre}
              </span>
            )}
          </div>
        </div>

        {/* Player controls */}
        <div className="mb-5">
          {/* Progress bar */}
          <div className="mb-3">
            <div
              className="h-1.5 rounded-full bg-muted cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                if (isCurrentTrack) seek(pct * duration);
                else handlePlay();
              }}
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-150 relative"
                style={{ width: isCurrentTrack ? `${progress}%` : "0%" }}
              >
                {isCurrentTrack && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-md border-2 border-background" />
                )}
              </div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">
                {isCurrentTrack ? formatTime(currentTime) : "0:00"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isCurrentTrack ? formatTime(duration) : song.duration_seconds ? formatTime(song.duration_seconds) : "--:--"}
              </span>
            </div>
          </div>

          {/* Transport controls */}
          <div className="flex items-center justify-center gap-6">
            <button onClick={prev} className="text-muted-foreground hover:text-foreground transition-colors">
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={handlePlay}
              className="rounded-full bg-primary p-4 text-primary-foreground shadow-lg hover:scale-105 transition-transform"
            >
              {isCurrentTrack && isPlaying ? (
                <Pause className="h-7 w-7" />
              ) : (
                <Play className="h-7 w-7" fill="currentColor" />
              )}
            </button>
            <button onClick={next} className="text-muted-foreground hover:text-foreground transition-colors">
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleLike()}
            className={`gap-1.5 rounded-full ${isLiked ? "text-primary border-primary" : "text-muted-foreground"}`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-primary" : ""}`} />
            {likeCount}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 rounded-full text-muted-foreground hover:text-secondary">
            <Download className="h-4 w-4" /> Download
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5 rounded-full text-muted-foreground">
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex gap-6 justify-center mb-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Play className="h-3 w-3" /> {song.play_count || 0} plays</span>
          <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {song.download_count || 0} downloads</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(song.created_at), { addSuffix: true })}</span>
        </div>

        {/* Tabbed content */}
        <Tabs defaultValue="details" className="mb-8">
          <TabsList className="w-full grid grid-cols-3 bg-muted/50">
            <TabsTrigger value="details" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Music className="h-3.5 w-3.5" /> Details
            </TabsTrigger>
            <TabsTrigger value="lyrics" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-3.5 w-3.5" /> Lyrics
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageCircle className="h-3.5 w-3.5" /> Comments ({comments?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Details tab */}
          <TabsContent value="details" className="mt-4 space-y-4">
            {song.description && (
              <div className="rounded-xl bg-card border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">About this song</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{song.description}</p>
              </div>
            )}

            {/* Artist card */}
            <Link
              to={`/artist/${artist?.id}`}
              className="flex items-center gap-3 rounded-xl bg-card border border-border p-4 hover:border-primary/30 transition-colors"
            >
              <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {artist?.avatar_url ? (
                  <img src={artist.avatar_url} alt={artistName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold">
                    {artistName[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{artistName}</p>
                <p className="text-xs text-muted-foreground">{artist?.genre || "Gospel"}</p>
              </div>
              <span className="text-xs text-primary font-medium">View Profile →</span>
            </Link>

            {/* Song metadata */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-card border border-border p-3 text-center">
                <p className="text-lg font-bold text-foreground">{song.play_count?.toLocaleString() || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Plays</p>
              </div>
              <div className="rounded-xl bg-card border border-border p-3 text-center">
                <p className="text-lg font-bold text-foreground">{song.download_count?.toLocaleString() || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Downloads</p>
              </div>
              <div className="rounded-xl bg-card border border-border p-3 text-center">
                <p className="text-lg font-bold text-foreground">{likeCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Likes</p>
              </div>
              <div className="rounded-xl bg-card border border-border p-3 text-center">
                <p className="text-lg font-bold text-foreground">{comments?.length || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Comments</p>
              </div>
            </div>
          </TabsContent>

          {/* Lyrics tab */}
          <TabsContent value="lyrics" className="mt-4">
            <div className="rounded-xl bg-card border border-border p-5">
              {(song as any).lyrics ? (
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Lyrics
                  </h3>
                  <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line font-body">
                    {(song as any).lyrics}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Lyrics not available yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Lyrics for this song haven't been added.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Comments tab */}
          <TabsContent value="comments" className="mt-4 space-y-4">
            {/* Comment input */}
            {user ? (
              <div className="flex gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  className="flex-1 resize-none rounded-xl"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || postComment.isPending}
                  size="icon"
                  className="self-end bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-10 w-10"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="w-full rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Sign in to leave a comment
              </button>
            )}

            {/* Comments list */}
            <div className="space-y-3">
              {comments?.map((comment) => (
                <div key={comment.id} className="rounded-xl bg-card border border-border p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                        {(comment.profiles as any)?.display_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {(comment.profiles as any)?.display_name || "Anonymous"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                      {user?.id === comment.user_id && (
                        <button
                          onClick={() => deleteComment.mutate({ commentId: comment.id, songId: song.id })}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-foreground/90 pl-9">{comment.content}</p>
                </div>
              ))}
              {(!comments || comments.length === 0) && (
                <div className="text-center py-8">
                  <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Related Songs */}
        {relatedSongs && relatedSongs.length > 0 && (
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" /> Related Songs
            </h2>
            <div className="space-y-2">
              {relatedSongs.map((rs) => {
                const rArtist = (rs.artists as any)?.name || "Unknown";
                const isRPlaying = currentTrack?.id === rs.id && isPlaying;
                return (
                  <div
                    key={rs.id}
                    className="flex items-center gap-3 rounded-xl bg-card border border-border p-3 hover:border-primary/30 transition-colors group"
                  >
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
                      {rs.cover_url ? (
                        <img src={rs.cover_url} alt={rs.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/60 to-secondary/60 flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {rs.title[0]}
                        </div>
                      )}
                      <button
                        onClick={() => playRelated(rs)}
                        className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {isRPlaying ? <Pause className="h-5 w-5 text-foreground" /> : <Play className="h-5 w-5 text-foreground" fill="currentColor" />}
                      </button>
                    </div>
                    <Link to={`/song/${rs.id}`} className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{rs.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{rArtist}</p>
                    </Link>
                    <span className="text-[10px] text-muted-foreground">{rs.play_count?.toLocaleString() || 0} plays</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <MiniPlayer />
    </Layout>
  );
};

export default SongDetailPage;
