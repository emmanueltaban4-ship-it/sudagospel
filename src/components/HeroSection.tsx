import { useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";
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
        <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-border p-8 md:p-12 text-center">
          <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-foreground mb-3 tracking-tight">
            South Sudan's Gospel
            <span className="text-primary"> Music Platform</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto mb-6">
            Discover, stream, and share the best gospel music from South Sudan.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-full px-8 py-3 transition-all hover:scale-[1.02]"
          >
            Upload your music for FREE
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative px-4 lg:px-6 pt-6 pb-2">
      <div className="relative rounded-2xl overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          {activeSong.cover_url && (
            <img src={activeSong.cover_url} alt="" className="h-full w-full object-cover scale-125 blur-3xl opacity-20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/40" />
        </div>

        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8 p-6 md:p-10">
          {/* Cover art */}
          <button
            onClick={handlePlay}
            className="relative group flex-shrink-0 w-40 h-40 md:w-52 md:h-52 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 transition-transform hover:scale-[1.02]"
          >
            {activeSong.cover_url ? (
              <img src={activeSong.cover_url} alt={activeSong.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-muted flex items-center justify-center text-5xl font-heading font-bold text-muted-foreground">
                {activeSong.title[0]}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-xl">
                {isCurrent && isPlaying ? (
                  <Pause className="h-6 w-6 text-primary-foreground" />
                ) : (
                  <Play className="h-6 w-6 text-primary-foreground ml-0.5" fill="currentColor" />
                )}
              </div>
            </div>
            {isCurrent && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1 text-[10px] font-bold text-primary-foreground">
                <span className="flex gap-[2px]">
                  <span className="w-[2px] h-2 bg-primary-foreground rounded-full animate-eq-bar" />
                  <span className="w-[2px] h-3 bg-primary-foreground rounded-full animate-eq-bar [animation-delay:150ms]" />
                  <span className="w-[2px] h-1.5 bg-primary-foreground rounded-full animate-eq-bar [animation-delay:300ms]" />
                </span>
                {isPlaying ? "PLAYING" : "PAUSED"}
              </div>
            )}
          </button>

          {/* Song info */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary mb-2">
              Featured
            </p>
            <h1 className="font-heading text-2xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-3 line-clamp-2 tracking-tight">
              {activeSong.title}
            </h1>
            {artist && (
              <Link to={artistPath(artist.name)} className="inline-flex items-center gap-2 mb-4 group">
                {artist.avatar_url && (
                  <img src={artist.avatar_url} alt={artist.name} className="w-7 h-7 rounded-full object-cover ring-2 ring-border" />
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
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-full px-7 py-2.5 transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
              >
                {isCurrent && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" fill="currentColor" />}
                {isCurrent && isPlaying ? "Pause" : "Play Now"}
              </button>
              <Link
                to="/music"
                className="inline-flex items-center gap-1.5 border border-border text-foreground hover:bg-muted font-medium text-sm rounded-full px-6 py-2.5 transition-colors"
              >
                Explore Music
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
                  i === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
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
