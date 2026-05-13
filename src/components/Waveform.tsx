import { useMemo } from "react";

interface WaveformProps {
  trackId: string;
  progress: number; // 0..1
  onSeek: (pct: number) => void;
  bars?: number;
}

// Deterministic synthetic waveform (no audio decoding, low CPU).
// Produces a stable bar pattern per trackId so repeat plays look identical.
const Waveform = ({ trackId, progress, onSeek, bars = 64 }: WaveformProps) => {
  const heights = useMemo(() => {
    // simple seeded PRNG from string
    let h = 2166136261;
    for (let i = 0; i < trackId.length; i++) {
      h ^= trackId.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const arr: number[] = [];
    for (let i = 0; i < bars; i++) {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      const r = ((h >>> 0) % 1000) / 1000;
      // shape: pseudo musical envelope (low edges, taller mid)
      const env = 0.55 + 0.45 * Math.sin((i / bars) * Math.PI);
      arr.push(0.25 + r * 0.75 * env);
    }
    return arr;
  }, [trackId, bars]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(pct);
  };

  const handleTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches[0]?.clientX;
    if (x === undefined) return;
    const pct = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    onSeek(pct);
  };

  return (
    <div
      className="relative h-12 w-full cursor-pointer select-none"
      onClick={handleClick}
      onTouchMove={handleTouch}
      onTouchStart={handleTouch}
    >
      <div className="absolute inset-0 flex items-center gap-[2px]">
        {heights.map((h, i) => {
          const filled = i / bars < progress;
          return (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-colors ${
                filled ? "bg-primary" : "bg-muted-foreground/25"
              }`}
              style={{ height: `${Math.round(h * 100)}%` }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Waveform;
