import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import CountdownTimer from "@/components/CountdownTimer";
import ShareKit from "@/components/ShareKit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Music, Bell, BellRing, Share2, Sparkles, Calendar, BadgeCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { artistPath } from "@/lib/artist-slug";

const PreSavePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: song, isLoading } = useQuery({
    queryKey: ["presave-song", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(id, name, avatar_url, is_verified, user_id)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: isFollowing } = useQuery({
    queryKey: ["presave-following", song?.artists?.id, user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("artist_follows")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", song!.artists!.id)
        .eq("user_id", user!.id);
      return (count ?? 0) > 0;
    },
    enabled: !!song?.artists?.id && !!user,
  });

  const preSave = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to pre-save");
      // Follow artist (acts as pre-save: notifies on release via existing publish flow)
      const { error } = await supabase.from("artist_follows").insert({
        artist_id: song!.artists!.id,
        user_id: user.id,
      });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presave-following"] });
      toast.success("You'll be notified the moment it drops 🎉");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // If song is already published, redirect to song page
  useEffect(() => {
    if (song && song.release_status === "published" && song.is_approved) {
      navigate(`/song/${song.id}`, { replace: true });
    }
  }, [song, navigate]);

  if (isLoading) {
    return <Layout><div className="h-[50vh] flex items-center justify-center"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div><MiniPlayer /></Layout>;
  }

  if (!song) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <h1 className="font-heading text-2xl font-extrabold mb-2">Release not found</h1>
          <Button onClick={() => navigate("/")} className="rounded-xl">Go home</Button>
        </div>
        <MiniPlayer />
      </Layout>
    );
  }

  const releaseDate = song.scheduled_release_at ? new Date(song.scheduled_release_at) : null;
  const artist = song.artists;

  return (
    <Layout>
      <div className="relative min-h-[80vh]">
        {/* Hero background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {song.cover_url && (
            <>
              <img src={song.cover_url} alt="" className="w-full h-full object-cover opacity-20 blur-3xl scale-125" / loading="lazy" decoding="async">
              <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
            </>
          )}
        </div>

        <div className="relative max-w-2xl mx-auto px-4 py-6 md:py-12">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />Back
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold tracking-[0.15em] uppercase mb-5">
              <Sparkles className="h-3 w-3" />Pre-save · Coming Soon
            </div>

            <div className="relative mb-6">
              <div className="h-56 w-56 md:h-64 md:w-64 rounded-3xl overflow-hidden bg-muted shadow-2xl shadow-primary/20 ring-1 ring-border/50">
                {song.cover_url ? (
                  <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover" / loading="lazy" decoding="async">
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                    <Music className="h-16 w-16 text-primary" />
                  </div>
                )}
              </div>
            </div>

            <h1 className="font-heading text-3xl md:text-4xl font-extrabold mb-2">{song.title}</h1>
            {artist && (
              <Link to={artistPath(artist.name)} className="text-base text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 mb-6">
                {artist.name}
                {artist.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
              </Link>
            )}

            {releaseDate && (
              <div className="mb-6 w-full max-w-md">
                <CountdownTimer targetDate={releaseDate.toISOString()} />
                <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Releases {format(releaseDate, "MMMM d, yyyy 'at' p")}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-sm">
              {!user ? (
                <Button onClick={() => navigate("/auth")} size="lg" className="flex-1 rounded-xl gap-2 bg-gradient-gold text-primary-foreground font-bold shadow-lg shadow-primary/20">
                  <Bell className="h-4 w-4" />Sign in to Pre-save
                </Button>
              ) : isFollowing ? (
                <Button disabled size="lg" variant="outline" className="flex-1 rounded-xl gap-2">
                  <BellRing className="h-4 w-4 text-primary" />Pre-saved · You'll be notified
                </Button>
              ) : (
                <Button onClick={() => preSave.mutate()} disabled={preSave.isPending} size="lg" className="flex-1 rounded-xl gap-2 bg-gradient-gold text-primary-foreground font-bold shadow-lg shadow-primary/20">
                  <Bell className="h-4 w-4" />Pre-save
                </Button>
              )}
              <ShareKit
                url={typeof window !== "undefined" ? window.location.href : ""}
                title={`Pre-save "${song.title}" by ${artist?.name || ""}`}
                description={song.description || `Out ${releaseDate ? format(releaseDate, "MMM d") : "soon"}`}
                trigger={
                  <Button size="lg" variant="outline" className="rounded-xl gap-2">
                    <Share2 className="h-4 w-4" />Share
                  </Button>
                }
              />
            </div>

            {song.description && (
              <p className="text-sm text-muted-foreground mt-8 max-w-md leading-relaxed">{song.description}</p>
            )}
          </div>
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default PreSavePage;
