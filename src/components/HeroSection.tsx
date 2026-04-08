import { useState, useEffect } from "react";
import { Play, Pause, ChevronRight, Flame, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { artistPath } from "@/lib/artist-slug";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer, Track } from "@/hooks/use-player";
import heroListenerImg from "@/assets/hero-listener.jpg";

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

  // Always show the inspirational hero with image
  return (
    <section className="relative px-4 lg:px-6 pt-4 pb-3">
      <div className="relative rounded-3xl overflow-hidden min-h-[340px] md:min-h-[440px]">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 via-background to-primary/15" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-secondary/12 rounded-full blur-[100px] animate-pulse [animation-delay:1.5s]" />

        <div className="relative flex flex-col md:flex-row items-center min-h-[340px] md:min-h-[440px]">
          {/* Text content */}
          <div className="flex-1 p-8 md:p-12 lg:p-16 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Headphones className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                South Sudan's #1 Gospel Platform
              </span>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-4 tracking-tight leading-[1.05]">
              Where Faith
              <br />
              Meets the
              <br />
              <span className="text-gradient-brand">Beat.</span>
            </h1>

            <p className="text-muted-foreground text-sm md:text-base max-w-md mb-8 leading-relaxed mx-auto md:mx-0">
              Stream thousands of gospel hits, discover new artists, and let worship move your soul — anytime, anywhere.
            </p>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              {activeSong ? (
                <button
                  onClick={handlePlay}
                  className="inline-flex items-center gap-2 bg-gradient-gold text-primary-foreground font-bold text-sm rounded-full px-8 py-3.5 transition-all active:scale-95 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02]"
                >
                  {isCurrent && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" fill="currentColor" />}
                  {isCurrent && isPlaying ? "Pause" : "Play Now"}
                </button>
              ) : (
                <Link
                  to="/music"
                  className="inline-flex items-center gap-2 bg-gradient-gold text-primary-foreground font-bold text-sm rounded-full px-8 py-3.5 transition-all active:scale-95 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02]"
                >
                  <Play className="h-4 w-4" fill="currentColor" /> Start Listening
                </Link>
              )}
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 border border-border/60 bg-card/50 backdrop-blur-sm text-foreground hover:bg-muted/50 font-semibold text-sm rounded-full px-6 py-3.5 transition-all"
              >
                Upload Music <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Now playing info */}
            {activeSong && (
              <div className={`mt-6 flex items-center gap-3 justify-center md:justify-start transition-all duration-500 ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shadow-md ring-1 ring-border/50 flex-shrink-0">
                  {activeSong.cover_url ? (
                    <img src={activeSong.cover_url} alt={activeSong.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {activeSong.title[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate max-w-[200px]">
                    {isCurrent && (
                      <span className="inline-flex gap-[2px] mr-1.5 align-middle">
                        <span className="w-[2px] h-2 bg-primary rounded-full inline-block animate-eq-bar" />
                        <span className="w-[2px] h-3 bg-primary rounded-full inline-block animate-eq-bar [animation-delay:150ms]" />
                        <span className="w-[2px] h-1.5 bg-primary rounded-full inline-block animate-eq-bar [animation-delay:300ms]" />
                      </span>
                    )}
                    {activeSong.title}
                  </p>
                  <Link to={artistPath(artist?.name || '')} className="text-[11px] text-muted-foreground hover:text-primary transition-colors">
                    {artist?.name || "Unknown"} • {activeSong.genre || "Gospel"}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Hero image */}
          <div className="relative w-full md:w-[45%] lg:w-[42%] flex-shrink-0 self-end">
            <div className="relative">
              {/* Glow behind image */}
              <div className="absolute -inset-10 bg-primary/10 rounded-full blur-[80px] opacity-60" />
              <img
                src={heroListenerImg}
                alt="Woman enjoying gospel music with headphones"
                className="relative w-full h-auto object-cover rounded-t-3xl md:rounded-3xl md:mr-6 max-h-[350px] md:max-h-[420px] object-top"
                width={896}
                height={1152}
              />
              {/* Gradient fade at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background/80 to-transparent md:hidden" />
            </div>
          </div>
        </div>

        {/* Carousel dots for featured songs */}
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
