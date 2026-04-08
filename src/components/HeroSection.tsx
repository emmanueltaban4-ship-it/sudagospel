import { useState, useEffect } from "react";
import { Play, Pause, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { artistPath } from "@/lib/artist-slug";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer, Track } from "@/hooks/use-player";

const HeroSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
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
      setActiveIndex((prev) => (prev + 1) % featuredSongs.length);
    }, 6000);
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
      <section className="relative px-4 lg:px-6 pt-6 pb-4">
        <div className="relative rounded-3xl overflow-hidden bg-card border border-border/50">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-secondary/8" />
          <div className="relative p-8 md:p-14 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-4">
              South Sudan's #1 Gospel Platform
            </p>
            <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight leading-[1.1]">
              Stream & Share
              <br />
              <span className="text-gradient-brand">Gospel Music</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto mb-8">
              Discover worship, praise & gospel hits from South Sudan's finest artists.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/music"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-full px-7 py-3 transition-all active:scale-95 shadow-lg shadow-primary/25"
              >
                <Play className="h-4 w-4" fill="currentColor" /> Start Listening
              </Link>
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 border border-border text-foreground hover:bg-muted font-semibold text-sm rounded-full px-6 py-3 transition-all"
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
    <section className="relative px-4 lg:px-6 pt-6 pb-2">
      <div className="relative rounded-3xl overflow-hidden">
        {/* Background image with heavy blur */}
        <div className="absolute inset-0">
          {activeSong.cover_url && (
            <img src={activeSong.cover_url} alt="" className="h-full w-full object-cover scale-150 blur-[60px] opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>

        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10 p-6 md:p-10">
          {/* Cover art */}
          <button
            onClick={handlePlay}
            className="relative group flex-shrink-0 w-44 h-44 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 transition-all hover:scale-[1.02] active:scale-95"
          >
            {activeSong.cover_url ? (
              <img src={activeSong.cover_url} alt={activeSong.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/60 to-secondary/40 flex items-center justify-center text-5xl font-heading font-bold text-primary-foreground">
                {activeSong.title[0]}
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-xl backdrop-blur-sm">
                {isCurrent && isPlaying ? (
                  <Pause className="h-6 w-6 text-primary-foreground" />
                ) : (
                  <Play className="h-6 w-6 text-primary-foreground ml-0.5" fill="currentColor" />
                )}
              </div>
            </div>
            {isCurrent && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-primary/90 backdrop-blur-sm px-3 py-1 text-[10px] font-bold text-primary-foreground">
                <span className="flex gap-[2px]">
                  <span className="w-[2px] h-2 bg-primary-foreground rounded-full animate-pulse" />
                  <span className="w-[2px] h-3 bg-primary-foreground rounded-full animate-pulse [animation-delay:150ms]" />
                  <span className="w-[2px] h-1.5 bg-primary-foreground rounded-full animate-pulse [animation-delay:300ms]" />
                </span>
                {isPlaying ? "NOW PLAYING" : "PAUSED"}
              </div>
            )}
          </button>

          {/* Song info */}
          <div className="flex-1 text-center md:text-left min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/80 mb-2">
              Most Played
            </p>
            <h2 className="font-heading text-2xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-[1.1] mb-3 line-clamp-2 tracking-tight">
              {activeSong.title}
            </h2>
            {artist && (
              <Link to={artistPath(artist.name)} className="inline-flex items-center gap-2.5 mb-4 group">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted ring-2 ring-border flex-shrink-0">
                  {artist.avatar_url ? (
                    <img src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                      {artist.name[0]}
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors font-medium">
                  {artist.name}
                </span>
              </Link>
            )}
            <div className="flex items-center gap-3 justify-center md:justify-start text-xs text-muted-foreground mb-6">
              <span className="bg-muted/60 px-2.5 py-1 rounded-full">{activeSong.genre || "Gospel"}</span>
              <span>{(activeSong.play_count || 0).toLocaleString()} streams</span>
            </div>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                onClick={handlePlay}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-full px-7 py-3 transition-all active:scale-95 shadow-lg shadow-primary/25"
              >
                {isCurrent && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" fill="currentColor" />}
                {isCurrent && isPlaying ? "Pause" : "Play Now"}
              </button>
              <Link
                to={`/song/${activeSong.id}`}
                className="inline-flex items-center gap-1.5 border border-border/60 text-foreground hover:bg-muted/50 font-semibold text-sm rounded-full px-6 py-3 transition-all"
              >
                View Song <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel indicators */}
        {featuredSongs && featuredSongs.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {featuredSongs.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === activeIndex ? "w-7 bg-primary" : "w-1.5 bg-foreground/15 hover:bg-foreground/30"
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
