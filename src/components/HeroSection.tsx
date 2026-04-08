import { useState, useEffect } from "react";
import { Play, Pause, ChevronRight, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { artistPath } from "@/lib/artist-slug";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer, Track } from "@/hooks/use-player";

const HeroSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();

  const { data: featuredSongs } = useQuery({
    queryKey: ["featured-hero-songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(id, name, avatar_url)")
        .eq("is_approved", true)
        .order("play_count", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!featuredSongs?.length) return;
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % featuredSongs.length);
        setIsTransitioning(false);
      }, 400);
    }, 7000);
    return () => clearInterval(timer);
  }, [featuredSongs]);

  const activeSong = featuredSongs?.[activeIndex];
  const artist = activeSong?.artists as any;

  const handlePlay = () => {
    if (!activeSong) return;
    const track: Track = {
      id: activeSong.id,
      title: activeSong.title,
      artist: artist?.name || "Unknown",
      fileUrl: activeSong.file_url,
      coverUrl: activeSong.cover_url || undefined,
    };
    if (currentTrack?.id === activeSong.id) togglePlay();
    else play(track);
  };

  const isCurrent = currentTrack?.id === activeSong?.id;

  if (!activeSong) {
    return (
      <section className="relative px-4 lg:px-6 pt-4 pb-3">
        <div className="relative rounded-3xl overflow-hidden min-h-[340px] md:min-h-[420px]">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-background to-primary/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/10 rounded-full blur-[80px] animate-pulse [animation-delay:1s]" />

          <div className="relative flex flex-col items-center justify-center h-full p-8 md:p-14 text-center min-h-[340px] md:min-h-[420px]">
            <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Flame className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                South Sudan's #1 Gospel Platform
              </span>
            </div>

            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-black text-foreground mb-5 tracking-tight leading-[1.05]">
              Feel the Spirit.
              <br />
              <span className="text-gradient-brand">Stream Gospel.</span>
            </h1>

            <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto mb-8 leading-relaxed">
              Discover worship, praise & gospel music from South Sudan's finest artists — all in one place.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/music"
                className="inline-flex items-center gap-2 bg-gradient-gold text-primary-foreground font-bold text-sm rounded-full px-8 py-3.5 transition-all active:scale-95 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02]"
              >
                <Play className="h-4 w-4" fill="currentColor" /> Start Listening
              </Link>
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 border border-border/60 bg-card/50 backdrop-blur-sm text-foreground hover:bg-muted/50 font-semibold text-sm rounded-full px-6 py-3.5 transition-all"
              >
                Upload Music <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative px-4 lg:px-6 pt-4 pb-2">
      <div className="relative rounded-3xl overflow-hidden min-h-[320px] md:min-h-[400px]">
        {/* Blurred cover background */}
        <div className="absolute inset-0">
          {activeSong.cover_url && (
            <img
              src={activeSong.cover_url}
              alt=""
              className={`h-full w-full object-cover scale-[2] blur-[80px] transition-opacity duration-700 ${isTransitioning ? "opacity-0" : "opacity-50"}`}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          {/* Glow orbs */}
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-secondary/15 rounded-full blur-[80px]" />
        </div>

        <div className={`relative flex flex-col md:flex-row items-center gap-6 md:gap-12 p-6 md:p-10 transition-all duration-500 ${isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
          {/* Cover art with glow */}
          <button
            onClick={handlePlay}
            className="relative group flex-shrink-0 w-48 h-48 md:w-60 md:h-60 rounded-2xl overflow-hidden shadow-2xl transition-all hover:scale-[1.03] active:scale-95"
            style={{ boxShadow: "0 25px 60px -12px hsl(var(--primary) / 0.2)" }}
          >
            {activeSong.cover_url ? (
              <img src={activeSong.cover_url} alt={activeSong.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/60 to-secondary/40 flex items-center justify-center text-5xl font-heading font-bold text-primary-foreground">
                {activeSong.title[0]}
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl backdrop-blur-sm scale-75 group-hover:scale-100 transition-transform duration-300">
                {isCurrent && isPlaying ? (
                  <Pause className="h-7 w-7 text-primary-foreground" />
                ) : (
                  <Play className="h-7 w-7 text-primary-foreground ml-1" fill="currentColor" />
                )}
              </div>
            </div>
            {/* Now playing badge */}
            {isCurrent && (
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-primary/90 backdrop-blur-sm px-3 py-1 text-[10px] font-bold text-primary-foreground shadow-lg">
                <span className="flex gap-[2px]">
                  <span className="w-[2px] h-2 bg-primary-foreground rounded-full animate-eq-bar" />
                  <span className="w-[2px] h-3 bg-primary-foreground rounded-full animate-eq-bar [animation-delay:150ms]" />
                  <span className="w-[2px] h-1.5 bg-primary-foreground rounded-full animate-eq-bar [animation-delay:300ms]" />
                </span>
                {isPlaying ? "NOW PLAYING" : "PAUSED"}
              </div>
            )}
          </button>

          {/* Song info */}
          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-3">
              <Flame className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
                Most Played
              </span>
            </div>

            <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl font-black text-foreground leading-[1.05] mb-3 line-clamp-2 tracking-tight">
              {activeSong.title}
            </h2>

            {artist && (
              <Link to={artistPath(artist.name)} className="inline-flex items-center gap-2.5 mb-5 group">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-muted ring-2 ring-primary/20 flex-shrink-0">
                  {artist.avatar_url ? (
                    <img src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center text-xs font-bold text-primary-foreground">
                      {artist.name[0]}
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors font-semibold">
                  {artist.name}
                </span>
              </Link>
            )}

            <div className="flex items-center gap-2.5 justify-center md:justify-start text-xs text-muted-foreground mb-7">
              <span className="bg-primary/8 border border-primary/15 px-3 py-1 rounded-full font-medium text-primary/80">
                {activeSong.genre || "Gospel"}
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span>{(activeSong.play_count || 0).toLocaleString()} streams</span>
            </div>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                onClick={handlePlay}
                className="inline-flex items-center gap-2 bg-gradient-gold text-primary-foreground font-bold text-sm rounded-full px-8 py-3.5 transition-all active:scale-95 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02]"
              >
                {isCurrent && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" fill="currentColor" />}
                {isCurrent && isPlaying ? "Pause" : "Play Now"}
              </button>
              <Link
                to={`/song/${activeSong.id}`}
                className="inline-flex items-center gap-1.5 border border-border/60 bg-card/50 backdrop-blur-sm text-foreground hover:bg-muted/50 font-semibold text-sm rounded-full px-6 py-3.5 transition-all"
              >
                View Song <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel dots */}
        {featuredSongs && featuredSongs.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {featuredSongs.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => { setActiveIndex(i); setIsTransitioning(false); }, 400);
                }}
                className={`rounded-full transition-all duration-500 ${
                  i === activeIndex
                    ? "w-8 h-2 bg-primary shadow-lg shadow-primary/40"
                    : "w-2 h-2 bg-foreground/15 hover:bg-foreground/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
