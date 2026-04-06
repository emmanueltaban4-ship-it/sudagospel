import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { usePlaylists } from "@/hooks/use-playlists";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { getDownloads } from "@/pages/DownloadsPage";
import { ListMusic, Download, Plus, Music, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const LibraryPage = () => {
  const { user } = useAuth();
  const { data: playlists } = usePlaylists();
  const [tab, setTab] = useState<"playlists" | "downloads">("playlists");
  const downloads = getDownloads();

  useDocumentMeta({
    title: "Library - SudaGospel",
    description: "Your playlists and downloaded songs on SudaGospel.",
  });

  const tabs = [
    { key: "playlists" as const, label: "Playlists", icon: ListMusic, count: playlists?.length || 0 },
    { key: "downloads" as const, label: "Downloads", icon: Download, count: downloads.length },
  ];

  return (
    <Layout>
      <div className="px-4 lg:px-8 py-6">
        <h1 className="font-heading text-2xl font-extrabold text-foreground mb-6">Your Library</h1>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              <span className="text-xs opacity-70">({t.count})</span>
            </button>
          ))}
        </div>

        {tab === "playlists" && (
          <div className="space-y-2">
            {!user ? (
              <div className="text-center py-16">
                <ListMusic className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">Sign in to create playlists</p>
                <Link to="/auth">
                  <Button>Sign In</Button>
                </Link>
              </div>
            ) : (
              <>
                <Link
                  to="/playlists"
                  className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Create New Playlist</p>
                    <p className="text-xs text-muted-foreground">Organize your favorite songs</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>

                {playlists?.map(playlist => (
                  <Link
                    key={playlist.id}
                    to={`/playlist/${playlist.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {playlist.cover_url ? (
                        <img src={playlist.cover_url} alt={playlist.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
                          <Music className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {playlist.name}
                      </p>
                      <p className="text-xs text-muted-foreground">Playlist</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </>
            )}
          </div>
        )}

        {tab === "downloads" && (
          <div>
            {downloads.length === 0 ? (
              <div className="text-center py-16">
                <Download className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No downloads yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {downloads.slice(0, 20).map(song => (
                  <Link
                    key={song.id}
                    to={`/song/${song.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {song.coverUrl ? (
                        <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Music className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                    </div>
                  </Link>
                ))}
                <Link to="/downloads" className="block text-center text-sm text-primary font-semibold py-3 hover:underline">
                  View all downloads
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default LibraryPage;
