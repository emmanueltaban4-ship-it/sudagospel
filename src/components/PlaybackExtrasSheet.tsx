import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings2, Gauge, Moon, SlidersHorizontal, FileText, WifiOff } from "lucide-react";
import { usePlayer } from "@/hooks/use-player";
import { supabase } from "@/integrations/supabase/client";

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];
const SLEEP_OPTIONS = [5, 10, 15, 30, 45, 60];

interface Props {
  trackId: string;
  trigger: React.ReactNode;
}

const formatRemaining = (endsAt: number | null) => {
  if (!endsAt) return null;
  const ms = endsAt - Date.now();
  if (ms <= 0) return null;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const PlaybackExtrasSheet = ({ trackId, trigger }: Props) => {
  const {
    playbackRate, setPlaybackRate,
    dataSaver, setDataSaver,
    eqEnabled, setEqEnabled, eqBass, eqMid, eqTreble, setEqBands,
    sleepTimerEndsAt, setSleepTimer,
  } = usePlayer();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"settings" | "lyrics">("settings");
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [, force] = useState(0);

  // Tick once a second so the sleep-timer countdown re-renders.
  useEffect(() => {
    if (!open || !sleepTimerEndsAt) return;
    const id = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [open, sleepTimerEndsAt]);

  // Lazy-fetch lyrics when the lyrics tab opens or track changes.
  useEffect(() => {
    if (!open || tab !== "lyrics" || !trackId) return;
    let cancelled = false;
    setLyricsLoading(true);
    supabase
      .from("songs")
      .select("lyrics")
      .eq("id", trackId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setLyrics((data?.lyrics as string | null) ?? null);
        setLyricsLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, tab, trackId]);

  const remaining = formatRemaining(sleepTimerEndsAt);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl px-0 overflow-hidden flex flex-col">
        <SheetHeader className="px-5">
          <SheetTitle className="text-left flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4 text-primary" /> Playback
          </SheetTitle>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex gap-2 px-5 mt-2">
          <button
            onClick={() => setTab("settings")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              tab === "settings" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setTab("lyrics")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              tab === "lyrics" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Lyrics
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {tab === "settings" ? (
            <>
              {/* Playback speed */}
              <section>
                <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
                  <Gauge className="h-4 w-4 text-primary" /> Playback speed
                </div>
                <div className="flex flex-wrap gap-2">
                  {SPEEDS.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={playbackRate === s ? "default" : "outline"}
                      onClick={() => setPlaybackRate(s)}
                      className="rounded-full h-8 text-xs tabular-nums"
                    >
                      {s}x
                    </Button>
                  ))}
                </div>
              </section>

              {/* Sleep timer */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Moon className="h-4 w-4 text-primary" /> Sleep timer
                  </div>
                  {remaining && (
                    <span className="text-xs text-primary tabular-nums">{remaining}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {SLEEP_OPTIONS.map((m) => (
                    <Button
                      key={m}
                      size="sm"
                      variant="outline"
                      onClick={() => setSleepTimer(m)}
                      className="rounded-full h-8 text-xs"
                    >
                      {m}m
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant={sleepTimerEndsAt ? "destructive" : "ghost"}
                    onClick={() => setSleepTimer(null)}
                    className="rounded-full h-8 text-xs"
                    disabled={!sleepTimerEndsAt}
                  >
                    Off
                  </Button>
                </div>
              </section>

              {/* Equalizer */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <SlidersHorizontal className="h-4 w-4 text-primary" /> Equalizer
                  </div>
                  <Switch checked={eqEnabled} onCheckedChange={setEqEnabled} />
                </div>
                <div className={`space-y-3 ${eqEnabled ? "" : "opacity-40 pointer-events-none"}`}>
                  {[
                    { label: "Bass", val: eqBass, key: "bass" as const },
                    { label: "Mid", val: eqMid, key: "mid" as const },
                    { label: "Treble", val: eqTreble, key: "treble" as const },
                  ].map((b) => (
                    <div key={b.key}>
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                        <span>{b.label}</span>
                        <span className="tabular-nums">{b.val > 0 ? "+" : ""}{b.val} dB</span>
                      </div>
                      <Slider
                        value={[b.val]}
                        min={-12}
                        max={12}
                        step={1}
                        onValueChange={([v]) => setEqBands({ [b.key]: v })}
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  3-band equalizer. Disable if playback stutters on low-end devices.
                </p>
              </section>

              {/* Data saver */}
              <section>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <WifiOff className="h-4 w-4 text-primary" /> Data saver
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Skips preloading the next track. Reduces background data use.
                    </p>
                  </div>
                  <Switch checked={dataSaver} onCheckedChange={setDataSaver} />
                </div>
              </section>
            </>
          ) : (
            <section>
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4 text-primary" /> Lyrics
              </div>
              {lyricsLoading ? (
                <div className="text-center text-sm text-muted-foreground py-12">Loading lyrics…</div>
              ) : lyrics && lyrics.trim() ? (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                  {lyrics}
                </pre>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-12">
                  No lyrics available for this song yet.
                </div>
              )}
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PlaybackExtrasSheet;
