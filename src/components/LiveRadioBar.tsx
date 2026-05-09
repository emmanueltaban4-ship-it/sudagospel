import { useEffect, useRef, useState } from "react";
import { Radio, Play, Pause, X, Volume2, VolumeX } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { usePlayer } from "@/hooks/use-player";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "live_radio_dismissed_at";

const LiveRadioBar = () => {
  const { data: settings } = useSiteSettings();
  const { currentTrack, isPlaying: songPlaying, togglePlay } = usePlayer();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const enabled = settings?.live_radio_enabled === "true";
  const url = settings?.live_radio_url || "";
  const title = settings?.live_radio_title || "Live Gospel Radio";

  useEffect(() => {
    const stamp = sessionStorage.getItem(DISMISS_KEY);
    if (stamp && Date.now() - Number(stamp) < 30 * 60 * 1000) setDismissed(true);
  }, []);

  // Pause radio if a song starts playing
  useEffect(() => {
    if (songPlaying && playing) {
      audioRef.current?.pause();
      setPlaying(false);
    }
  }, [songPlaying, playing]);

  if (!enabled || !url || dismissed) return null;

  const toggleRadio = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); return; }
    // Pause song player if running
    if (currentTrack && songPlaying) togglePlay();
    a.play().then(() => setPlaying(true)).catch(() => {});
  };

  const dismiss = () => {
    audioRef.current?.pause();
    setPlaying(false);
    sessionStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  // Sit just above the MiniPlayer / BottomNav
  const bottomOffset = currentTrack ? "bottom-[150px] md:bottom-[88px]" : "bottom-[64px] md:bottom-3";

  return (
    <div className={`fixed left-1/2 -translate-x-1/2 z-30 px-3 w-full max-w-md ${bottomOffset}`}>
      <div className="rounded-full bg-card/95 backdrop-blur border border-primary/30 shadow-lg shadow-primary/10 flex items-center gap-2 pl-2 pr-1 py-1">
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 flex-shrink-0">
          <Radio className="h-3.5 w-3.5 text-primary" />
          {playing && <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary leading-none">Live</p>
          <p className="text-xs font-semibold truncate leading-tight">{title}</p>
        </div>
        <Button onClick={toggleRadio} size="icon" variant="ghost" className="h-8 w-8 rounded-full">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button onClick={() => { setMuted((m) => { if (audioRef.current) audioRef.current.muted = !m; return !m; }); }} size="icon" variant="ghost" className="h-8 w-8 rounded-full">
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </Button>
        <Button onClick={dismiss} size="icon" variant="ghost" className="h-8 w-8 rounded-full" aria-label="Dismiss radio">
          <X className="h-3.5 w-3.5" />
        </Button>
        <audio ref={audioRef} src={url} preload="none" />
      </div>
    </div>
  );
};

export default LiveRadioBar;
