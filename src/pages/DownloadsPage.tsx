import { useState, useEffect } from "react";
import { usePlayer, Track } from "@/hooks/use-player";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Download, Play, Pause, Trash2, Music, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DownloadedSong {
  id: string;
  title: string;
  artist: string;
  fileUrl: string;
  coverUrl?: string;
  downloadedAt: string;
}

const STORAGE_KEY = "sudagospel_downloads";

export const getDownloads = (): DownloadedSong[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
};

export const addDownload = (song: DownloadedSong) => {
  const downloads = getDownloads();
  if (!downloads.find(d => d.id === song.id)) {
    downloads.unshift(song);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(downloads));
  }
};

export const removeDownload = (id: string) => {
  const downloads = getDownloads().filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(downloads));
};

const DownloadsPage = () => {
  const [downloads, setDownloads] = useState<DownloadedSong[]>([]);
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();

  useDocumentMeta({
    title: "Downloads - SudaGospel",
    description: "Your downloaded songs for offline listening on SudaGospel.",
  });

  useEffect(() => {
    setDownloads(getDownloads());
  }, []);

  const handlePlay = (song: DownloadedSong) => {
    const track: Track = { id: song.id, title: song.title, artist: song.artist, fileUrl: song.fileUrl, coverUrl: song.coverUrl };
    if (currentTrack?.id === song.id) togglePlay();
    else play(track, downloads.map(d => ({ id: d.id, title: d.title, artist: d.artist, fileUrl: d.fileUrl, coverUrl: d.coverUrl })));
  };

  const handleRemove = (id: string) => {
    removeDownload(id);
    setDownloads(getDownloads());
    toast.success("Removed from downloads");
  };

  return (
    <Layout>
      <div className="px-4 lg:px-8 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-extrabold text-foreground">Downloads</h1>
            <p className="text-xs text-muted-foreground">{downloads.length} songs saved</p>
          </div>
        </div>

        {downloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <WifiOff className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-heading text-lg font-bold text-foreground mb-1">No Downloads Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Download songs to listen offline. Tap the download button on any song.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {downloads.map((song) => {
              const isCurrent = currentTrack?.id === song.id;
              return (
                <div
                  key={song.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer group ${
                    isCurrent ? "bg-primary/5" : "hover:bg-muted/50"
                  }`}
                  onClick={() => handlePlay(song)}
                >
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                    {song.coverUrl ? (
                      <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover"  loading="lazy" decoding="async" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Music className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isCurrent && isPlaying ? (
                        <Pause className="h-4 w-4 text-white" />
                      ) : (
                        <Play className="h-4 w-4 text-white" fill="white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>
                      {song.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); handleRemove(song.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
