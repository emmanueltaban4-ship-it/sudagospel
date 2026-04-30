import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Headphones, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { artistPath } from "@/lib/artist-slug";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer, Track } from "@/hooks/use-player";

const AUTOPLAY_MS = 6500;

const HeroSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();

  const { data: featuredSongs } = useQuery({
    queryKey: ["featured-hero-songs"],
    queryFn: async () => {
      // Try curated featured first
      const { data: featured } = await supabase
        .from("featured_content")
        .select("content_id, position")
        .eq("content_type", "hero")
        .order("position", { ascending: true })
        .limit(6);

      if (featured && featured.length > 0) {
        const ids = featured.map((f) => f.content_id);
        const { data } = await supabase
          .from("songs")
          .select("*, artists(id, name, avatar_url, is_verified)")
          .in("id", ids)
          .eq("is_approved", true);
        // preserve order
        return ids
          .map((id) => data?.find((s) => s.id === id))
          .filter(Boolean) as any[];
      }

      // Fallback to top songs
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(id, name, avatar_url, is_verified)")
        .eq("is_approved", true)
        .order("play_count", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const slides = featuredSongs ?? [];
  const total = slides.length;
  const activeSong: any = slides[activeIndex];
  const artist = activeSong?.artists as any;

  // Autoplay + progress tick
  useEffect(() => {
    if (paused || total < 2) return;
    setProgress(0);
    const start = Date.now();
    const tick = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / AUTOPLAY_MS) * 100);
      setProgress(p);
    }, 50);
    const advance = setTimeout(() => {
      setActiveIndex((i) => (i + 1) % total);
    }, AUTOPLAY_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(advance);
    };
  }, [activeIndex, paused, total]);

  const goTo = useCallback(
    (i: number) => {
      if (total === 0) return;
      setActiveIndex(((i % total) + total) % total);
    },
    [total],
  );

  const next = () => goTo(activeIndex + 1);
  const prev = () => goTo(activeIndex - 1);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    touchStart.current = null;
  };

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

  if (total === 0) {
    return (
      <section className="relative px-4 lg:px-6 pt-4 pb-3">
        <div className="relative rounded-3xl overflow-hidden min-h-[320px] md:min-h-[400px] bg-gradient-to-br from-secondary/20 via-card to-primary/15 border border-border/40 flex items-center justify-center">
          <div className="text-center px-8">
            <Sparkles className="h-10 w-10 mx-auto mb-3 text-primary" />
            <h1 className="font-heading text-2xl md:text-4xl font-black text-foreground mb-2">
              Where Faith Meets the <span className="text-gradient-brand">Beat.</span>
            </h1>
            <p className="text-muted-foreground text-sm">Loading featured tracks…</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative px-4 lg:px-6 pt-4 pb-3">
      <div
        className="relative rounded-3xl overflow-hidden min-h-[380px] md:min-h-[460px] bg-[hsl(270,15%,5%)] group/hero"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Layered cover-art backdrops */}
        {slides.map((s: any, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              i === activeIndex ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={i !== activeIndex}
          >
            {s.cover_url ? (
              <img
                src={s.cover_url}
                alt=""
                className={`absolute inset-0 w-full h-full object-cover ${
                  i === activeIndex ? "animate-ken-burns" : ""
                }`}
                loading={i === 0 ? "eager" : "lazy"}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-secondary/20 to-card" />
            )}
            {/* Multi-layer scrim for legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(270,15%,5%)]/95 via-[hsl(270,15%,5%)]/70 to-[hsl(270,15%,5%)]/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(270,15%,5%)] via-transparent to-transparent" />
            <div className="absolute -top-20 -right-20 w-[420px] h-[420px] bg-primary/15 rounded-full blur-[140px]" />
            <div className="absolute -bottom-20 left-1/4 w-[340px] h-[340px] bg-secondary/15 rounded-full blur-[120px]" />
          </div>
        ))}

        {/* Foreground content */}
        <div className="relative flex flex-col md:flex-row items-stretch min-h-[380px] md:min-h-[460px]">
          {/* Text */}
          <div className="flex-1 p-6 sm:p-8 md:p-12 lg:p-14 flex flex-col justify-end md:justify-center z-10">
            <div className="inline-flex w-fit items-center gap-1.5 bg-primary/15 border border-primary/30 backdrop-blur-md rounded-full px-3 py-1.5 mb-4 md:mb-5">
              <Headphones className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                Featured · South Sudan Gospel
              </span>
            </div>

            <h1
              key={activeIndex /* re-trigger animation */}
              className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 tracking-tight leading-[1.05] animate-fade-in"
            >
              {activeSong.title}
            </h1>

            <Link
              to={artist?.name ? artistPath(artist.name) : "/artists"}
              className="text-white/70 hover:text-primary transition-colors text-sm md:text-base font-medium mb-5 md:mb-7"
            >
              {artist?.name || "Unknown Artist"}
              {activeSong.genre && <span className="text-white/40"> · {activeSong.genre}</span>}
            </Link>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={handlePlay}
                className="inline-flex items-center gap-2 bg-gradient-gold text-primary-foreground font-bold text-sm rounded-full pl-5 pr-6 py-3 transition-all active:scale-95 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.03]"
              >
                {isCurrent && isPlaying ? (
                  <Pause className="h-4 w-4" fill="currentColor" />
                ) : (
                  <Play className="h-4 w-4" fill="currentColor" />
                )}
                {isCurrent && isPlaying ? "Pause" : "Play Now"}
              </button>
              <Link
                to={`/song/${activeSong.id}`}
                className="inline-flex items-center gap-1.5 border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 font-semibold text-sm rounded-full px-5 py-3 transition-all"
              >
                Details <ChevronRight className="h-4 w-4" />
              </Link>

              {isCurrent && isPlaying && (
                <span className="inline-flex items-end gap-[2px] h-5 ml-1">
                  <span className="w-[3px] bg-primary rounded-full animate-eq-bar h-2" />
                  <span className="w-[3px] bg-primary rounded-full animate-eq-bar h-4 [animation-delay:120ms]" />
                  <span className="w-[3px] bg-primary rounded-full animate-eq-bar h-3 [animation-delay:240ms]" />
                  <span className="w-[3px] bg-primary rounded-full animate-eq-bar h-5 [animation-delay:360ms]" />
                </span>
              )}
            </div>
          </div>

          {/* Cover stack (desktop) */}
          <div className="hidden md:flex w-[42%] lg:w-[38%] items-center justify-center p-8 lg:p-12 relative">
            <div className="relative w-full max-w-[320px] aspect-square">
              {slides.map((s: any, i) => {
                const offset = i - activeIndex;
                const abs = Math.abs(offset);
                if (abs > 2) return null;
                return (
                  <button
                    key={s.id}
                    onClick={() => goTo(i)}
                    className="absolute inset-0 rounded-2xl overflow-hidden transition-all duration-700 ease-out shadow-2xl"
                    style={{
                      transform: `translateX(${offset * 22}%) translateY(${abs * 8}px) rotate(${offset * 4}deg) scale(${1 - abs * 0.12})`,
                      opacity: abs === 0 ? 1 : 0.55 - abs * 0.15,
                      zIndex: 10 - abs,
                      filter: abs === 0 ? "none" : "blur(1px)",
                    }}
                    aria-label={`Show ${s.title}`}
                  >
                    {s.cover_url ? (
                      <img
                        src={s.cover_url}
                        alt={s.title}
                        className="w-full h-full object-cover"
                        loading={abs === 0 ? "eager" : "lazy"}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center text-5xl font-heading font-black text-white/80">
                        {s.title[0]}
                      </div>
                    )}
                    {abs === 0 && (
                      <div className="absolute inset-0 ring-2 ring-primary/40 rounded-2xl pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Nav arrows */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white grid place-items-center opacity-0 group-hover/hero:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white grid place-items-center opacity-0 group-hover/hero:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Progress dots */}
        {total > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((_: any, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-500 ${
                    isActive ? "w-10 bg-white/20" : "w-1.5 bg-white/25 hover:bg-white/40"
                  }`}
                >
                  {isActive && (
                    <span
                      className="absolute inset-y-0 left-0 bg-primary rounded-full transition-[width] duration-100 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
