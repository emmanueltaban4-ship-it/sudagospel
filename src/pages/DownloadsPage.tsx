import { usePlayer, Track } from "@/hooks/use-player";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import {
  Download,
  Play,
  Pause,
  Trash2,
  Music,
  WifiOff,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  offlineDownloads,
  useOfflineDownloads,
  type DownloadMeta,
} from "@/lib/offline-downloads";

// ---- Backwards-compat exports (used by FullScreenPlayer & LibraryPage) ----
export interface DownloadedSong {
  id: string;
  title: string;
  artist: string;
  fileUrl: string;
  coverUrl?: string;
  downloadedAt?: string;
}

/** Returns completed downloads — keeps the old shape for legacy callers. */
export const getDownloads = (): DownloadedSong[] =>
  offlineDownloads
    .list()
    .filter((d) => d.status === "completed")
    .map(({ id, title, artist, fileUrl, coverUrl, downloadedAt }) => ({
      id,
      title,
      artist,
      fileUrl,
      coverUrl,
      downloadedAt,
    }));

/** Queues a song for offline download. */
export const addDownload = (song: DownloadedSong) => {
  const meta: DownloadMeta = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    fileUrl: song.fileUrl,
    coverUrl: song.coverUrl,
  };
  void offlineDownloads.enqueue(meta);
  toast.info(`Downloading "${song.title}"…`);
};

export const removeDownload = (id: string) => {
  void offlineDownloads.remove(id);
};

// ----------------------------------------------------------------------------

const formatBytes = (b: number) => {
  if (!b) return "";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

const DownloadsPage = () => {
  const items = useOfflineDownloads();
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();

  useDocumentMeta({
    title: "Downloads - SudaGospel",
    description: "Manage your offline songs on SudaGospel.",
  });

  const completed = items.filter((d) => d.status === "completed");

  const handlePlay = (song: typeof items[number]) => {
    const queue: Track[] = completed.map((d) => ({
      id: d.id,
      title: d.title,
      artist: d.artist,
      fileUrl: d.fileUrl,
      coverUrl: d.coverUrl,
    }));
    const track: Track = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      fileUrl: song.fileUrl,
      coverUrl: song.coverUrl,
    };
    if (currentTrack?.id === song.id) togglePlay();
    else play(track, queue);
  };

  const totalBytes = completed.reduce((s, d) => s + (d.total || 0), 0);

  return (
    <Layout>
      <div className="px-4 lg:px-8 py-6 pb-32">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-xl font-extrabold text-foreground">Downloads</h1>
            <p className="text-xs text-muted-foreground">
              {completed.length} saved
              {totalBytes ? ` · ${formatBytes(totalBytes)}` : ""}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <WifiOff className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-heading text-lg font-bold text-foreground mb-1">
              No Downloads Yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Tap the download button on any song to save it for offline listening.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((song) => {
              const isCurrent = currentTrack?.id === song.id;
              const pct =
                song.total > 0
                  ? Math.min(100, Math.round((song.loaded / song.total) * 100))
                  : 0;
              const isActive =
                song.status === "downloading" ||
                song.status === "paused" ||
                song.status === "queued" ||
                song.status === "error";

              return (
                <div
                  key={song.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors group ${
                    isCurrent ? "bg-primary/5" : "hover:bg-muted/50"
                  } ${song.status === "completed" ? "cursor-pointer" : ""}`}
                  onClick={() => song.status === "completed" && handlePlay(song)}
                >
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                    {song.coverUrl ? (
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Music className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    {song.status === "completed" && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {isCurrent && isPlaying ? (
                          <Pause className="h-4 w-4 text-white" />
                        ) : (
                          <Play className="h-4 w-4 text-white" fill="white" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isCurrent ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {song.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {song.artist}
                    </p>

                    {isActive && (
                      <div className="mt-1.5 space-y-1">
                        <Progress value={pct} className="h-1" />
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="capitalize">
                            {song.status === "error" ? (
                              <span className="text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {song.error || "Failed"}
                              </span>
                            ) : song.status === "queued" ? (
                              "Waiting…"
                            ) : (
                              song.status
                            )}
                          </span>
                          <span>
                            {formatBytes(song.loaded)}
                            {song.total ? ` / ${formatBytes(song.total)}` : ""}
                            {song.total ? ` · ${pct}%` : ""}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {song.status === "downloading" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => offlineDownloads.pause(song.id)}
                        aria-label="Pause download"
                      >
                        <PauseCircle className="h-5 w-5" />
                      </Button>
                    )}
                    {(song.status === "paused" || song.status === "error") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-primary"
                        onClick={() => offlineDownloads.resume(song.id)}
                        aria-label="Resume download"
                      >
                        <PlayCircle className="h-5 w-5" />
                      </Button>
                    )}
                    {(song.status === "downloading" ||
                      song.status === "paused" ||
                      song.status === "queued" ||
                      song.status === "error") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          offlineDownloads.cancel(song.id);
                          toast.info("Download cancelled");
                        }}
                        aria-label="Cancel download"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {song.status === "completed" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          void offlineDownloads.remove(song.id);
                          toast.success("Removed from downloads");
                        }}
                        aria-label="Delete download"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default DownloadsPage;
