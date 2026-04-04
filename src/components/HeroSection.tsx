import { useState, useEffect } from "react";
import { Play, Pause, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
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
    if (currentTrack?.id === activeSong.id) {
      togglePlay();
    } else {
      play(track);
    }
  };

  const isCurrent = currentTrack?.id === activeSong?.id;

  if (!activeSong) {
    return (
      <section className="relative bg-background py-12 md:py-20">
        <div className="container text-center">
          <h1 className="font-heading text-3xl md:text-5xl font-black text-foreground mb-3">
            The music platform <span className="text-primary">empowering artists.</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto mb-6">
            Sudagospel is an artist-first platform that helps musicians reach and engage fans across the world.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold text-sm rounded-full px-8 py-3 transition-all"
          >
            Upload your music for FREE
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Subtle background glow */}
      <div className="absolute inset-0">
        {activeSong.cover_url && (
          <img
            src={activeSong.cover_url}
            alt=""
            className="h-full w-full object-cover scale-125 blur-3xl opacity-15"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background" />
      </div>

      <div className="container relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 py-8 md:py-14">
        {/* Cover art */}
        <button
          onClick={handlePlay}
          className="relative group flex-shrink-0 w-40 h-40 md:w-56 md:h-56 rounded-lg overflow-hidden shadow-2xl transition-transform hover:scale-[1.02]"
        >
          {activeSong.cover_url ? (
            <img src={activeSong.cover_url} alt={activeSong.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-muted flex items-center justify-center text-5xl font-heading font-black text-muted-foreground">
              {activeSong.title[0]}
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isCurrent && isPlaying ? (
              <Pause className="h-14 w-14 text-white drop-shadow-lg" />
            ) : (
              <Play className="h-14 w-14 text-white drop-shadow-lg" fill="white" />
            )}
          </div>
          {isCurrent && (
            <div className="absolute bottom-2 left-2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground">
              {isPlaying ? "NOW PLAYING" : "PAUSED"}
            </div>
          )}
        </button>

        {/* Song info */}
        <div className="flex-1 text-center md:text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
            ★ FEATURED
          </p>
          <h1 className="font-heading text-2xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight mb-2 line-clamp-2">
            {activeSong.title}
          </h1>
          {artist && (
            <Link
              to={`/artist/${artist.id}`}
              className="inline-flex items-center gap-2 mt-1 mb-4 group"
            >
              {artist.avatar_url && (
                <img src={artist.avatar_url} alt={artist.name} className="w-6 h-6 rounded-full object-cover" />
              )}
              <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors font-medium">
                {artist.name}
              </span>
            </Link>
          )}
          <p className="text-muted-foreground text-sm mb-5">
            {activeSong.genre || "Gospel"} · {(activeSong.play_count || 0).toLocaleString()} plays
          </p>

          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <button
              onClick={handlePlay}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-full px-7 py-2.5 transition-colors"
            >
              {isCurrent && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" fill="currentColor" />}
              {isCurrent && isPlaying ? "Pause" : "Play Now"}
            </button>
            <Link
              to="/music"
              className="inline-flex items-center gap-1.5 border border-border text-foreground hover:bg-muted font-semibold text-sm rounded-full px-6 py-2.5 transition-colors"
            >
              Explore Music <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Carousel dots */}
      {featuredSongs && featuredSongs.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
          {featuredSongs.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroSection;
