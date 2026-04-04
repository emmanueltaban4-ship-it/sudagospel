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
  const artist = (activeSong?.artists as any);

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

  return (
    <section className="relative overflow-hidden bg-gospel-dark">
      {/* Background image with parallax effect */}
      <div className="absolute inset-0 transition-all duration-1000 ease-in-out">
        {activeSong?.cover_url && (
          <img
            src={activeSong.cover_url}
            alt=""
            className="h-full w-full object-cover scale-110 blur-sm opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/60" />
      </div>

      <div className="container relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 py-10 md:py-16 min-h-[300px] md:min-h-[380px]">
        {/* Cover art */}
        {activeSong && (
          <button
            onClick={handlePlay}
            className="relative group flex-shrink-0 w-40 h-40 md:w-52 md:h-52 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 transition-transform hover:scale-[1.03]"
          >
            {activeSong.cover_url ? (
              <img src={activeSong.cover_url} alt={activeSong.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-heading font-bold text-primary-foreground">
                {activeSong.title[0]}
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isCurrent && isPlaying ? (
                <Pause className="h-12 w-12 text-white drop-shadow-lg" />
              ) : (
                <Play className="h-12 w-12 text-white drop-shadow-lg" fill="white" />
              )}
            </div>
            {isCurrent && (
              <div className="absolute bottom-2 left-2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground animate-pulse">
                {isPlaying ? "♫ NOW PLAYING" : "⏸ PAUSED"}
              </div>
            )}
          </button>
        )}

        {/* Song info */}
        <div className="flex-1 text-center md:text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
            ★ FEATURED TRACK
          </p>
          <h1 className="font-heading text-2xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-1 line-clamp-2">
            {activeSong?.title || "Sudagospel"}
          </h1>
          {artist && (
            <Link
              to={`/artist/${artist.id}`}
              className="inline-flex items-center gap-2 mt-1 mb-4 group"
            >
              {artist.avatar_url && (
                <img src={artist.avatar_url} alt={artist.name} className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20" />
              )}
              <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors font-medium">
                {artist.name}
              </span>
            </Link>
          )}
          <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto md:mx-0">
            {activeSong?.genre || "Gospel"} · {(activeSong?.play_count || 0).toLocaleString()} plays
          </p>

          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <button
              onClick={handlePlay}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-full px-7 py-2.5 transition-colors shadow-lg shadow-primary/25"
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
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
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
