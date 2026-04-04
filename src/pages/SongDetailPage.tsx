import { useParams, useNavigate } from "react-router-dom";
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
import {
  Play, Pause, Heart, Download, Share2, ArrowLeft,
  MessageCircle, Send, Trash2, Clock
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const SongDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { play, currentTrack, isPlaying, togglePlay, currentTime, duration, seek } = usePlayer();
  const [commentText, setCommentText] = useState("");

  const { data: song, isLoading } = useQuery({
    queryKey: ["song", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(name, avatar_url)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
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

  const artistName = (song.artists as any)?.name || "Unknown Artist";
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

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = song.file_url;
    a.download = `${song.title} - ${artistName}.mp3`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (user) {
      supabase.from("song_downloads").insert({
        song_id: song.id,
        user_id: user.id,
      }).then(() => {});
    }
    toast.success("Download started!");
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

  return (
    <Layout>
      <div className="container max-w-2xl py-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Hero / Cover */}
        <div className="relative rounded-2xl overflow-hidden aspect-square max-h-80 mx-auto mb-6">
          {song.cover_url ? (
            <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-brand flex items-center justify-center">
              <span className="text-8xl font-heading font-bold text-primary-foreground">
                {song.title[0]}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        {/* Song info */}
        <div className="text-center mb-6">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            {song.title}
          </h1>
          <p className="text-muted-foreground mt-1">{artistName}</p>
          {song.genre && (
            <span className="mt-2 inline-block rounded-full bg-secondary/10 px-3 py-0.5 text-xs font-semibold text-secondary">
              {song.genre}
            </span>
          )}
        </div>

        {/* Player controls */}
        <div className="mb-6">
          {/* Progress bar */}
          {isCurrentTrack && (
            <div className="mb-3">
              <div
                className="h-2 rounded-full bg-muted cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  seek(pct * duration);
                }}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
                <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePlay}
              className="rounded-full bg-primary p-4 text-primary-foreground shadow-lg hover:scale-105 transition-transform animate-pulse-glow"
            >
              {isCurrentTrack && isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8" fill="currentColor" />
              )}
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleLike()}
            className={`gap-1.5 rounded-full ${isLiked ? "text-primary border-primary" : "text-muted-foreground"}`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-primary" : ""}`} />
            {likeCount}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-1.5 rounded-full text-muted-foreground hover:text-secondary"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-1.5 rounded-full text-muted-foreground"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Description */}
        {song.description && (
          <div className="rounded-lg bg-card border border-border p-4 mb-8">
            <p className="text-sm text-foreground">{song.description}</p>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-6 justify-center mb-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Play className="h-3.5 w-3.5" /> {song.play_count || 0} plays
          </span>
          <span className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" /> {song.download_count || 0} downloads
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {formatDistanceToNow(new Date(song.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Comments section */}
        <div className="border-t border-border pt-6">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Comments ({comments?.length || 0})
          </h2>

          {/* Comment input */}
          {user ? (
            <div className="flex gap-2 mb-6">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={2}
                className="flex-1 resize-none"
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
              className="w-full mb-6 rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              Sign in to leave a comment
            </button>
          )}

          {/* Comments list */}
          <div className="space-y-4">
            {comments?.map((comment) => (
              <div key={comment.id} className="rounded-lg bg-card border border-border p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-bold text-primary-foreground">
                      {(comment.profiles as any)?.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {(comment.profiles as any)?.display_name || "Anonymous"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
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
                <p className="text-sm text-foreground pl-9">{comment.content}</p>
              </div>
            ))}

            {(!comments || comments.length === 0) && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No comments yet. Be the first to share your thoughts!
              </p>
            )}
          </div>
        </div>
      </div>

      <MiniPlayer />
    </Layout>
  );
};

export default SongDetailPage;
