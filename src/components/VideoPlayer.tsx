import { useState } from "react";
import { Play, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  inline?: boolean;
}

/**
 * Extracts YouTube video ID from various URL formats.
 */
const getYoutubeId = (url: string): string | null => {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const VideoPlayer = ({ videoUrl, thumbnailUrl, title, inline }: VideoPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const ytId = getYoutubeId(videoUrl);
  const thumb = thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : undefined);

  if (inline && ytId) {
    return (
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
        {!playing ? (
          <div className="relative h-full w-full cursor-pointer group" onClick={() => setPlaying(true)}>
            {thumb && <img src={thumb} alt={title} className="h-full w-full object-cover"  loading="lazy" decoding="async" />}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
              <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl shadow-primary/40 group-hover:scale-110 transition-transform">
                <Play className="h-7 w-7 text-primary-foreground ml-1" fill="currentColor" />
              </div>
            </div>
          </div>
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
            className="h-full w-full"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            title={title}
          />
        )}
      </div>
    );
  }

  // Non-YouTube or non-inline: direct video element
  if (!ytId) {
    return (
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
        <video src={videoUrl} controls className="h-full w-full" poster={thumb} />
      </div>
    );
  }

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-black cursor-pointer group" onClick={() => setPlaying(true)}>
      {thumb && <img src={thumb} alt={title} className="h-full w-full object-cover"  loading="lazy" decoding="async" />}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
        <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl shadow-primary/40 group-hover:scale-110 transition-transform">
          <Play className="h-7 w-7 text-primary-foreground ml-1" fill="currentColor" />
        </div>
      </div>
      <AnimatePresence>
        {playing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
            onClick={(e) => { e.stopPropagation(); setPlaying(false); }}
          >
            <button className="absolute top-4 right-4 p-2 text-white/70 hover:text-white">
              <X className="h-6 w-6" />
            </button>
            <div className="w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                className="h-full w-full rounded-xl"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
                title={title}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPlayer;
